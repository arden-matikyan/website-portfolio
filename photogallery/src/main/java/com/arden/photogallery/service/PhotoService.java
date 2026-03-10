package com.arden.photogallery.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.arden.photogallery.model.Photo;
import com.arden.photogallery.repository.PhotoRepository;
import com.arden.photogallery.repository.PhotoSearchRow;

import lombok.RequiredArgsConstructor;
// @Service: . It’s primarily a semantic marker for the service layer (business logic), but functionally identical to @Component

@Service
@RequiredArgsConstructor
public class PhotoService {

    private final PhotoRepository photoRepository;

    public Photo savePhoto(Photo photo) {
        photo.setCreatedAt(LocalDateTime.now());
        return photoRepository.save(photo);
    }

    public List<Photo> getAllPhotos() {
        return photoRepository.findAllGalleryRows()
                .stream()
                .map(this::toPhoto)
                .toList();
    }

    public Photo getPhoto(Long id) {
        return photoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Photo not found"));
    }

    public void deletePhoto(Long id) {
        photoRepository.deleteById(id);
    }

    private Photo toPhoto(PhotoSearchRow row) {
        Photo photo = new Photo();
        photo.setId(row.getId());
        photo.setTitle(row.getTitle());
        photo.setS3Url(row.getS3Url());
        photo.setCaption(row.getCaption());
        photo.setMood(row.getMood());
        photo.setStyle(row.getStyle());
        photo.setLighting(row.getLighting());
        photo.setPrimarySubject(row.getPrimarySubject());
        photo.setWidth(row.getWidth());
        photo.setHeight(row.getHeight());
        photo.setAspectRatio(row.getAspectRatio());
        photo.setCreatedAt(row.getCreatedAt());
        return photo;
    }

    /* 
    public List<Photo> searchByTag(String tag) {
        return photoRepository.findByTagsContainingIgnoreCase(tag);
    }
    


    public List<Photo> search(String query) {

        if (query == null || query.isBlank()) {
            return List.of();
        }

        String[] keywords = query.toLowerCase().split(" ");

        return photoRepository.findAll()
                .stream()
                .filter(photo -> {

                    String tags = photo.getTags();

                    if (tags == null || tags.isBlank()) {
                        return false;
                    }

                    String lowerTags = tags.toLowerCase();

                    for (String keyword : keywords) {
                        if (lowerTags.contains(keyword)) {
                            return true;
                        }
                    }

                    return false;
                })
                .toList();
    }
    */ 


}
