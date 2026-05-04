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

    public Photo uploaderPhoto(MultipartFile file, Annonce annonce) {
        try {
            Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.emptyMap());
            Object secureUrl = uploadResult.get("secure_url");
            Object defaultUrl = uploadResult.get("url");
            String url = secureUrl != null ? secureUrl.toString() : (defaultUrl != null ? defaultUrl.toString() : null);

            Photo photo = new Photo();
            photo.setAnnonce(annonce);
            photo.setUrl(url);
            // TODO: Integrate pHash calculation
            photo.setPhash(null);
            photo.setEstPrincipale(Boolean.FALSE);
            photo.setOrdre((short) 1);

            // Business rule: the 2-to-10 photos constraint should be validated in controller/service flow.
            return photoRepository.save(photo);
        } catch (IOException exception) {
            throw new IllegalStateException("Cloudinary upload failed", exception);
        }
    }
}
