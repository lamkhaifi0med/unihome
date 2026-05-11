package com.unihome.api.service;

import com.unihome.api.dto.AnnonceAiRequest;
import com.unihome.api.dto.AnnonceRequestDTO;
import com.unihome.api.dto.AnnonceRechercheDTO;
import com.unihome.api.dto.FraudScoreResponse;
import com.unihome.api.dto.AnnonceResponseDTO;
import com.unihome.api.entity.Annonce;
import com.unihome.api.entity.AnnonceAvecDistance;
import com.unihome.api.entity.ContactAnnonce;
import com.unihome.api.entity.Logement;
import com.unihome.api.entity.Photo;
import com.unihome.api.entity.Proprietaire;
import com.unihome.api.entity.StatutAnnonceEnum;
import com.unihome.api.repository.AnnonceRepository;
import com.unihome.api.repository.AnnonceAvecDistanceRepository;
import com.unihome.api.repository.LogementRepository;
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
import java.util.List;
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
                proprietaireNomComplet
        );

        FraudScoreResponse fraudResponse = annonceAiClient.analyserAnnonce(aiRequest);
        if (fraudResponse == null) {
            savedAnnonce.setStatut(StatutAnnonceEnum.EN_ATTENTE);
            savedAnnonce.setScoreConfiance((short) 0);
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

        annonceData.setLogement(logement);
        annonceData.setDatePublication(LocalDateTime.now());
        annonceData.setNbSignalements(0);
        annonceData.setStatut(StatutAnnonceEnum.EN_ATTENTE);
        annonceData.setScoreConfiance((short) 0);
        annonceData.setDetailScore(new HashMap<>());

        return annonceRepository.save(annonceData);
    }

    private void appliquerDecisionFraude(Annonce annonceData, FraudScoreResponse fraudResponse) {
        Short scoreGlobal = fraudResponse != null ? fraudResponse.getScoreGlobal() : null;
        if (scoreGlobal == null) {
            log.warn("IA indisponible. Annonce en EN_ATTENTE avec score 0.");
            annonceData.setStatut(StatutAnnonceEnum.EN_ATTENTE);
            annonceData.setScoreConfiance((short) 0);
            annonceData.setDetailScore(new HashMap<>());
            annonceData.setRaisonStatut("IA indisponible - Validation manuelle requise");
            return;
        }

        if (scoreGlobal > 70) {
            annonceData.setStatut(StatutAnnonceEnum.VALIDEE);
            annonceData.setRaisonStatut("Validé par IA - Score: " + scoreGlobal);
        } else if (scoreGlobal >= 40) {
            annonceData.setStatut(StatutAnnonceEnum.EN_ATTENTE);
            annonceData.setRaisonStatut("En attente par IA - Score: " + scoreGlobal);
        } else {
            annonceData.setStatut(StatutAnnonceEnum.REJETEE);
            annonceData.setRaisonStatut("Rejeté par IA - Score: " + scoreGlobal);
        }

        annonceData.setScoreConfiance(scoreGlobal);
        annonceData.setDetailScore(fraudResponse.getDetailScore() != null ? fraudResponse.getDetailScore() : new HashMap<>());
    }

    private Annonce mapToAnnonceEntity(AnnonceRequestDTO requestDTO) {
        Annonce annonce = new Annonce();
        annonce.setTitre(requestDTO.getTitre());
        annonce.setDescription(requestDTO.getDescription());
        annonce.setLoyer(requestDTO.getLoyer());
        annonce.setChargesIncluses(requestDTO.getChargesIncluses());
        return annonce;
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
    public Page<AnnonceRechercheDTO> rechercherAnnoncesProches(UUID universiteId, Double rayonMetres, Pageable pageable) {
        return annonceAvecDistanceRepository
                .findByUniversiteWithinDistance(universiteId, rayonMetres, pageable)
                .map(this::toRechercheDTO);
    }

    public AnnonceRechercheDTO buildRechercheDTO(Annonce annonce) {
        return toRechercheDTO(annonce);
    }

    private AnnonceRechercheDTO toRechercheDTO(Annonce annonce) {
        Logement logement = annonce.getLogement();
        Proprietaire proprietaire = logement != null ? logement.getProprietaire() : null;

        return new AnnonceRechercheDTO(
                annonce.getId(),
                annonce.getTitre(),
                annonce.getLoyer(),
                annonce.getStatut(),
                annonce.getScoreConfiance(),
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
                null
        );
    }

    private AnnonceRechercheDTO toRechercheDTO(AnnonceAvecDistance annonce) {
        return new AnnonceRechercheDTO(
                annonce.getAnnonceId(),
                annonce.getTitre(),
                annonce.getLoyer(),
                annonce.getStatut(),
                annonce.getScoreConfiance(),
                null,
                annonce.getDateExpiration(),
                annonce.getLogementId(),
                annonce.getAdresse(),
                annonce.getVille(),
                annonce.getSuperficie(),
                annonce.getTypeLogement(),
                annonce.getProprietaireNom(),
                annonce.getProprietairePrenom(),
                annonce.getProprietaireVerifie(),
                annonce.getProprietaireNote(),
                annonce.getDistanceCampusM()
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

    private AnnonceResponseDTO toResponseDTO(Annonce annonce) {
        Logement logement = annonce.getLogement();
        Proprietaire proprietaire = logement != null ? logement.getProprietaire() : null;

        return new AnnonceResponseDTO(
                annonce.getId(),
                annonce.getTitre(),
                annonce.getLoyer(),
                annonce.getStatut(),
                annonce.getScoreConfiance(),
                annonce.getRaisonStatut(),
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
                proprietaire != null ? proprietaire.getNoteMoyenne() : null
        );
    }
}
