package team.project.redboost.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class NotificationDTO {
    private Long id;
    private Long recipientId;
    private String message;
    private boolean isRead;
    private LocalDateTime createdAt;
    private String type;
    private Long entityId;
}
