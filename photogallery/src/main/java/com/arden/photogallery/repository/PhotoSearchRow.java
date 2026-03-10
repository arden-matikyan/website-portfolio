package com.arden.photogallery.repository;

import java.time.LocalDateTime;

public interface PhotoSearchRow {
    Long getId();
    String getTitle();
    String getS3Url();
    String getCaption();
    String getMood();
    String getStyle();
    String getLighting();
    String getPrimarySubject();
    Integer getWidth();
    Integer getHeight();
    Double getAspectRatio();
    LocalDateTime getCreatedAt();
}
