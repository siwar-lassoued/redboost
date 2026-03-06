package team.project.redboost.config;

import com.google.api.client.auth.oauth2.Credential;
import com.google.api.client.extensions.java6.auth.oauth2.AuthorizationCodeInstalledApp;
import com.google.api.client.extensions.jetty.auth.oauth2.LocalServerReceiver;
import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeFlow;
import com.google.api.client.googleapis.auth.oauth2.GoogleClientSecrets;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.client.util.store.FileDataStoreFactory;

import java.io.FileInputStream;
import java.io.InputStreamReader;
import java.util.Collections;

/**
 * One-time OAuth token generator.
 *
 * Usage:
 *   java DriveAuthSetup [credentialsPath] [tokensDirectory]
 *
 * Defaults (dev):
 *   credentialsPath  = src/main/resources/google-oauth-credentials.json
 *   tokensDirectory  = src/main/resources/tokens
 *
 * Production example:
 *   java DriveAuthSetup /home/redboost/config/google-oauth-credentials.json /home/redboost/tokens
 */
public class DriveAuthSetup {

    private static final String DRIVE_SCOPE = "https://www.googleapis.com/auth/drive";

    public static void main(String[] args) throws Exception {
        String credentialsPath = args.length > 0
                ? args[0]
                : "src/main/resources/google-oauth-credentials.json";

        String tokensDirectory = args.length > 1
                ? args[1]
                : "src/main/resources/tokens";

        System.out.println("Credentials : " + credentialsPath);
        System.out.println("Tokens dir  : " + tokensDirectory);

        JsonFactory jsonFactory = GsonFactory.getDefaultInstance();

        GoogleClientSecrets clientSecrets = GoogleClientSecrets.load(
                jsonFactory,
                new InputStreamReader(new FileInputStream(credentialsPath))
        );

        GoogleAuthorizationCodeFlow flow = new GoogleAuthorizationCodeFlow.Builder(
                GoogleNetHttpTransport.newTrustedTransport(),
                jsonFactory,
                clientSecrets,
                Collections.singleton(DRIVE_SCOPE)
        )
                .setDataStoreFactory(new FileDataStoreFactory(new java.io.File(tokensDirectory)))
                .setAccessType("offline")
                .setApprovalPrompt("force")
                .build();

        LocalServerReceiver receiver = new LocalServerReceiver.Builder().setPort(8888).build();
        Credential credential = new AuthorizationCodeInstalledApp(flow, receiver).authorize("user");

        System.out.println("\n✅ Authentication complete!");
        System.out.println("📁 Token saved to: " + tokensDirectory + "/StoredCredential");
    }
}