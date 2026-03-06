package team.project.redboost.services;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import team.project.redboost.entities.Role;
import team.project.redboost.entities.User;
import team.project.redboost.repositories.UserRepository;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ExcelImportService {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    public Map<String, Object> importEntrepreneurs(MultipartFile file) throws IOException {
        List<User> importedUsers = new ArrayList<>();
        List<String> errors = new ArrayList<>();
        int successCount = 0;

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);

            // Skip header row (index 0)
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);

                // Skip null rows or completely empty rows
                if (row == null || isRowEmpty(row)) {
                    continue;
                }

                try {
                    // Extract data from cells
                    // 0: Nom, 1: Prenom, 2: Email, 3: Telephone, 4: Entreprise, 5: Secteur, 6: Region

                    String lastName = getCellValue(row.getCell(0));
                    String firstName = getCellValue(row.getCell(1));
                    String email = getCellValue(row.getCell(2));
                    String phoneNumber = getCellValue(row.getCell(3));
                    String entreprise = getCellValue(row.getCell(4));
                    String secteur = getCellValue(row.getCell(5));
                    String region = getCellValue(row.getCell(6));

                    // Basic validation - email is required
                    if (email == null || email.trim().isEmpty()) {
                        errors.add("Ligne " + (i + 1) + ": L'email est manquant");
                        continue;
                    }

                    // Validate email format
                    if (!email.matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
                        errors.add("Ligne " + (i + 1) + ": Format d'email invalide - " + email);
                        continue;
                    }

                    // Check if user exists
                    if (userRepository.findByEmail(email) != null) {
                        errors.add("Ligne " + (i + 1) + ": L'utilisateur avec l'email " + email + " existe déjà");
                        continue;
                    }

                    // Create user map for UserService
                    Map<String, String> userData = new HashMap<>();
                    userData.put("email", email.trim());
                    userData.put("firstName", firstName != null && !firstName.trim().isEmpty() ? firstName.trim() : "");
                    userData.put("lastName", lastName != null && !lastName.trim().isEmpty() ? lastName.trim() : "");
                    userData.put("phoneNumber", phoneNumber != null && !phoneNumber.trim().isEmpty() ? phoneNumber.trim() : "");
                    userData.put("role", "ENTREPRENEUR");

                    // Add optional fields only if they have values
                    if (entreprise != null && !entreprise.trim().isEmpty()) {
                        userData.put("entreprise", entreprise.trim());
                    }
                    if (secteur != null && !secteur.trim().isEmpty()) {
                        userData.put("secteur", secteur.trim());
                    }
                    if (region != null && !region.trim().isEmpty()) {
                        userData.put("region", region.trim());
                    }

                    // Add user
                    User newUser = userService.addUser(userData);

                    // Generate reset token and send email
                    String resetToken = userService.generatePasswordResetToken(newUser);
                    sendWelcomeEmail(newUser, resetToken);

                    importedUsers.add(newUser);
                    successCount++;

                } catch (Exception e) {
                    errors.add("Ligne " + (i + 1) + ": " + e.getMessage());
                }
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("successCount", successCount);
        result.put("errors", errors);
        result.put("importedUsers", importedUsers);

        return result;
    }

    /**
     * Check if a row is completely empty
     */
    private boolean isRowEmpty(Row row) {
        if (row == null) {
            return true;
        }

        // Check if all cells in the row are empty
        for (int cellNum = row.getFirstCellNum(); cellNum < row.getLastCellNum(); cellNum++) {
            Cell cell = row.getCell(cellNum);
            if (cell != null && cell.getCellType() != CellType.BLANK) {
                String cellValue = getCellValue(cell);
                if (cellValue != null && !cellValue.trim().isEmpty()) {
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * Get cell value as string, handling different cell types
     */
    private String getCellValue(Cell cell) {
        if (cell == null) {
            return null;
        }

        switch (cell.getCellType()) {
            case STRING:
                String value = cell.getStringCellValue();
                return value != null ? value.trim() : null;

            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getLocalDateTimeCellValue().toString();
                }
                // Handle phone numbers and other numeric values
                double numValue = cell.getNumericCellValue();
                // If it's a whole number, format without decimals
                if (numValue == (long) numValue) {
                    return String.format("%d", (long) numValue);
                }
                return String.valueOf(numValue);

            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());

            case FORMULA:
                // Evaluate formula and get the result
                try {
                    return cell.getStringCellValue().trim();
                } catch (Exception e) {
                    return String.valueOf(cell.getNumericCellValue());
                }

            case BLANK:
                return null;

            default:
                return null;
        }
    }

    /**
     * Send welcome email to new user
     */
    private void sendWelcomeEmail(User user, String resetToken) {
        String passwordCreationLink = "https://redboost.tn/reset-password?token=" + resetToken;
        String subject = "Welcome to Redboost! Set Your Password";
        String body = String.format(
                "Hello %s %s,\n\n" +
                        "Welcome to Redboost! You have been added to our platform as an Entrepreneur via bulk import.\n\n" +
                        "Please set your password by clicking the link below:\n" +
                        "%s\n\n" +
                        "This link will expire in 24 hours. If you have any questions, feel free to reach out.\n\n" +
                        "Thank you for joining us!\n\n" +
                        "Best regards,\n" +
                        "The Redboost Team",
                user.getFirstName(), user.getLastName(), passwordCreationLink
        );

        try {
            emailService.sendEmail(user.getEmail(), subject, body);
        } catch (Exception e) {
            // Log error but don't fail the import
            System.err.println("Failed to send email to " + user.getEmail() + ": " + e.getMessage());
        }
    }
}