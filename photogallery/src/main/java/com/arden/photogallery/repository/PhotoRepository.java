package com.arden.photogallery.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.arden.photogallery.model.Photo;




public interface PhotoRepository extends JpaRepository<Photo, Long> {

    // TODO: replace search with primary subject, mood embedding, or descrptions? 

    // List<Photo> findByTagsContainingIgnoreCase(String tag);

   @Query(value = """
        SELECT id, title, s3url, caption, mood, style, lighting, primary_subject, embedding, created_at
        FROM photo
        ORDER BY embedding <-> CAST(:queryEmbedding AS vector)
        LIMIT 10
        """, nativeQuery = true)
    List<Photo> searchByEmbedding(@Param("queryEmbedding") String queryEmbedding);
    }
