package com.arden.photogallery.model;


// JPA translates your Java object into SQL automatically
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Data;

// @Entity (from javax.persistence or jakarta.persistence) marks the class as a JPA entity that will be persisted to a database table
// @Data (from Lombok) is a compile‑time code generator that creates getters, setters, toString, equals, hashCode, and a required‑args constructor for all non‑final fields
@Entity
@Data
public class Photo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(columnDefinition = "vector(1536)")
    private float[] embedding;

    @Column(length = 2000)
    private String caption;

    private String mood;

    private String style;

    private String lighting;

    private String primarySubject;

    private String s3Url;


    private LocalDateTime createdAt;
}

