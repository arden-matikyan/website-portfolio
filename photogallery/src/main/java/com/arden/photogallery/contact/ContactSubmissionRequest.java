package com.arden.photogallery.contact;

public record ContactSubmissionRequest(
        String name,

        String email,

        String message,

        String website
) {
    public String trimmedName() {
        return name == null ? "" : name.trim();
    }

    public String trimmedEmail() {
        return email == null ? "" : email.trim();
    }

    public String trimmedMessage() {
        return message == null ? "" : message.trim();
    }

    public boolean isSpam() {
        return website != null && !website.isBlank();
    }
}
