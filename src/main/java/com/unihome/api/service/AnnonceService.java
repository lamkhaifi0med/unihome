package com.unihome.api.service;

import com.unihome.api.dto.AnnonceRequestDTO;
import com.unihome.api.dto.AnnonceRechercheDTO;
import com.unihome.api.dto.FraudScoreResponse;
import com.unihome.api.entity.Annonce;
import com.unihome.api.entity.ContactAnnonce;
import com.unihome.api.entity.Logement;
import com.unihome.api.entity.Proprietaire;
import com.unihome.api.entity.StatutAnnonceEnum;
import com.unihome.api.repository.AnnonceRepository;
import com.unihome.api.repository.LogementRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
    private final WebClient webClient;

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
        for (MultipartFile photoFile : requestDTO.getPhotos()) {
            photoService.uploaderPhoto(photoFile, savedAnnonce);
        }

        return savedAnnonce;
    }

    private Annonce creerAnnonceInterne(UUID logementId, Annonce annonceData, List<?> photos) {
        validatePhotoCount(photos);

        Logement logement = logementRepository.findById(logementId)
                .orElseThrow(() -> new EntityNotFoundException("Logement not found with id: " + logementId));

        annonceData.setLogement(logement);
        annonceData.setDatePublication(LocalDateTime.now());
        annonceData.setNbSignalements(0);

        FraudScoreResponse fraudResponse;
        try {
            fraudResponse = callFraudDetectionService(annonceData);
        } catch (Exception exception) {
            log.error("Fraud service call failed for logementId={}: {}", logementId, exception.getMessage(), exception);
            fraudResponse = null;
        }

        Short scoreGlobal = fraudResponse != null ? fraudResponse.getScoreGlobal() : null;
        if (scoreGlobal == null) {
            log.warn("Fraud score missing or service unavailable. Applying fallback EN_ATTENTE with score 0 for logementId={}", logementId);
            annonceData.setStatut(StatutAnnonceEnum.EN_ATTENTE);
            annonceData.setScoreConfiance((short) 0);
            annonceData.setDetailScore(new HashMap<>());
        } else {
            if (scoreGlobal >= 70) {
                annonceData.setStatut(StatutAnnonceEnum.VALIDEE);
            } else if (scoreGlobal >= 40) {
                annonceData.setStatut(StatutAnnonceEnum.EN_ATTENTE);
            } else {
                annonceData.setStatut(StatutAnnonceEnum.REJETEE);
            }
            annonceData.setScoreConfiance(scoreGlobal);
            annonceData.setDetailScore(fraudResponse.getDetailScore());
        }

        return annonceRepository.save(annonceData);
    }

    private Annonce mapToAnnonceEntity(AnnonceRequestDTO requestDTO) {
        Annonce annonce = new Annonce();
        annonce.setTitre(requestDTO.getTitre());
        annonce.setDescription(requestDTO.getDescription());
        annonce.setLoyer(requestDTO.getLoyer());
        annonce.setChargesIncluses(requestDTO.getChargesIncluses());
        return annonce;
    }

    private FraudScoreResponse callFraudDetectionService(Annonce annonce) {
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("titre", annonce.getTitre());
        requestBody.put("description", annonce.getDescription());
        requestBody.put("loyer", annonce.getLoyer());

        return webClient.post()
                .uri("/analyze-listing")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(FraudScoreResponse.class)
                .onErrorResume(exception -> {
                    log.error("Python fraud service unreachable or returned an error: {}", exception.getMessage(), exception);
                    return Mono.empty();
                })
                .block();
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
                proprietaire != null ? proprietaire.getNoteMoyenne() : null
        );
    }

    public void archiverAnnonce(UUID annonceId) {
        Annonce annonce = annonceRepository.findById(annonceId)
                .orElseThrow(() -> new EntityNotFoundException("Annonce not found with id: " + annonceId));

        annonce.setStatut(StatutAnnonceEnum.ARCHIVEE);
        annonceRepository.save(annonce);
    }
}
