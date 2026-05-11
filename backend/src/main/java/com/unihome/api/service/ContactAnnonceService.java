package com.unihome.api.service;

import com.unihome.api.entity.Annonce;
import com.unihome.api.entity.ContactAnnonce;
import com.unihome.api.repository.ContactAnnonceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ContactAnnonceService {

    private final ContactAnnonceRepository contactAnnonceRepository;

    public void ajouterContacts(Annonce annonce, List<ContactAnnonce> contacts) {
        if (contacts == null || contacts.isEmpty()) {
            return;
        }

        for (ContactAnnonce contact : contacts) {
            if (contact.getPlateforme() == null) {
                throw new IllegalArgumentException("Le champ plateforme est obligatoire.");
            }
            if (contact.getValeur() == null || contact.getValeur().trim().isEmpty()) {
                throw new IllegalArgumentException("Le champ valeur est obligatoire.");
            }
            contact.setAnnonce(annonce);
        }

        contactAnnonceRepository.saveAll(contacts);
    }
}

