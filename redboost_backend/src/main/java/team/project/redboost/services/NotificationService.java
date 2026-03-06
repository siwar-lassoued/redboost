package team.project.redboost.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import team.project.redboost.dto.NotificationDTO;
import team.project.redboost.entities.Notification;
import team.project.redboost.entities.User;
import team.project.redboost.repositories.NotificationRepository;
import team.project.redboost.repositories.UserRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public Notification createAndSendNotification(Long recipientId, String message, String type, Long entityId) {
        User recipient = userRepository.findById(recipientId)
                .orElseThrow(() -> new RuntimeException("Recipient user not found with ID: " + recipientId));

        Notification notification = Notification.builder()
                .recipient(recipient)
                .message(message)
                .type(type)
                .entityId(entityId)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();

        Notification savedNotification = notificationRepository.save(notification);
        log.info("Notification saved for user {}: {}", recipientId, message);

        // Convert to DTO before sending over WebSocket
        NotificationDTO notificationDTO = convertToDTO(savedNotification);

        try {
            messagingTemplate.convertAndSendToUser(
                    recipient.getEmail(),
                    "/queue/notifications",
                    notificationDTO
            );
            log.info("Real-time notification sent to user {}: {}", recipient.getEmail(), message);
        } catch (Exception e) {
            log.error("Failed to send real-time notification to user {}: {}", recipient.getEmail(), e.getMessage());
        }

        return savedNotification;
    }

    public List<NotificationDTO> getNotificationsForUser(Long userId) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<NotificationDTO> getUnreadNotificationsForUser(Long userId) {
        return notificationRepository.findByRecipientIdAndIsReadFalseOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public NotificationDTO markNotificationAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findByIdAndRecipientId(notificationId, userId)
                .orElseThrow(() -> new RuntimeException("Notification not found or not owned by user"));
        notification.setRead(true);
        Notification saved = notificationRepository.save(notification);
        return convertToDTO(saved);
    }

    @Transactional
    public void markAllNotificationsAsRead(Long userId) {
        List<Notification> unreadNotifications = notificationRepository.findByRecipientIdAndIsReadFalseOrderByCreatedAtDesc(userId);
        unreadNotifications.forEach(notification -> notification.setRead(true));
        notificationRepository.saveAll(unreadNotifications);
    }

    @Transactional
    public void deleteNotification(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findByIdAndRecipientId(notificationId, userId)
                .orElseThrow(() -> new RuntimeException("Notification not found or not owned by user"));
        notificationRepository.delete(notification);
    }

    @Transactional
    public void deleteAllNotificationsForUser(Long userId) {
        notificationRepository.deleteByRecipientId(userId);
    }

    public long getUnreadNotificationCount(Long userId) {
        return notificationRepository.countByRecipientIdAndIsReadFalse(userId);
    }

    private NotificationDTO convertToDTO(Notification notification) {
        return NotificationDTO.builder()
                .id(notification.getId())
                .recipientId(notification.getRecipient().getId())
                .message(notification.getMessage())
                .isRead(notification.isRead())
                .createdAt(notification.getCreatedAt())
                .type(notification.getType())
                .entityId(notification.getEntityId())
                .build();
    }
}
