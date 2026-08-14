package com.unihome.api.service;

import com.unihome.api.dto.AnnonceAiRequest;
import com.unihome.api.dto.AnnonceDetailDTO;
import com.unihome.api.dto.AnnonceRequestDTO;
import com.unihome.api.dto.AnnonceRechercheDTO;
import com.unihome.api.dto.AnnonceUpdateRequestDTO;
import com.unihome.api.dto.FraudScoreResponse;
import com.unihome.api.dto.AnnonceResponseDTO;
import com.unihome.api.dto.OwnerAnnonceDTO;
import com.unihome.api.entity.Annonce;
import com.unihome.api.entity.AnnonceAvecDistance;
import com.unihome.api.entity.AnnonceEquipement;
import com.unihome.api.entity.AnnonceEquipementId;
import com.unihome.api.entity.Consultation;
import com.unihome.api.entity.ContactAnnonce;
import com.unihome.api.entity.Equipement;
import com.unihome.api.entity.Logement;
import com.unihome.api.entity.Photo;
import com.unihome.api.entity.Proprietaire;
import com.unihome.api.entity.StatutAnnonceEnum;
import com.unihome.api.repository.AnnonceEquipementRepository;
import com.unihome.api.repository.AnnonceRepository;
import com.unihome.api.repository.AnnonceAvecDistanceRepository;
import com.unihome.api.repository.AvisRepository;
import com.unihome.api.repository.ConsultationRepository;
import com.unihome.api.repository.ContactAnnonceRepository;
import com.unihome.api.repository.EquipementRepository;
import com.unihome.api.repository.EtudiantRepository;
import com.unihome.api.repository.FavoriRepository;
import com.unihome.api.repository.LogementRepository;
import com.unihome.api.repository.PhotoRepository;
import com.unihome.api.repository.RecommandationRepository;
import com.unihome.api.repository.SignalementRepository;
import com.unihome.api.util.AiReasonMessages;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnnonceService {

    private final AnnonceRepository annonceRepository;
    private final LogementRepository logementRepository;
    private final ContactAnnonceService contactAnnonceService;
    private final PhotoService photoService;
    private final AnnonceAiClient annonceAiClient;
    private final AnnonceAvecDistanceRepository annonceAvecDistanceRepository;
    private final EquipementRepository equipementRepository;
    private final AnnonceEquipementRepository annonceEquipementRepository;
    private final ContactAnnonceRepository contactAnnonceRepository;
    private final PhotoRepository photoRepository;
    private final FavoriRepository favoriRepository;
    private final ConsultationRepository consultationRepository;
    private final EtudiantRepository etudiantRepository;
    private final SignalementRepository signalementRepository;
    private final AvisRepository avisRepository;
    private final RecommandationRepository recommandationRepository;
    private final EmailService emailService;

    private static final List<StatutAnnonceEnum> STATUTS_ACTIFS = List.of(
            StatutAnnonceEnum.VALIDEE,
            StatutAnnonceEnum.EN_ATTENTE,
            StatutAnnonceEnum.SUSPENDUE
    );

    @Transactional
    public Annonce creerAnnonce(UUID logementId, Annonce annonceData) {
        return creerAnnonceInterne(logementId, annonceData, null);
    }

    @Transactional
    public Annonce creerAnnonce(UUID logementId, AnnonceRequestDTO requestDTO) {
        Annonce annonceData = mapToAnnonceEntity(requestDTO);
        Annonce savedAnnonce = creerAnnonceInterne(logementId, annonceData, requestDTO.getPhotos());

        List<ContactAnnonce> contacts = requestDTO.getContacts().stream()
                .map(contactDTO -> {
                    ContactAnnonce contact = new ContactAnnonce();
                    contact.setPlateforme(contactDTO.getPlateforme());
                    contact.setValeur(contactDTO.getValeur());
                    return contact;
                })
                .collect(Collectors.toList());

        contactAnnonceService.ajouterContacts(savedAnnonce, contacts);
        ajouterEquipements(savedAnnonce, requestDTO.getEquipementIds());
        int incomingCount = requestDTO.getPhotos() != null ? requestDTO.getPhotos().size() : 0;
        photoService.validatePhotoCount(savedAnnonce, incomingCount);
        List<String> photoUrls = new ArrayList<>();
        if (requestDTO.getPhotos() != null) {
            for (MultipartFile photoFile : requestDTO.getPhotos()) {
                Photo photo = photoService.uploaderPhoto(photoFile, savedAnnonce);
                photoUrls.add(photo.getUrl());
            }
        }

        analyserEtAppliquerScore(savedAnnonce, photoUrls);

        Annonce resultat = annonceRepository.save(savedAnnonce);
        notifierProprietaireDecision(resultat);
        return resultat;
    }

    /**
     * Notifie le proprietaire par email de la decision de verification
     * automatique (VALIDEE / EN_ATTENTE / REJETEE). Non bloquant : les echecs
     * d'envoi sont geres par EmailService.
     */
    private void notifierProprietaireDecision(Annonce annonce) {
        Logement logement = annonce.getLogement();
        if (logement == null || logement.getProprietaire() == null
                || logement.getProprietaire().getEmail() == null) {
            return;
        }
        String messageOwner = AiReasonMessages.forRole(annonce.getRaisonStatut(), "owner", null);
        emailService.sendAnnonceDecisionEmail(
                logement.getProprietaire().getEmail(),
                annonce.getTitre(),
                annonce.getStatut(),
                annonce.getScoreConfiance(),
                messageOwner);
    }

    /**
     * Construit la requete IA a partir de l'annonce et applique la decision
     * de fraude (statut, score, raisonStatut). Utilise a la creation et a la
     * re-soumission apres modification.
     */
    private void analyserEtAppliquerScore(Annonce annonce, List<String> photoUrls) {
        Logement logement = annonce.getLogement();
        String proprietaireNomComplet = null;
        if (logement != null && logement.getProprietaire() != null) {
            String prenom = logement.getProprietaire().getPrenom();
            String nom = logement.getProprietaire().getNom();
            proprietaireNomComplet = String.format("%s %s", prenom != null ? prenom : "", nom != null ? nom : "").trim();
        }

        AnnonceAiRequest aiRequest = new AnnonceAiRequest(
                annonce.getTitre(),
                annonce.getDescription(),
                annonce.getLoyer(),
                photoUrls,
                logement != null ? logement.getJustificatifUrl() : null,
            proprietaireNomComplet,
            logement != null ? logement.getVille() : null,
            logement != null ? logement.getAdresse() : null,
            logement != null && logement.getTypeLogement() != null ? logement.getTypeLogement().name() : null,
            logement != null ? logement.getSuperficie() : null,
            annonce.getChargesIncluses(),
            logement != null && logement.getProprietaire() != null ? logement.getProprietaire().getEstVerifieCin() : null,
            logement != null && logement.getProprietaire() != null ? logement.getProprietaire().getNoteMoyenne() : null,
            logement != null && logement.getProprietaire() != null ? logement.getProprietaire().getNbAvisTotal() : null
        );

        FraudScoreResponse fraudResponse = annonceAiClient.analyserAnnonce(aiRequest);
        appliquerDecisionFraude(annonce, fraudResponse);
    }

    private Annonce creerAnnonceInterne(UUID logementId, Annonce annonceData, List<?> photos) {
        validatePhotoCount(photos);

        Logement logement = logementRepository.findById(logementId)
                .orElseThrow(() -> new EntityNotFoundException("Logement not found with id: " + logementId));

        archiverAnnonceActive(logement.getId());

        annonceData.setLogement(logement);
        annonceData.setDatePublication(LocalDateTime.now());
        annonceData.setNbSignalements(0);
        annonceData.setStatut(StatutAnnonceEnum.EN_ATTENTE);
        annonceData.setScoreConfiance((short) 0);
        annonceData.setDetailScore(new HashMap<>());

        return annonceRepository.save(annonceData);
    }

    private void archiverAnnonceActive(UUID logementId) {
        Optional<Annonce> activeAnnonce = annonceRepository
                .findFirstByLogementIdAndStatutInOrderByDatePublicationDesc(logementId, STATUTS_ACTIFS);
        if (activeAnnonce.isEmpty()) {
            return;
        }
        Annonce annonce = activeAnnonce.get();
        annonce.setStatut(StatutAnnonceEnum.ARCHIVEE);
        annonce.setRaisonStatut("Archivee automatiquement (nouvelle annonce)");
        annonceRepository.save(annonce);
    }

    private void appliquerDecisionFraude(Annonce annonceData, FraudScoreResponse fraudResponse) {
        Short scoreGlobal = fraudResponse != null ? fraudResponse.getScoreGlobal() : null;
        if (scoreGlobal == null) {
            log.warn("IA indisponible. Annonce en EN_ATTENTE sans score.");
            annonceData.setStatut(StatutAnnonceEnum.EN_ATTENTE);
            annonceData.setScoreConfiance(null);
            annonceData.setDetailScore(new HashMap<>());
            annonceData.setRaisonStatut("IA indisponible - Validation manuelle requise");
            return;
        }

        if (!hasAllAiRoleMessages(fraudResponse)) {
            log.warn("Réponse IA incomplète: messages student/owner/admin manquants. Annonce en EN_ATTENTE sans score.");
            annonceData.setStatut(StatutAnnonceEnum.EN_ATTENTE);
            annonceData.setScoreConfiance(null);
            annonceData.setDetailScore(new HashMap<>());
            annonceData.setRaisonStatut("Réponse IA incomplète - Validation manuelle requise");
            return;
        }

        String raisonnement = fraudResponse.getRaisonnement();
        StatutAnnonceEnum decision;
        String fallbackReason;
        if (scoreGlobal >= 70) {
            decision = StatutAnnonceEnum.VALIDEE;
            fallbackReason = raisonnement != null && !raisonnement.isBlank()
                ? raisonnement
                : "Valide par IA - Score: " + scoreGlobal;
        } else if (scoreGlobal >= 40) {
            decision = StatutAnnonceEnum.EN_ATTENTE;
            fallbackReason = raisonnement != null && !raisonnement.isBlank()
                ? raisonnement
                : "En attente par IA - Score: " + scoreGlobal;
        } else {
            decision = StatutAnnonceEnum.REJETEE;
            fallbackReason = raisonnement != null && !raisonnement.isBlank()
                ? raisonnement
                : "Rejete par IA - Score: " + scoreGlobal;
        }

        annonceData.setStatut(decision);
        annonceData.setScoreConfiance(scoreGlobal);
        annonceData.setDetailScore(fraudResponse.getDetailScore() != null ? fraudResponse.getDetailScore() : new HashMap<>());
        annonceData.setRaisonStatut(AiReasonMessages.toPayloadJson(
            scoreGlobal,
            decision,
            fallbackReason,
            fraudResponse.getMessages()
        ));
    }

    private boolean hasAllAiRoleMessages(FraudScoreResponse fraudResponse) {
        Map<String, String> messages = fraudResponse != null ? fraudResponse.getMessages() : null;
        return hasAiRoleMessage(messages, "student")
            && hasAiRoleMessage(messages, "owner")
            && hasAiRoleMessage(messages, "admin");
    }

    private boolean hasAiRoleMessage(Map<String, String> messages, String role) {
        if (messages == null) {
            return false;
        }
        String value = messages.get(role);
        return value != null && !value.isBlank();
    }

    private Annonce mapToAnnonceEntity(AnnonceRequestDTO requestDTO) {
        Annonce annonce = new Annonce();
        annonce.setTitre(requestDTO.getTitre());
        annonce.setDescription(requestDTO.getDescription());
        annonce.setLoyer(requestDTO.getLoyer());
        annonce.setChargesIncluses(requestDTO.getChargesIncluses());
        return annonce;
    }

    private void ajouterEquipements(Annonce annonce, List<Integer> equipementIds) {
        if (equipementIds == null || equipementIds.isEmpty()) {
            throw new IllegalArgumentException("Au moins un equipement est obligatoire.");
        }

        Set<Integer> uniqueIds = new HashSet<>(equipementIds);
        List<Equipement> equipements = equipementRepository.findAllById(uniqueIds);
        if (equipements.size() != uniqueIds.size()) {
            throw new EntityNotFoundException("Un ou plusieurs equipements sont introuvables.");
        }

        List<AnnonceEquipement> annonceEquipements = equipements.stream()
                .map(equipement -> new AnnonceEquipement(
                        new AnnonceEquipementId(annonce.getId(), equipement.getId()),
                        annonce,
                        equipement
                ))
                .collect(Collectors.toList());

        annonceEquipementRepository.saveAll(annonceEquipements);
    }


    private void validatePhotoCount(List<?> photos) {
        if (photos == null) {
            return;
        }
        int photoCount = photos.size();
        if (photoCount < 2 || photoCount > 10) {
            throw new IllegalArgumentException("Une annonce doit contenir entre 2 et 10 photos.");
        }
    }


    @Transactional(readOnly = true)
    public List<AnnonceRechercheDTO> getAnnoncesPourRecherche() {
        return annonceRepository.findActiveAnnonces().stream()
                .map(this::toRechercheDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OwnerAnnonceDTO> getAnnoncesProprietaire(UUID proprietaireId) {
        return annonceRepository.findByLogementProprietaireIdOrderByDatePublicationDesc(proprietaireId).stream()
                .map(this::toOwnerAnnonceDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<AnnonceRechercheDTO> rechercherAnnoncesProches(UUID universiteId, Double rayonMetres, Pageable pageable) {
        return annonceAvecDistanceRepository
                .findByUniversiteWithinDistance(universiteId, rayonMetres, pageable)
                .map(this::toRechercheDTO);
    }

    public AnnonceRechercheDTO buildRechercheDTO(Annonce annonce) {
        return toRechercheDTO(annonce);
    }

    @Transactional
    public AnnonceDetailDTO getAnnonceDetail(UUID annonceId, UUID currentUserId, boolean includeContacts) {
        Annonce annonce = annonceRepository.findById(annonceId)
                .orElseThrow(() -> new EntityNotFoundException("Annonce introuvable"));
        if (annonce.getStatut() != StatutAnnonceEnum.VALIDEE) {
            throw new EntityNotFoundException("Annonce introuvable");
        }
        if (currentUserId != null) {
            etudiantRepository.findById(currentUserId).ifPresent(etudiant -> {
                if (includeContacts) {
                    Optional<Consultation> existing = consultationRepository
                            .findTopByEtudiantIdAndAnnonceIdOrderByCreatedAtDesc(currentUserId, annonceId);
                    if (existing.isPresent()) {
                        existing.get().setContactsAffiches(true);
                        consultationRepository.save(existing.get());
                    } else {
                        Consultation c = new Consultation();
                        c.setEtudiant(etudiant);
                        c.setAnnonce(annonce);
                        c.setContactsAffiches(true);
                        consultationRepository.save(c);
                    }
                } else {
                    Consultation c = new Consultation();
                    c.setEtudiant(etudiant);
                    c.setAnnonce(annonce);
                    c.setContactsAffiches(false);
                    consultationRepository.save(c);
                }
            });
        }
        return toDetailDTO(annonce, currentUserId, includeContacts);
    }

    private AnnonceRechercheDTO toRechercheDTO(Annonce annonce) {
        Logement logement = annonce.getLogement();
        Proprietaire proprietaire = logement != null ? logement.getProprietaire() : null;
        var coordonnees = logement != null ? logement.getCoordonnees() : null;

        return new AnnonceRechercheDTO(
                annonce.getId(),
                annonce.getTitre(),
                annonce.getLoyer(),
                annonce.getChargesIncluses(),
                annonce.getStatut(),
                annonce.getScoreConfiance(),
                annonce.getDatePublication(),
                annonce.getDateExpiration(),
                logement != null ? logement.getId() : null,
                logement != null ? logement.getAdresse() : null,
                logement != null ? logement.getVille() : null,
                logement != null ? logement.getSuperficie() : null,
                logement != null ? logement.getTypeLogement() : null,
                coordonnees != null ? coordonnees.getY() : null,
                coordonnees != null ? coordonnees.getX() : null,
                proprietaire != null ? proprietaire.getNom() : null,
                proprietaire != null ? proprietaire.getPrenom() : null,
                proprietaire != null ? proprietaire.getEstVerifieCin() : null,
                proprietaire != null ? proprietaire.getNoteMoyenne() : null,
                null,
                getPhotoUrls(annonce.getId()),
                getEquipementLabels(annonce.getId())
        );
    }

    private AnnonceRechercheDTO toRechercheDTO(AnnonceAvecDistance annonce) {
        return new AnnonceRechercheDTO(
                annonce.getAnnonceId(),
                annonce.getTitre(),
                annonce.getLoyer(),
                annonce.getChargesIncluses(),
                annonce.getStatut(),
                annonce.getScoreConfiance(),
                null,
                annonce.getDateExpiration(),
                annonce.getLogementId(),
                annonce.getAdresse(),
                annonce.getVille(),
                annonce.getSuperficie(),
                annonce.getTypeLogement(),
                annonce.getCoordonneesLogement() != null ? annonce.getCoordonneesLogement().getY() : null,
                annonce.getCoordonneesLogement() != null ? annonce.getCoordonneesLogement().getX() : null,
                annonce.getProprietaireNom(),
                annonce.getProprietairePrenom(),
                annonce.getProprietaireVerifie(),
                annonce.getProprietaireNote(),
                annonce.getDistanceCampusM(),
                getPhotoUrls(annonce.getAnnonceId()),
                getEquipementLabels(annonce.getAnnonceId())
        );
    }

    public void archiverAnnonce(UUID annonceId) {
        Annonce annonce = annonceRepository.findById(annonceId)
                .orElseThrow(() -> new EntityNotFoundException("Annonce not found with id: " + annonceId));

        annonce.setStatut(StatutAnnonceEnum.ARCHIVEE);
        annonceRepository.save(annonce);
    }

    /**
     * Modification d'une annonce REJETEE par son proprietaire : mise a jour des
     * champs, remplacement des contacts/equipements, gestion des photos
     * (conservees par URL + nouvelles), puis re-soumission au pipeline IA avec
     * datePublication remise a maintenant.
     */
    @Transactional
    public Annonce modifierAnnonce(UUID annonceId, UUID proprietaireId, AnnonceUpdateRequestDTO dto) {
        Annonce annonce = getAnnonceProprietaire(annonceId, proprietaireId);
        if (annonce.getStatut() != StatutAnnonceEnum.REJETEE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Seules les annonces rejetées peuvent être modifiées.");
        }

        // Photos conservees : uniquement celles qui appartiennent vraiment a l'annonce
        List<Photo> photosExistantes = photoRepository.findByAnnonce_IdOrderByOrdreAsc(annonce.getId());
        Set<String> demandees = dto.getPhotosConservees() != null
                ? new HashSet<>(dto.getPhotosConservees())
                : new HashSet<>();
        List<Photo> conservees = photosExistantes.stream()
                .filter(photo -> demandees.contains(photo.getUrl()))
                .collect(Collectors.toList());

        int nouvellesCount = dto.getPhotos() != null ? dto.getPhotos().size() : 0;
        int total = conservees.size() + nouvellesCount;
        if (total < 2 || total > 10) {
            throw new IllegalArgumentException("Une annonce doit contenir entre 2 et 10 photos.");
        }

        // Champs de base
        annonce.setTitre(dto.getTitre());
        annonce.setDescription(dto.getDescription());
        annonce.setLoyer(dto.getLoyer());
        annonce.setChargesIncluses(dto.getChargesIncluses());

        // Justificatif : remplacement optionnel (critere le plus lourd du score IA)
        if (dto.getJustificatifFile() != null && !dto.getJustificatifFile().isEmpty()) {
            String justificatifUrl = photoService.uploaderJustificatif(dto.getJustificatifFile());
            Logement logement = annonce.getLogement();
            logement.setJustificatifUrl(justificatifUrl);
            logementRepository.save(logement);
        }

        // Contacts : remplacement complet (flush pour que le DELETE parte
        // avant les INSERT, sinon violation de contrainte unique)
        contactAnnonceRepository.deleteByAnnonce_Id(annonce.getId());
        contactAnnonceRepository.flush();
        List<ContactAnnonce> contacts = dto.getContacts().stream()
                .map(contactDTO -> {
                    ContactAnnonce contact = new ContactAnnonce();
                    contact.setPlateforme(contactDTO.getPlateforme());
                    contact.setValeur(contactDTO.getValeur());
                    return contact;
                })
                .collect(Collectors.toList());
        contactAnnonceService.ajouterContacts(annonce, contacts);

        // Equipements : remplacement complet
        annonceEquipementRepository.deleteByIdAnnonceId(annonce.getId());
        annonceEquipementRepository.flush();
        ajouterEquipements(annonce, dto.getEquipementIds());

        // Photos retirees -> suppression ; nouvelles -> upload Cloudinary
        Set<String> urlsConservees = conservees.stream().map(Photo::getUrl).collect(Collectors.toSet());
        for (Photo photo : photosExistantes) {
            if (!urlsConservees.contains(photo.getUrl())) {
                photoRepository.delete(photo);
            }
        }
        photoRepository.flush();

        List<Photo> nouvellesPhotos = new ArrayList<>();
        if (dto.getPhotos() != null) {
            for (MultipartFile photoFile : dto.getPhotos()) {
                nouvellesPhotos.add(photoService.uploaderPhoto(photoFile, annonce));
            }
        }

        // Ordre final : tokens URL (conservee) ou "new:<i>" (nouvelle).
        // La premiere photo devient la photo principale.
        List<Photo> ordreFinal = ordonnerPhotos(conservees, nouvellesPhotos, dto.getOrdrePhotos());
        for (int i = 0; i < ordreFinal.size(); i++) {
            Photo photo = ordreFinal.get(i);
            photo.setOrdre((short) i);
            photo.setEstPrincipale(i == 0);
        }
        photoRepository.saveAll(ordreFinal);

        List<String> photoUrls = ordreFinal.stream().map(Photo::getUrl).collect(Collectors.toList());

        // Re-soumission : repart en verification, score remis a zero
        annonce.setDatePublication(LocalDateTime.now());
        annonce.setStatut(StatutAnnonceEnum.EN_ATTENTE);
        annonce.setScoreConfiance(null);
        annonce.setDetailScore(new HashMap<>());
        annonce.setRaisonStatut(null);

        analyserEtAppliquerScore(annonce, photoUrls);
        Annonce resultat = annonceRepository.save(annonce);
        notifierProprietaireDecision(resultat);
        return resultat;
    }

    /**
     * Ordonne les photos selon les tokens envoyes par le frontend : URL pour
     * une photo conservee, "new:&lt;i&gt;" pour une nouvelle photo. Sans tokens,
     * conserve l'ordre conservees puis nouvelles. Les photos absentes des
     * tokens sont ajoutees a la fin (securite).
     */
    private List<Photo> ordonnerPhotos(List<Photo> conservees, List<Photo> nouvelles, List<String> tokens) {
        List<Photo> ordreFinal = new ArrayList<>();
        if (tokens != null && !tokens.isEmpty()) {
            Map<String, Photo> parUrl = new HashMap<>();
            conservees.forEach(photo -> parUrl.put(photo.getUrl(), photo));
            for (String token : tokens) {
                Photo photo = null;
                if (token.startsWith("new:")) {
                    try {
                        int index = Integer.parseInt(token.substring(4));
                        if (index >= 0 && index < nouvelles.size()) {
                            photo = nouvelles.get(index);
                        }
                    } catch (NumberFormatException ignored) {
                        // token invalide -> ignore
                    }
                } else {
                    photo = parUrl.get(token);
                }
                if (photo != null && !ordreFinal.contains(photo)) {
                    ordreFinal.add(photo);
                }
            }
        }
        for (Photo photo : conservees) {
            if (!ordreFinal.contains(photo)) {
                ordreFinal.add(photo);
            }
        }
        for (Photo photo : nouvelles) {
            if (!ordreFinal.contains(photo)) {
                ordreFinal.add(photo);
            }
        }
        return ordreFinal;
    }

    /** Archivage manuel par le proprietaire (VALIDEE ou EN_ATTENTE uniquement). */
    @Transactional
    public Annonce archiverAnnonceProprietaire(UUID annonceId, UUID proprietaireId) {
        Annonce annonce = getAnnonceProprietaire(annonceId, proprietaireId);
        if (annonce.getStatut() != StatutAnnonceEnum.VALIDEE
                && annonce.getStatut() != StatutAnnonceEnum.EN_ATTENTE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Seules les annonces validées ou en attente peuvent être archivées.");
        }
        // raisonStatut (payload IA) est conserve pour restaurer le score au desarchivage.
        annonce.setStatut(StatutAnnonceEnum.ARCHIVEE);
        return annonceRepository.save(annonce);
    }

    /** Desarchivage : restaure le statut selon le score stocke (>=70 VALIDEE, sinon EN_ATTENTE). */
    @Transactional
    public Annonce desarchiverAnnonce(UUID annonceId, UUID proprietaireId) {
        Annonce annonce = getAnnonceProprietaire(annonceId, proprietaireId);
        if (annonce.getStatut() != StatutAnnonceEnum.ARCHIVEE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Seules les annonces archivées peuvent être désarchivées.");
        }
        Optional<Annonce> active = annonceRepository
                .findFirstByLogementIdAndStatutInOrderByDatePublicationDesc(
                        annonce.getLogement().getId(), STATUTS_ACTIFS);
        if (active.isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Une autre annonce est déjà active pour ce logement. Archivez-la d'abord.");
        }
        Short score = annonce.getScoreConfiance();
        annonce.setStatut(score != null && score >= 70
                ? StatutAnnonceEnum.VALIDEE
                : StatutAnnonceEnum.EN_ATTENTE);
        // Republier repart pour 90 jours : le trigger DB recalcule date_expiration
        // a partir de date_publication.
        annonce.setDatePublication(LocalDateTime.now());
        // Efface les raisons d'archivage en texte brut (expiration, remplacement) ;
        // le payload IA (JSON) est conserve pour les messages de confiance.
        String raison = annonce.getRaisonStatut();
        if (raison != null && !raison.trim().startsWith("{")) {
            annonce.setRaisonStatut(null);
        }
        return annonceRepository.save(annonce);
    }

    /** Suppression definitive (REJETEE ou ARCHIVEE) avec purge des donnees liees. */
    @Transactional
    public void supprimerAnnonce(UUID annonceId, UUID proprietaireId) {
        Annonce annonce = getAnnonceProprietaire(annonceId, proprietaireId);
        if (annonce.getStatut() != StatutAnnonceEnum.REJETEE
                && annonce.getStatut() != StatutAnnonceEnum.ARCHIVEE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Seules les annonces rejetées ou archivées peuvent être supprimées.");
        }
        // Pas de cascade JPA sur Annonce : purge manuelle des enfants.
        // Les avis referencent les consultations -> supprimes en premier.
        avisRepository.deleteByAnnonce_Id(annonceId);
        consultationRepository.deleteByAnnonce_Id(annonceId);
        signalementRepository.deleteByAnnonce_Id(annonceId);
        favoriRepository.deleteByIdAnnonceId(annonceId);
        recommandationRepository.deleteByAnnonce_Id(annonceId);
        photoRepository.deleteByAnnonce_Id(annonceId);
        contactAnnonceRepository.deleteByAnnonce_Id(annonceId);
        annonceEquipementRepository.deleteByIdAnnonceId(annonceId);
        Logement logement = annonce.getLogement();
        annonceRepository.delete(annonce);
        annonceRepository.flush();

        // Nettoyage : si c'etait la derniere annonce du logement, on supprime
        // aussi le logement (sinon il reste orphelin, invisible et ingerable).
        if (logement != null && annonceRepository.countByLogementId(logement.getId()) == 0) {
            logementRepository.delete(logement);
        }
    }

    private Annonce getAnnonceProprietaire(UUID annonceId, UUID proprietaireId) {
        if (proprietaireId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Utilisateur non identifié.");
        }
        Annonce annonce = annonceRepository.findById(annonceId)
                .orElseThrow(() -> new EntityNotFoundException("Annonce introuvable"));
        Logement logement = annonce.getLogement();
        if (logement == null || logement.getProprietaire() == null
                || !logement.getProprietaire().getId().equals(proprietaireId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Vous n'êtes pas le propriétaire de cette annonce.");
        }
        return annonce;
    }

    public AnnonceResponseDTO buildResponseDTO(Annonce annonce) {
        return toResponseDTO(annonce);
    }

    private List<String> getPhotoUrls(UUID annonceId) {
        return photoRepository.findByAnnonce_IdOrderByOrdreAsc(annonceId).stream()
                .map(Photo::getUrl)
                .collect(Collectors.toList());
    }

    private List<String> getEquipementLabels(UUID annonceId) {
        return annonceEquipementRepository.findByIdAnnonceId(annonceId).stream()
                .map(annonceEquipement -> annonceEquipement.getEquipement().getLibelle())
                .collect(Collectors.toList());
    }

    private AnnonceDetailDTO toDetailDTO(Annonce annonce, UUID currentUserId, boolean includeContacts) {
        Logement logement = annonce.getLogement();
        Proprietaire proprietaire = logement != null ? logement.getProprietaire() : null;
        var coordonnees = logement != null ? logement.getCoordonnees() : null;
        List<AnnonceDetailDTO.ContactDTO> contacts = includeContacts
                ? contactAnnonceRepository.findByAnnonce_Id(annonce.getId()).stream()
                    .map(contact -> new AnnonceDetailDTO.ContactDTO(contact.getPlateforme(), contact.getValeur()))
                    .collect(Collectors.toList())
                : List.of();

        boolean favori = currentUserId != null
                && favoriRepository.existsById(new com.unihome.api.entity.FavoriId(currentUserId, annonce.getId()));

        return new AnnonceDetailDTO(
                annonce.getId(),
                annonce.getTitre(),
                annonce.getDescription(),
                annonce.getLoyer(),
                annonce.getChargesIncluses(),
                annonce.getStatut(),
                annonce.getScoreConfiance(),
                annonce.getDetailScore(),
                buildStudentTrustMessage(annonce),
                annonce.getDatePublication(),
                annonce.getDateExpiration(),
                logement != null ? logement.getId() : null,
                logement != null ? logement.getAdresse() : null,
                logement != null ? logement.getVille() : null,
                logement != null ? logement.getSuperficie() : null,
                logement != null ? logement.getTypeLogement() : null,
                coordonnees != null ? coordonnees.getY() : null,
                coordonnees != null ? coordonnees.getX() : null,
                proprietaire != null ? proprietaire.getNom() : null,
                proprietaire != null ? proprietaire.getPrenom() : null,
                proprietaire != null ? proprietaire.getEstVerifieCin() : null,
                proprietaire != null ? proprietaire.getNoteMoyenne() : null,
                proprietaire != null ? proprietaire.getNbAvisTotal() : null,
                getPhotoUrls(annonce.getId()),
                getEquipementLabels(annonce.getId()),
                contacts,
                includeContacts,
                favori
        );
    }

    private OwnerAnnonceDTO toOwnerAnnonceDTO(Annonce annonce) {
        Logement logement = annonce.getLogement();
        var coordonnees = logement != null ? logement.getCoordonnees() : null;
        List<String> photos = getPhotoUrls(annonce.getId());
        List<OwnerAnnonceDTO.ContactDTO> contacts = contactAnnonceRepository.findByAnnonce_Id(annonce.getId()).stream()
                .map(contact -> new OwnerAnnonceDTO.ContactDTO(contact.getPlateforme(), contact.getValeur()))
                .collect(Collectors.toList());
        List<AnnonceEquipement> annonceEquipements = annonceEquipementRepository.findByIdAnnonceId(annonce.getId());
        List<Integer> equipementIds = annonceEquipements.stream()
                .map(annonceEquipement -> annonceEquipement.getEquipement().getId())
                .collect(Collectors.toList());
        List<String> equipements = getEquipementLabels(annonce.getId());

        return new OwnerAnnonceDTO(
                annonce.getId(),
                annonce.getTitre(),
                annonce.getDescription(),
                annonce.getLoyer(),
                annonce.getChargesIncluses(),
                annonce.getStatut(),
                annonce.getScoreConfiance(),
                annonce.getDetailScore(),
                buildOwnerTrustMessage(annonce),
                annonce.getNbSignalements(),
                annonce.getDatePublication(),
                annonce.getDateExpiration(),
                logement != null ? logement.getId() : null,
                logement != null ? logement.getAdresse() : null,
                logement != null ? logement.getVille() : null,
                logement != null ? logement.getSuperficie() : null,
                logement != null ? logement.getTypeLogement() : null,
                coordonnees != null ? coordonnees.getY() : null,
                coordonnees != null ? coordonnees.getX() : null,
                photos,
                contacts,
                equipementIds,
                equipements,
                favoriRepository.countByIdAnnonceId(annonce.getId()),
                consultationRepository.countDistinctEtudiantsByAnnonceId(annonce.getId())
        );
    }

    private AnnonceResponseDTO toResponseDTO(Annonce annonce) {
        Logement logement = annonce.getLogement();
        Proprietaire proprietaire = logement != null ? logement.getProprietaire() : null;
        List<AnnonceEquipement> annonceEquipements = annonce.getId() != null
                ? annonceEquipementRepository.findByIdAnnonceId(annonce.getId())
                : List.of();
        List<Integer> equipementIds = annonceEquipements.stream()
                .map(annonceEquipement -> annonceEquipement.getEquipement().getId())
                .collect(Collectors.toList());
        List<String> equipements = annonceEquipements.stream()
                .map(annonceEquipement -> annonceEquipement.getEquipement().getLibelle())
                .collect(Collectors.toList());

        return new AnnonceResponseDTO(
                annonce.getId(),
                annonce.getTitre(),
                annonce.getLoyer(),
                annonce.getStatut(),
                annonce.getScoreConfiance(),
                buildOwnerTrustMessage(annonce),
                annonce.getDatePublication(),
                annonce.getDateExpiration(),
                logement != null ? logement.getId() : null,
                logement != null ? logement.getAdresse() : null,
                logement != null ? logement.getVille() : null,
                logement != null ? logement.getSuperficie() : null,
                logement != null ? logement.getTypeLogement() : null,
                proprietaire != null ? proprietaire.getNom() : null,
                proprietaire != null ? proprietaire.getPrenom() : null,
                proprietaire != null ? proprietaire.getEstVerifieCin() : null,
                proprietaire != null ? proprietaire.getNoteMoyenne() : null,
                equipementIds,
                equipements
        );
    }

    private String buildStudentTrustMessage(Annonce annonce) {
        String aiMessage = AiReasonMessages.forRole(annonce.getRaisonStatut(), "student", null);
        if (aiMessage != null && !aiMessage.isBlank()) {
            return aiMessage;
        }

        Short score = annonce.getScoreConfiance();
        StatutAnnonceEnum statut = annonce.getStatut();

        if (score == null) {
            return "Cette annonce est en vérification manuelle. Consultez les informations avec prudence avant de contacter le propriétaire.";
        }

        if (statut == StatutAnnonceEnum.VALIDEE && score >= 70) {
            return "Annonce vérifiée par UniHome : les informations principales, les photos, le prix et les éléments justificatifs semblent cohérents. Avant tout paiement, visitez le logement et confirmez les détails avec le propriétaire.";
        }

        if (statut == StatutAnnonceEnum.EN_ATTENTE || score >= 40) {
            return "Cette annonce nécessite encore une vérification complémentaire par UniHome. Attendez la validation finale avant de vous engager.";
        }

        return "Cette annonce présente des incohérences importantes et n'est pas recommandée par UniHome.";
    }

    private String buildOwnerTrustMessage(Annonce annonce) {
        String aiMessage = AiReasonMessages.forRole(annonce.getRaisonStatut(), "owner", null);
        if (aiMessage != null && !aiMessage.isBlank()) {
            return aiMessage;
        }

        Short score = annonce.getScoreConfiance();
        Map<String, Integer> detail = annonce.getDetailScore();
        StatutAnnonceEnum statut = annonce.getStatut();

        if (score == null) {
            return "Votre annonce a été enregistrée, mais l'analyse IA n'a pas pu être terminée. Elle passera en vérification manuelle.";
        }

        String advice = buildOwnerImprovementAdvice(detail);

        if (statut == StatutAnnonceEnum.VALIDEE && score >= 70) {
            return "Votre annonce a été validée automatiquement : les photos, le prix, la description et le justificatif sont suffisamment cohérents. " + advice;
        }

        if (statut == StatutAnnonceEnum.EN_ATTENTE || score >= 40) {
            return "Votre annonce nécessite une vérification admin avant publication. " + advice;
        }

        return "Votre annonce a été rejetée automatiquement car le score de confiance est trop faible. " + advice;
    }

    private String buildOwnerImprovementAdvice(Map<String, Integer> detail) {
        if (detail == null || detail.isEmpty()) {
            return "Pour renforcer votre dossier, ajoutez un justificatif lisible, des photos réelles et une description précise.";
        }

        List<String> tips = new ArrayList<>();
        if (scoreBelow(detail, "justificatif", 70)) {
            tips.add("ajoutez un justificatif lisible avec le nom du propriétaire et/ou l'adresse du logement");
        }
        if (scoreBelow(detail, "photos", 70)) {
            tips.add("ajoutez plusieurs photos claires montrant différentes pièces du logement");
        }
        if (scoreBelow(detail, "description", 70)) {
            tips.add("complétez la description avec surface, équipements, proximité campus et conditions de location");
        }
        if (scoreBelow(detail, "prix", 70)) {
            tips.add("vérifiez que le prix est réaliste pour la ville, la surface et le type de logement");
        }
        if (scoreBelow(detail, "coherence", 70)) {
            tips.add("assurez-vous que adresse, photos, justificatif, surface et description racontent la même chose");
        }

        if (tips.isEmpty()) {
            return "Aucune correction majeure n'est demandée pour le moment.";
        }

        return "Pour améliorer votre score : " + String.join(" ; ", tips) + ".";
    }

    private boolean scoreBelow(Map<String, Integer> detail, String key, int threshold) {
        Integer value = detail.get(key);
        return value != null && value < threshold;
    }
}
