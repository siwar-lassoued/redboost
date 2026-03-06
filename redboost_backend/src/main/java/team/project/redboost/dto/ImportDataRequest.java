package team.project.redboost.dto;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class ImportDataRequest {
    private Long templateId;
    private MultipartFile file;
    private String fileType; // EXCEL or CSV
}
