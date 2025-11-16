package com.onbording.poc.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class KeycloakTokenService {

    private final RestClient keycloakRestClient;

    @Value("${camunda.client.auth.client-id}")
    private String clientId;

    @Value("${camunda.client.auth.client-secret}")
    private String clientSecret;

    @Value("${camunda.client.auth.token-url}")
    private String tokenUrl;

    public KeycloakTokenService() {
        this.keycloakRestClient = RestClient.builder().build();
    }

    record TokenResponse(String access_token, String token_type, long expires_in) {}

    public String getAccessToken() {
        String form = "grant_type=client_credentials"
                + "&client_id=" + clientId
                + "&client_secret=" + clientSecret;

        TokenResponse resp = keycloakRestClient.post()
                .uri(tokenUrl) // full token URL
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(form)
                .retrieve()
                .body(TokenResponse.class);

        if (resp == null || resp.access_token() == null) {
            throw new IllegalStateException("Failed to get access token from Keycloak");
        }
        return resp.access_token();
    }
}
