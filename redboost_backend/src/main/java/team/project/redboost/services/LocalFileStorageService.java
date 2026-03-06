package team.project.redboost.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class LocalFileStorageService {

    @Value("${file.upload-dir}")
    private String uploadDir;

    public String uploadFile(MultipartFile file) {
        try {
            // Ensure the upload directory exists
            File directory = new File(uploadDir);
            if (!directory.exists()) {
                directory.mkdirs();
            }

            // Generate a unique file name to avoid conflicts
            String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            Path filePath = Paths.get(uploadDir, fileName);

            // Save the file to the local directory using Files.copy
            Files.copy(file.getInputStream(), filePath);

            // Return just the filename instead of the full path
            return fileName;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file: " + file.getOriginalFilename(), e);
        }
    }

    public void deleteFile(String fileName) throws IOException {
        Path filePath = Paths.get(uploadDir, fileName);
        Files.deleteIfExists(filePath);
    }

    public String getUploadDir() {
        return uploadDir;
    }

//    // New method to upload file and return both filename and MIME type
//    public FileUploadResult uploadFileWithMimeType(MultipartFile file) {
//        try {
//            File directory = new File(uploadDir);
//            if (!directory.exists()) {
//                directory.mkdirs();
//            }
//            String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
//            Path filePath = Paths.get(uploadDir, fileName);
//            Files.copy(file.getInputStream(), filePath);
//            String mimeType = file.getContentType() != null ? file.getContentType() : Files.probeContentType(filePath);
//            return new FileUploadResult(fileName, mimeType != null ? mimeType : "application/octet-stream");
//        } catch (IOException e) {
//            throw new RuntimeException("Failed to store file: " + file.getOriginalFilename(), e);
//        }
//    }
// Sanitize filename to remove problematic characters
private String sanitizeFileName(String originalFileName) {
    if (originalFileName == null) {
        return UUID.randomUUID().toString();
    }
    // Replace problematic characters with underscore and normalize
    return originalFileName
            .replaceAll("[^a-zA-Z0-9._-]", "_") // Replace non-alphanumeric (except ._-)
            .replaceAll("_+", "_") // Replace multiple underscores with single
            .replaceAll("^_|_$", ""); // Remove leading/trailing underscores
}

    public FileUploadResult uploadFileWithMimeType(MultipartFile file) {
        try {
            File directory = new File(uploadDir);
            if (!directory.exists()) {
                directory.mkdirs();
            }
            // Sanitize the original filename
            String sanitizedFileName = sanitizeFileName(file.getOriginalFilename());
            String fileName = UUID.randomUUID().toString() + "_" + sanitizedFileName;
            Path filePath = Paths.get(uploadDir, fileName);
            Files.copy(file.getInputStream(), filePath);
            String mimeType = file.getContentType() != null ? file.getContentType() : Files.probeContentType(filePath);
            return new FileUploadResult(fileName, mimeType != null ? mimeType : "application/octet-stream");
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file: " + file.getOriginalFilename(), e);
        }
    }
    // Helper class to return filename and MIME type
    public static class FileUploadResult {
        private final String fileName;
        private final String mimeType;

        public FileUploadResult(String fileName, String mimeType) {
            this.fileName = fileName;
            this.mimeType = mimeType;
        }

        public String getFileName() {
            return fileName;
        }

        public String getMimeType() {
            return mimeType;
        }
    }
}