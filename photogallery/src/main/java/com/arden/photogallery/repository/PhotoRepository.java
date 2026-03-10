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
        SELECT id
        FROM photo
        ORDER BY embedding <-> CAST(:queryEmbedding AS vector)
        LIMIT 10
        """, nativeQuery = true)
    List<Long> searchIdsByEmbedding(@Param("queryEmbedding") String queryEmbedding);

    @Query(value = """
        SELECT
            id AS id,
            title AS title,
            s3url AS s3Url,
            caption AS caption,
            mood AS mood,
            style AS style,
            lighting AS lighting,
            primary_subject AS primarySubject,
            width AS width,
            height AS height,
            aspect_ratio AS aspectRatio,
            created_at AS createdAt
        FROM photo
        ORDER BY created_at DESC
        """, nativeQuery = true)
    List<PhotoSearchRow> findAllGalleryRows();

    @Query(value = """
        SELECT
            id AS id,
            title AS title,
            s3url AS s3Url,
            caption AS caption,
            mood AS mood,
            style AS style,
            lighting AS lighting,
            primary_subject AS primarySubject,
            width AS width,
            height AS height,
            aspect_ratio AS aspectRatio,
            created_at AS createdAt
        FROM photo
        WHERE id IN (:ids)
        """, nativeQuery = true)
    List<PhotoSearchRow> findSearchRowsByIds(@Param("ids") List<Long> ids);
    }
