package com.unihome.api.service;

import com.unihome.api.dto.AnnonceAiRequest;
import com.unihome.api.dto.AnnonceDetailDTO;
import com.unihome.api.dto.AnnonceRequestDTO;
import com.unihome.api.dto.AnnonceRechercheDTO;
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
import com.unihome.api.repository.ConsultationRepository;
import com.unihome.api.repository.ContactAnnonceRepository;
import com.unihome.api.repository.EquipementRepository;
import com.unihome.api.repository.EtudiantRepository;
import com.unihome.api.repository.FavoriRepository;
import com.unihome.api.repository.LogementRepository;
import com.unihome.api.repository.PhotoRepository;
import com.unihome.api.util.AiReasonMessages;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

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

        Logement logement = savedAnnonce.getLogement();
        String proprietaireNomComplet = null;
        if (logement != null && logement.getProprietaire() != null) {
            String prenom = logement.getProprietaire().getPrenom();
            String nom = logement.getProprietaire().getNom();
            proprietaireNomComplet = String.format("%s %s", prenom != null ? prenom : "", nom != null ? nom : "").trim();
        }

        AnnonceAiRequest aiRequest = new AnnonceAiRequest(
                savedAnnonce.getTitre(),
                savedAnnonce.getDescription(),
                savedAnnonce.getLoyer(),
                photoUrls,
                logement != null ? logement.getJustificatifUrl() : null,
            proprietaireNomComplet,
            logement != null ? logement.getVille() : null,
            logement != null ? logement.getAdresse() : null,
            logement != null && logement.getTypeLogement() != null ? logement.getTypeLogement().name() : null,
            logement != null ? logement.getSuperficie() : null,
            savedAnnonce.getChargesIncluses(),
            logement != null && logement.getProprietaire() != null ? logement.getProprietaire().getEstVerifieCin() : null,
            logement != null && logement.getProprietaire() != null ? logement.getProprietaire().getNoteMoyenne() : null,
            logement != null && logement.getProprietaire() != null ? logement.getProprietaire().getNbAvisTotal() : null
        );

        FraudScoreResponse fraudResponse = annonceAiClient.analyserAnnonce(aiRequest);
        if (fraudResponse == null) {
            savedAnnonce.setStatut(StatutAnnonceEnum.EN_ATTENTE);
            savedAnnonce.setScoreConfiance(null);
            savedAnnonce.setDetailScore(new HashMap<>());
            savedAnnonce.setRaisonStatut("IA indisponible - Validation manuelle requise");
            return annonceRepository.save(savedAnnonce);
        }

        appliquerDecisionFraude(savedAnnonce, fraudResponse);

        return annonceRepository.save(savedAnnonce);
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
                favoriRepository.countByIdAnnonceId(annonce.getId())
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
