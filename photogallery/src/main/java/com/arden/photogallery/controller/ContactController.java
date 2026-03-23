package com.arden.photogallery.controller;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.arden.photogallery.contact.ContactSubmissionRequest;
import com.arden.photogallery.contact.ContactSubmissionResponse;
import com.arden.photogallery.service.ContactService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/contact")
@RequiredArgsConstructor
public class ContactController {

    private static final Duration CONTACT_RATE_LIMIT_WINDOW = Duration.ofHours(1);
    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    @Value("${app.contact.rate-limit.per-ip:5}")
    private int requestsPerIpPerWindow;

    private final Map<String, ArrayDeque<Instant>> contactRequestsByIp = new ConcurrentHashMap<>();

    private final ContactService contactService;

    @PostMapping
    public ContactSubmissionResponse submitContact(
            @RequestBody(required = false) ContactSubmissionRequest request,
            HttpServletRequest servletRequest) {
        validateRequest(request);

        if (request.isSpam()) {
            return new ContactSubmissionResponse(true, "Message sent.");
        }

        enforceContactRateLimit(servletRequest);

        contactService.sendContactMessage(request);
        return new ContactSubmissionResponse(true, "Message sent.");
    }

    private void validateRequest(ContactSubmissionRequest request) {
        if (request == null) {
            throw new BadRequestException("Request body is required.");
        }

        if (request.website() != null && request.website().length() > 120) {
            throw new BadRequestException("Website must be 120 characters or fewer.");
        }

        if (request.isSpam()) {
            return;
        }

        String name = request.trimmedName();
        String email = request.trimmedEmail();
        String message = request.trimmedMessage();

        if (name.isBlank()) {
            throw new BadRequestException("Name is required.");
        }

        if (name.length() > 80) {
            throw new BadRequestException("Name must be 80 characters or fewer.");
        }

        if (email.isBlank()) {
            throw new BadRequestException("Email is required.");
        }

        if (email.length() > 254 || !EMAIL_PATTERN.matcher(email).matches()) {
            throw new BadRequestException("Enter a valid email address.");
        }

        if (message.isBlank()) {
            throw new BadRequestException("Message is required.");
        }

        if (message.length() < 10 || message.length() > 2000) {
            throw new BadRequestException("Message must be between 10 and 2000 characters.");
        }
    }

    private void enforceContactRateLimit(HttpServletRequest request) {
        if (requestsPerIpPerWindow <= 0) {
            return;
        }

        String clientIp = extractClientIp(request);
        Instant now = Instant.now();
        Instant cutoff = now.minus(CONTACT_RATE_LIMIT_WINDOW);
        ArrayDeque<Instant> timestamps = contactRequestsByIp.computeIfAbsent(clientIp, ignored -> new ArrayDeque<>());

        synchronized (timestamps) {
            while (!timestamps.isEmpty() && timestamps.peekFirst().isBefore(cutoff)) {
                timestamps.pollFirst();
            }

            if (timestamps.size() >= requestsPerIpPerWindow) {
                throw new TooManyRequestsException();
            }

            timestamps.addLast(now);
        }
    }

    private String extractClientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }

        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }

        return request.getRemoteAddr();
    }

    @ResponseStatus(HttpStatus.TOO_MANY_REQUESTS)
    private static class TooManyRequestsException extends RuntimeException {
    }

    @ResponseStatus(HttpStatus.BAD_REQUEST)
    private static class BadRequestException extends RuntimeException {
        private BadRequestException(String message) {
            super(message);
        }
    }
}
