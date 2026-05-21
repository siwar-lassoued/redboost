// ============================================================================
// 1. UPDATED GmailConfig - Add Calendar API Support
// ============================================================================
package team.project.redboost.config;
import org.springframework.beans.factory.annotation.Autowired;
import com.google.api.client.auth.oauth2.Credential;
import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeFlow;
import com.google.api.client.googleapis.auth.oauth2.GoogleClientSecrets;
import com.google.api.client.googleapis.auth.oauth2.GoogleTokenResponse;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.jackson2.JacksonFactory;
import com.google.api.client.util.store.FileDataStoreFactory;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.CalendarScopes;
import com.google.api.services.gmail.Gmail;
import com.google.api.services.gmail.GmailScopes;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.File;
import java.io.IOException;
import java.io.StringReader;
import java.security.GeneralSecurityException;
import java.util.Arrays;
import java.util.List;

@Configuration
public class GmailConfig {

    private static final String APPLICATION_NAME = "Redboost";
    private static final JsonFactory JSON_FACTORY = JacksonFactory.getDefaultInstance();
    private static final String TOKENS_DIRECTORY_PATH = "tokens";
    private static final Logger logger = LoggerFactory.getLogger(GmailConfig.class);

    // UPDATED: Add both Gmail and Calendar scopes
    private static final List<String> SCOPES = Arrays.asList(
            GmailScopes.GMAIL_SEND,
            CalendarScopes.CALENDAR
    );

    @Value("${google.oauth.client-id}")
    private String clientId;

    @Value("${google.oauth.client-secret}")
    private String clientSecret;

    @Value("${google.oauth.refresh-token}")
    private String refreshToken;

    @Value("${google.oauth.organizer-email}")
    private String organizerEmail;

    @Bean
    public Credential credential() throws IOException, GeneralSecurityException {
        if (refreshToken == null || refreshToken.isEmpty() || clientId == null || clientId.isEmpty() || clientSecret == null || clientSecret.isEmpty()) {
            logger.warn("Google OAuth credentials are not fully configured (missing client-id, client-secret, or refresh-token). Google services will be disabled.");
            return null;
        }
        final NetHttpTransport HTTP_TRANSPORT = GoogleNetHttpTransport.newTrustedTransport();
        Credential credential = getCredentials(HTTP_TRANSPORT);
        return credential;
    }

   @Bean
public Gmail gmailService(@Autowired(required = false) Credential credential) throws IOException, GeneralSecurityException {
    if (credential == null) {
        return null;
    }
    final NetHttpTransport HTTP_TRANSPORT = GoogleNetHttpTransport.newTrustedTransport();
    return new Gmail.Builder(HTTP_TRANSPORT, JSON_FACTORY, credential)
            .setApplicationName(APPLICATION_NAME)
            .build();
}

@Bean
public Calendar calendarService(@Autowired(required = false) Credential credential) throws IOException, GeneralSecurityException {
    if (credential == null) {
        return null;
    }
    final NetHttpTransport HTTP_TRANSPORT = GoogleNetHttpTransport.newTrustedTransport();
    return new Calendar.Builder(HTTP_TRANSPORT, JSON_FACTORY, credential)
            .setApplicationName(APPLICATION_NAME)
            .build();
}

    @Bean
    public String organizerEmail() {
        return organizerEmail;
    }

    private Credential getCredentials(final NetHttpTransport HTTP_TRANSPORT) throws IOException {

        GoogleClientSecrets clientSecrets = GoogleClientSecrets.load(
                JSON_FACTORY,
                new StringReader("{\"installed\":{\"client_id\":\"" + clientId + "\",\"client_secret\":\"" + clientSecret + "\"}}")
        );

        // UPDATED: Use both scopes
        GoogleAuthorizationCodeFlow flow = new GoogleAuthorizationCodeFlow.Builder(
                HTTP_TRANSPORT, JSON_FACTORY, clientSecrets, SCOPES)
                .setDataStoreFactory(new FileDataStoreFactory(new File(TOKENS_DIRECTORY_PATH)))
                .setAccessType("offline")
                .build();

        GoogleTokenResponse tokenResponse = new GoogleTokenResponse().setRefreshToken(refreshToken);
        Credential credential = flow.createAndStoreCredential(tokenResponse, "user");
//        refreshCredentialIfNeeded(credential);
        return credential;
    }

    private void refreshCredentialIfNeeded(Credential credential) throws IOException {
        synchronized (credential) {
            if (credential.getExpiresInSeconds() == null || credential.getExpiresInSeconds() <= 60) {
                logger.info("Initial access token expired or unavailable, refreshing proactively.");
                if (!credential.refreshToken()) {
                    logger.error("Failed to refresh token during initialization. Check refresh token validity.");
                    throw new IOException("Unable to refresh token during initialization.");
                }
                logger.info("Token refreshed successfully during initialization.");
            }
        }
    }
}