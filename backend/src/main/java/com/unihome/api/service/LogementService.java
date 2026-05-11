package com.unihome.api.service;

import com.unihome.api.dto.LogementRequestDTO;
import com.unihome.api.entity.Logement;
import com.unihome.api.entity.Proprietaire;
import com.unihome.api.entity.StatutLogementEnum;
import com.unihome.api.entity.Utilisateur;
import com.unihome.api.repository.LogementRepository;
import com.unihome.api.repository.UtilisateurRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class LogementService {

    private final LogementRepository logementRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final PhotoService photoService;

    public Logement creerLogement(LogementRequestDTO dto, MultipartFile justificatifFile) {
        Utilisateur proprietaire = utilisateurRepository.findById(dto.getProprietaireId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Utilisateur not found with id: " + dto.getProprietaireId()));

        if (!(proprietaire instanceof Proprietaire proprietaireEntity)) {
            throw new EntityNotFoundException("Utilisateur is not a proprietaire: " + dto.getProprietaireId());
        }

        GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
        Point point = geometryFactory.createPoint(new Coordinate(dto.getLongitude(), dto.getLatitude()));

        Logement logement = new Logement();
        logement.setProprietaire(proprietaireEntity);
        logement.setAdresse(dto.getAdresse());
        logement.setVille(dto.getVille());
        logement.setSuperficie(dto.getSuperficie());
        logement.setTypeLogement(dto.getTypeLogement());
        logement.setStatutLogement(StatutLogementEnum.DISPONIBLE);
        logement.setCoordonnees(point);
        String justificatifUrl = null;
        if (justificatifFile != null && !justificatifFile.isEmpty()) {
            justificatifUrl = photoService.uploaderJustificatif(justificatifFile);
        } else {
            justificatifUrl = dto.getJustificatifUrl();
        }
        logement.setJustificatifUrl(justificatifUrl);
        logement.setAdresseConfirmee(Boolean.FALSE);

        return logementRepository.save(logement);
    }
}
