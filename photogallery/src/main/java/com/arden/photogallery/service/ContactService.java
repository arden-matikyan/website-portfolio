package com.arden.photogallery.service;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.HtmlUtils;

import com.arden.photogallery.contact.ContactSubmissionRequest;

import reactor.core.publisher.Mono;

@Service
public class ContactService {

    private final WebClient resendClient = WebClient.builder()
            .baseUrl("https://api.resend.com")
            .build();

    @Value("${app.contact.email.api-key:}")
    private String apiKey;

    @Value("${app.contact.email.from:}")
    private String fromAddress;

    @Value("${app.contact.email.to:}")
    private String recipientAddress;

    public void sendContactMessage(ContactSubmissionRequest request) {
        if (!isConfigured()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Contact form is not configured yet.");
        }

        Map<String, Object> payload = Map.of(
                "from", fromAddress,
                "to", List.of(recipientAddress),
                "subject", "Portfolio contact from " + request.trimmedName(),
                "html", buildHtmlBody(request),
                "text", buildTextBody(request),
                "replyTo", request.trimmedEmail());

        resendClient.post()
                .uri("/emails")
                .header("Authorization", "Bearer " + apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(payload)
                .retrieve()
                .onStatus(
                        status -> status.isError(),
                        clientResponse -> clientResponse.bodyToMono(String.class)
                                .defaultIfEmpty("Unknown email provider error")
                                .flatMap(body -> Mono.error(new ResponseStatusException(
                                        HttpStatus.BAD_GATEWAY,
                                        "Email delivery failed: " + body))))
                .bodyToMono(Map.class)
                .block();
    }

    private boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank()
                && fromAddress != null && !fromAddress.isBlank()
                && recipientAddress != null && !recipientAddress.isBlank();
    }

    private String buildTextBody(ContactSubmissionRequest request) {
        return """
                New portfolio contact submission

                Name: %s
                Email: %s
                Submitted: %s

                Message:
                %s
                """.formatted(
                request.trimmedName(),
                request.trimmedEmail(),
                Instant.now(),
                request.trimmedMessage());
    }

    private String buildHtmlBody(ContactSubmissionRequest request) {
        return """
                <h2>New portfolio contact submission</h2>
                <p><strong>Name:</strong> %s</p>
                <p><strong>Email:</strong> %s</p>
                <p><strong>Submitted:</strong> %s</p>
                <p><strong>Message:</strong></p>
                <p>%s</p>
                """.formatted(
                HtmlUtils.htmlEscape(request.trimmedName()),
                HtmlUtils.htmlEscape(request.trimmedEmail()),
                HtmlUtils.htmlEscape(Instant.now().toString()),
                HtmlUtils.htmlEscape(request.trimmedMessage()).replace("\n", "<br />"));
    }
}
