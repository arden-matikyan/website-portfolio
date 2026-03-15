package com.arden.photogallery.controller;

import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

import javax.imageio.ImageIO;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.HttpStatus;

import com.arden.photogallery.model.Photo;
import com.arden.photogallery.repository.PhotoRepository;
import com.arden.photogallery.repository.PhotoSearchRow;
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

    private static final int EMBEDDING_DIMENSION = 1536;

    @Value("${app.ai.mock-enabled:false}")
    private boolean mockAiEnabled;

    @Value("${app.admin.token:}")
    private String adminToken;

    private final PhotoService photoService;
    private final S3Service s3Service;
    // private final AIService aiService;
    private final OpenAIService openAIService;
    private final EmbeddingService embeddingService;
    private final PhotoRepository photoRepository;

    @PostMapping
    public Photo createPhoto(
            @RequestHeader(value = "X-Admin-Token", required = false) String providedToken,
            @RequestBody Photo photo) {
        requireAdminToken(providedToken);
        return photoService.savePhoto(photo);
    }

    @GetMapping
    public List<Photo> getAllPhotos() {
        return photoService.getAllPhotos()
                .stream()
                .map(this::withReadableS3Url)
                .toList();
    }

    @GetMapping("/{id:\\d+}")
    public Photo getPhoto(@PathVariable Long id) {
        return withReadableS3Url(photoService.getPhoto(id));
    }

    @DeleteMapping("/{id}")
    public void deletePhoto(
            @RequestHeader(value = "X-Admin-Token", required = false) String providedToken,
            @PathVariable Long id) {
        requireAdminToken(providedToken);
        photoService.deletePhoto(id);
    }

    @GetMapping("/search")
    public List<Photo> semanticSearch(@RequestParam(required = false, defaultValue = "") String q) {
        String normalizedQuery = q == null ? "" : q.trim();
        if (normalizedQuery.length() > 100) {
            normalizedQuery = normalizedQuery.substring(0, 100);
        }

        if (normalizedQuery.isBlank()) {
            return photoService.getAllPhotos()
                    .stream()
                    .map(this::withReadableS3Url)
                    .toList();
        }

        float[] queryVector = mockAiEnabled
                ? buildMockEmbedding(normalizedQuery)
                : embeddingService.generateEmbedding(normalizedQuery);

        String vectorLiteral = toVectorLiteral(queryVector);

        List<Long> ids = photoRepository.searchIdsByEmbedding(vectorLiteral);
        if (ids.isEmpty()) {
            return List.of();
        }

        Map<Long, PhotoSearchRow> rowsById = new HashMap<>();
        for (PhotoSearchRow row : photoRepository.findSearchRowsByIds(ids)) {
            rowsById.put(row.getId(), row);
        }

        return ids.stream()
                .map(rowsById::get)
                .filter(java.util.Objects::nonNull)
                .map(this::toSearchPhotoWithReadableUrl)
                .toList();
    }

    private Photo toSearchPhotoWithReadableUrl(PhotoSearchRow row) {
        Photo photo = new Photo();
        photo.setId(row.getId());
        photo.setTitle(row.getTitle());
        photo.setS3Url(s3Service.generatePresignedUrlFromStoredUrl(row.getS3Url()));
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

    private Photo withReadableS3Url(Photo photo) {
        if (photo == null) {
            return null;
        }

        String storedUrl = photo.getS3Url();
        if (storedUrl == null || storedUrl.isBlank()) {
            return photo;
        }

        photo.setS3Url(s3Service.generatePresignedUrlFromStoredUrl(storedUrl));
        return photo;
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
            @RequestHeader(value = "X-Admin-Token", required = false) String providedToken,
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) String title
    ) throws IOException {
        requireAdminToken(providedToken);

        byte[] fileBytes = file.getBytes();
        ImageDimensions dimensions = extractImageDimensions(fileBytes);

        // upload to s3 
        String s3Url = s3Service.uploadFile(
                file.getOriginalFilename(),
                fileBytes
        );

        // save with gpt output 
        Photo photo = new Photo();
        photo.setTitle(title);
        photo.setS3Url(s3Url);
        if (dimensions != null) {
            photo.setWidth(dimensions.width());
            photo.setHeight(dimensions.height());
            photo.setAspectRatio(dimensions.aspectRatio());
        }

        // use gpt vision to analyze image 
        Map<String, Object> metadata;
        if (mockAiEnabled) {
            metadata = buildMockMetadata(title, file.getOriginalFilename());
        } else {
            String objectKey = s3Url.substring(s3Url.lastIndexOf("/") + 1);
            String presignedUrl = s3Service.generatePresignedUrl(objectKey);
            try {
                metadata = openAIService.analyzeImage(presignedUrl);
            } catch (Exception e) {
                throw new RuntimeException("Vision analysis failed", e);
            }
        }


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




        float[] vector = mockAiEnabled
                ? buildMockEmbedding(combinedText)
                : embeddingService.generateEmbedding(combinedText);

        photo.setEmbedding(vector);



        Photo savedPhoto = photoService.savePhoto(photo);
        return withReadableS3Url(savedPhoto);
    }

    private Map<String, Object> buildMockMetadata(String title, String originalFilename) {
        String fallbackTitle = (title != null && !title.isBlank())
                ? title
                : (originalFilename != null ? originalFilename : "Untitled");

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("caption", "Mock caption for " + fallbackTitle);
        metadata.put("mood", "calm");
        metadata.put("style", "documentary");
        metadata.put("lighting", "natural");
        metadata.put("primary_subject", fallbackTitle);
        return metadata;
    }

    private float[] buildMockEmbedding(String seedText) {
        String source = (seedText == null || seedText.isBlank()) ? "mock-seed" : seedText;
        Random random = new Random(source.hashCode());
        float[] vector = new float[EMBEDDING_DIMENSION];

        for (int i = 0; i < vector.length; i++) {
            vector[i] = (float) (random.nextDouble() * 2.0 - 1.0);
        }

        return vector;
    }

    private ImageDimensions extractImageDimensions(byte[] fileBytes) {
        try (ByteArrayInputStream inputStream = new ByteArrayInputStream(fileBytes)) {
            BufferedImage image = ImageIO.read(inputStream);
            if (image == null || image.getWidth() <= 0 || image.getHeight() <= 0) {
                return null;
            }

            int width = image.getWidth();
            int height = image.getHeight();
            double aspectRatio = (double) width / height;
            return new ImageDimensions(width, height, aspectRatio);
        } catch (IOException e) {
            return null;
        }
    }

    private void requireAdminToken(String providedToken) {
        if (!tokensMatch(adminToken, providedToken)) {
            throw new UnauthorizedException();
        }
    }

    private boolean tokensMatch(String expectedToken, String providedToken) {
        if (expectedToken == null || expectedToken.isBlank() || providedToken == null) {
            return false;
        }

        return MessageDigest.isEqual(
                expectedToken.getBytes(StandardCharsets.UTF_8),
                providedToken.getBytes(StandardCharsets.UTF_8));
    }

    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    private static class UnauthorizedException extends RuntimeException {
    }

    private record ImageDimensions(int width, int height, double aspectRatio) {
    }
}
