package team.project.redboost.services;

import com.google.api.client.auth.oauth2.Credential;
import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeFlow;
import com.google.api.client.googleapis.auth.oauth2.GoogleClientSecrets;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.ByteArrayContent;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.client.util.store.FileDataStoreFactory;
import com.google.api.services.drive.Drive;
import com.google.api.services.drive.model.File;
import com.google.api.services.drive.model.Permission;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.security.GeneralSecurityException;
import java.util.Collections;

@Service
@Slf4j
public class GoogleDriveService {

    private static final JsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();
    private static final String APPLICATION_NAME = "RedBoost Platform";
    private static final String DRIVE_SCOPE = "https://www.googleapis.com/auth/drive";

    @Value("${google.drive.folder.id}")
    private String folderId;

    @Value("${google.drive.credentials.path}")
    private String credentialsPath;

    @Value("${google.drive.tokens.directory}")
    private String tokensDirectory;

    private Drive getDriveService() throws IOException, GeneralSecurityException {
        log.info("Loading Google Drive credentials from: {}", credentialsPath);

        GoogleClientSecrets clientSecrets = GoogleClientSecrets.load(
                JSON_FACTORY,
                new InputStreamReader(new FileInputStream(credentialsPath))
        );

        GoogleAuthorizationCodeFlow flow = new GoogleAuthorizationCodeFlow.Builder(
                GoogleNetHttpTransport.newTrustedTransport(),
                JSON_FACTORY,
                clientSecrets,
                Collections.singleton(DRIVE_SCOPE)
        )
                .setDataStoreFactory(new FileDataStoreFactory(new java.io.File(tokensDirectory)))
                .setAccessType("offline")
                .build();

        Credential credential = flow.loadCredential("user");

        if (credential == null) {
            throw new RuntimeException(
                    "No saved credentials found in '" + tokensDirectory + "'. Run DriveAuthSetup first."
            );
        }

        if (credential.getExpiresInSeconds() != null && credential.getExpiresInSeconds() <= 60) {
            log.info("Token expiring soon, refreshing...");
            credential.refreshToken();
        }

        return new Drive.Builder(
                GoogleNetHttpTransport.newTrustedTransport(),
                JSON_FACTORY,
                credential)
                .setApplicationName(APPLICATION_NAME)
                .build();
    }

    public DriveUploadResult uploadDocxAndGetShareableLink(byte[] docxBytes, String fileName) {
        try {
            Drive driveService = getDriveService();

            if (folderId == null || folderId.isEmpty()) {
                throw new RuntimeException("google.drive.folder.id is not configured");
            }

            log.info("Uploading '{}' ({} bytes) to folder: {}", fileName, docxBytes.length, folderId);

            File fileMetadata = new File();
            fileMetadata.setName(fileName);
            fileMetadata.setMimeType("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
            fileMetadata.setParents(Collections.singletonList(folderId));

            ByteArrayContent mediaContent = new ByteArrayContent(
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    docxBytes
            );

            File uploadedFile = driveService.files().create(fileMetadata, mediaContent)
                    .setFields("id, webViewLink, webContentLink")
                    .execute();

            log.info("File uploaded. ID: {}", uploadedFile.getId());

            Permission permission = new Permission();
            permission.setType("anyone");
            permission.setRole("reader");
            driveService.permissions()
                    .create(uploadedFile.getId(), permission)
                    .setFields("id")
                    .execute();

            log.info("✅ Upload complete. View link: {}", uploadedFile.getWebViewLink());

            return new DriveUploadResult(
                    uploadedFile.getId(),
                    uploadedFile.getWebViewLink(),
                    uploadedFile.getWebContentLink()
            );

        } catch (IOException | GeneralSecurityException e) {
            log.error("❌ Failed to upload to Google Drive", e);
            throw new RuntimeException("Failed to upload: " + e.getMessage(), e);
        }
    }

    public void deleteFile(String fileId) {
        try {
            Drive driveService = getDriveService();
            driveService.files().delete(fileId).execute();
            log.info("File deleted: {}", fileId);
        } catch (IOException | GeneralSecurityException e) {
            log.error("Delete failed for file: {}", fileId, e);
            throw new RuntimeException("Delete failed: " + e.getMessage(), e);
        }
    }

    public static class DriveUploadResult {
        private final String fileId;
        private final String viewLink;
        private final String downloadLink;

        public DriveUploadResult(String fileId, String viewLink, String downloadLink) {
            this.fileId = fileId;
            this.viewLink = viewLink;
            this.downloadLink = downloadLink;
        }

        public String getFileId() { return fileId; }
        public String getViewLink() { return viewLink; }
        public String getDownloadLink() { return downloadLink; }
    }
}