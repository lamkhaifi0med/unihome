package com.unihome.api.service;

import com.unihome.api.entity.Annonce;
import com.unihome.api.entity.Etudiant;
import com.unihome.api.entity.Favori;
import com.unihome.api.entity.FavoriId;
import com.unihome.api.entity.StatutAnnonceEnum;
import com.unihome.api.entity.Utilisateur;
import com.unihome.api.repository.AnnonceRepository;
import com.unihome.api.repository.FavoriRepository;
import com.unihome.api.repository.UtilisateurRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FavoriService {

    private final FavoriRepository favoriRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final AnnonceRepository annonceRepository;

    @Transactional(readOnly = true)
    public List<UUID> getFavorisIds(String email) {
        Etudiant etudiant = getEtudiant(email);
        return favoriRepository.findByIdEtudiantId(etudiant.getId()).stream()
                .map(favori -> favori.getId().getAnnonceId())
                .toList();
    }

    @Transactional
    public void ajouterFavori(String email, UUID annonceId) {
        Etudiant etudiant = getEtudiant(email);
        Annonce annonce = annonceRepository.findById(annonceId)
                .orElseThrow(() -> new EntityNotFoundException("Annonce introuvable"));
        if (annonce.getStatut() != StatutAnnonceEnum.VALIDEE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cette annonce n'est pas disponible.");
        }

        FavoriId id = new FavoriId(etudiant.getId(), annonceId);
        if (favoriRepository.existsById(id)) {
            return;
        }
        favoriRepository.save(new Favori(id, etudiant, annonce, null));
    }

    @Transactional
    public void supprimerFavori(String email, UUID annonceId) {
        Etudiant etudiant = getEtudiant(email);
        favoriRepository.deleteById(new FavoriId(etudiant.getId(), annonceId));
    }

    private Etudiant getEtudiant(String email) {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Utilisateur introuvable"));
        if (!(utilisateur instanceof Etudiant etudiant)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Seuls les etudiants peuvent utiliser les favoris.");
        }
        return etudiant;
    }
}
