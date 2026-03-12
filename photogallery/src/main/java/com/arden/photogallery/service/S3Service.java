package com.arden.photogallery.service;

import java.net.URI;
import java.time.Duration;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;


@Service
@RequiredArgsConstructor
public class S3Service {

    private final S3Client s3Client;

    // inject from yaml 
    @Value("${aws.s3.bucket}")
    private String bucketName;

    public String uploadFile(String originalFilename, byte[] fileBytes) {

        String key = UUID.randomUUID() + "_" + originalFilename;

        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .contentType("image/jpeg")
                .build();

        s3Client.putObject(putObjectRequest, RequestBody.fromBytes(fileBytes));

        return "https://" + bucketName + ".s3.amazonaws.com/" + key;
    }

    public String generatePresignedUrl(String key) {

        try (S3Presigner presigner = S3Presigner.create()) {

            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();

            GetObjectPresignRequest presignRequest
                    = GetObjectPresignRequest.builder()
                            .signatureDuration(Duration.ofMinutes(10))
                            .getObjectRequest(getObjectRequest)
                            .build();

            return presigner.presignGetObject(presignRequest)
                    .url()
                    .toString();
        }
    }

    public String generatePresignedUrlFromStoredUrl(String storedUrlOrKey) {
        if (storedUrlOrKey == null || storedUrlOrKey.isBlank()) {
            return storedUrlOrKey;
        }

        try {
            String key = extractObjectKey(storedUrlOrKey);
            return generatePresignedUrl(key);
        } catch (RuntimeException e) {
            return storedUrlOrKey;
        }
    }

    private String extractObjectKey(String storedUrlOrKey) {
        if (!storedUrlOrKey.startsWith("http://") && !storedUrlOrKey.startsWith("https://")) {
            return storedUrlOrKey;
        }

        try {
            URI uri = URI.create(storedUrlOrKey);
            String path = uri.getPath();

            if (path == null || path.isBlank()) {
                throw new IllegalArgumentException("Invalid S3 URL: missing object key");
            }

            String trimmedPath = path.startsWith("/") ? path.substring(1) : path;
            String bucketPrefix = bucketName + "/";

            if (trimmedPath.startsWith(bucketPrefix)) {
                return trimmedPath.substring(bucketPrefix.length());
            }

            return trimmedPath;
        } catch (Exception e) {
            // Fallback parsing for URLs containing spaces or other characters that break URI parsing.
            try {
                String marker = ".amazonaws.com/";
                int idx = storedUrlOrKey.indexOf(marker);
                if (idx >= 0) {
                    String trailing = storedUrlOrKey.substring(idx + marker.length());
                    int q = trailing.indexOf('?');
                    return q >= 0 ? trailing.substring(0, q) : trailing;
                }
            } catch (Exception ignore) {
                // fall through to last-resort extraction
            }

            int lastSlash = storedUrlOrKey.lastIndexOf('/');
            String key = lastSlash >= 0 ? storedUrlOrKey.substring(lastSlash + 1) : storedUrlOrKey;
            int q = key.indexOf('?');
            if (q >= 0) {
                key = key.substring(0, q);
            }
            return key;
        }
    }
}
