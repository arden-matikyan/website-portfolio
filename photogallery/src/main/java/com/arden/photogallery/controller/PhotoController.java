package com.arden.photogallery.controller;

import java.io.IOException;
import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.arden.photogallery.model.Photo;
import com.arden.photogallery.repository.PhotoRepository;
import com.arden.photogallery.service.EmbeddingService;
import com.arden.photogallery.service.OpenAIService;
import com.arden.photogallery.service.PhotoService;
import com.arden.photogallery.service.S3Service;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/photos")
@RequiredArgsConstructor
@CrossOrigin
public class PhotoController {

    private final PhotoService photoService;
    private final S3Service s3Service;
    // private final AIService aiService;
    private final OpenAIService openAIService;
    private final EmbeddingService embeddingService;
    private final PhotoRepository photoRepository;

    @PostMapping
    public Photo createPhoto(@RequestBody Photo photo) {
        return photoService.savePhoto(photo);
    }

    @GetMapping
    public List<Photo> getAllPhotos() {
        return photoService.getAllPhotos();
    }

    @GetMapping("/{id:\\d+}")
    public Photo getPhoto(@PathVariable Long id) {
        return photoService.getPhoto(id);
    }

    @DeleteMapping("/{id}")
    public void deletePhoto(@PathVariable Long id) {
        photoService.deletePhoto(id);
    }

    @GetMapping("/search")
    public List<Photo> semanticSearch(@RequestParam String q) {

        float[] queryVector = embeddingService.generateEmbedding(q);

        String vectorLiteral = toVectorLiteral(queryVector);

        return photoRepository.searchByEmbedding(vectorLiteral);
    }

    private String toVectorLiteral(float[] vector) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < vector.length; i++) {
            sb.append(vector[i]);
            if (i < vector.length - 1) {
                sb.append(",");
            }
        }
        sb.append("]");
        return sb.toString();
    }


    @PostMapping("/upload")
    public Photo uploadPhoto(
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) String title
    ) throws IOException {

        // upload to s3 
        String s3Url = s3Service.uploadFile(
                file.getOriginalFilename(),
                file.getBytes()
        );

        // extract object key 
        String objectKey = s3Url.substring(s3Url.lastIndexOf("/") + 1);

        // generate url for gpt access 
        String presignedUrl = s3Service.generatePresignedUrl(objectKey);

        System.out.println("Presigned URL: " + presignedUrl);

       // use gpt vision to analyze image 
        Map<String, Object> metadata;
        try {
            metadata = openAIService.analyzeImage(presignedUrl);
        } catch (Exception e) {
            throw new RuntimeException("Vision analysis failed", e);
        }

        // save with gpt output 
        Photo photo = new Photo();
        photo.setTitle(title);
        photo.setS3Url(s3Url);




        photo.setCaption((String) metadata.get("caption"));
        photo.setMood((String) metadata.get("mood"));
        photo.setStyle((String) metadata.get("style"));
        photo.setLighting((String) metadata.get("lighting"));
        photo.setPrimarySubject((String) metadata.get("primary_subject"));


        String combinedText =
        metadata.get("caption") + " " +
        metadata.get("mood") + " " +
        metadata.get("style") + " " +
        metadata.get("lighting");

        float[] vector = embeddingService.generateEmbedding(combinedText);

        photo.setEmbedding(vector);



        return photoService.savePhoto(photo);
    }

}
