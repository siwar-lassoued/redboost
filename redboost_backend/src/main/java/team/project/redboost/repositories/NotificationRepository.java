package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import team.project.redboost.entities.Notification;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // Find all notifications for a specific user, ordered by creation date descending
    List<Notification> findByRecipientIdOrderByCreatedAtDesc(Long recipientId);

    // Find all unread notifications for a specific user, ordered by creation date descending
    List<Notification> findByRecipientIdAndIsReadFalseOrderByCreatedAtDesc(Long recipientId);

    // Find a specific notification for a user (to ensure ownership before update/delete)
    Optional<Notification> findByIdAndRecipientId(Long id, Long recipientId);

    // Count unread notifications for a user
    long countByRecipientIdAndIsReadFalse(Long recipientId);

    // Delete all notifications for a specific user
    void deleteByRecipientId(Long recipientId);
}