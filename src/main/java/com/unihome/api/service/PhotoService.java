package com.unihome.api.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.unihome.api.entity.Annonce;
import com.unihome.api.entity.Photo;
import com.unihome.api.repository.PhotoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PhotoService {

    private final PhotoRepository photoRepository;
    private final Cloudinary cloudinary;

    public void validatePhotoCount(Annonce annonce, int incomingCount) {
        if (incomingCount < 2 || incomingCount > 10) {
            throw new IllegalArgumentException("Une annonce doit contenir entre 2 et 10 photos.");
        }
        long existingCount = photoRepository.countByAnnonce_Id(annonce.getId());
        long totalCount = existingCount + incomingCount;
        if (totalCount < 2 || totalCount > 10) {
            throw new IllegalArgumentException("Une annonce doit contenir entre 2 et 10 photos.");
        }
    }

    public Photo uploaderPhoto(MultipartFile file, Annonce annonce) {
        long existingCount = photoRepository.countByAnnonce_Id(annonce.getId());
        if (existingCount >= 10) {
            throw new IllegalArgumentException("Une annonce ne peut pas avoir plus de 10 photos.");
        }
        try {
            Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.emptyMap());
            Object secureUrl = uploadResult.get("secure_url");
            Object defaultUrl = uploadResult.get("url");
            String url = secureUrl != null ? secureUrl.toString() : (defaultUrl != null ? defaultUrl.toString() : null);

            if (url == null || url.isBlank()) {
                throw new IllegalStateException("Cloudinary upload failed: missing URL");
            }

            Photo photo = new Photo();
            photo.setAnnonce(annonce);
            photo.setUrl(url);
            // TODO: Integrate pHash calculation
            photo.setPhash(null);
            photo.setEstPrincipale(Boolean.FALSE);
            photo.setOrdre((short) (existingCount + 1));

            return photoRepository.save(photo);
        } catch (IOException exception) {
            throw new IllegalStateException("Cloudinary upload failed", exception);
        }
    }

    public String uploaderJustificatif(MultipartFile file) {
        try {
            Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.emptyMap());
            Object secureUrl = uploadResult.get("secure_url");
            Object defaultUrl = uploadResult.get("url");
            String url = secureUrl != null ? secureUrl.toString() : (defaultUrl != null ? defaultUrl.toString() : null);

            if (url == null || url.isBlank()) {
                throw new IllegalStateException("Cloudinary upload failed: missing URL");
            }

            return url;
        } catch (IOException exception) {
            throw new IllegalStateException("Cloudinary upload failed", exception);
        }
    }

    public String uploaderCin(MultipartFile file) {
        // Reutilise le meme flux Cloudinary pour les CIN proprietaire.
        return uploaderJustificatif(file);
    }
}
