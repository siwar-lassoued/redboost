// Optional: Create directories on application startup

// src/main/java/team/project/redboost/config/FileStorageInitializer.java

package team.project.redboost.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Component
public class FileStorageInitializer {

    @Value("${file.upload.sprint-documents-dir:uploads/sprint-documents}")
    private String sprintDocumentsDir;

    @Value("${file.upload.activity-documents-dir:uploads/activity-documents}")
    private String activityDocumentsDir;

    @Value("${file.upload.tache-documents-dir:uploads/tache-documents}")
    private String tacheDocumentsDir;

    @PostConstruct
    public void init() {
        try {
            // Create directories if they don't exist
            Files.createDirectories(Paths.get(sprintDocumentsDir));
            Files.createDirectories(Paths.get(activityDocumentsDir));
            Files.createDirectories(Paths.get(tacheDocumentsDir));
            
            System.out.println("✅ File storage directories initialized:");
            System.out.println("   - Sprint documents: " + sprintDocumentsDir);
            System.out.println("   - Activity documents: " + activityDocumentsDir);
            System.out.println("   - Tache documents: " + tacheDocumentsDir);
            
        } catch (IOException e) {
            throw new RuntimeException("Could not create upload directories!", e);
        }
    }
}