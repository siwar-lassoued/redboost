package team.project.redboost.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import team.project.redboost.dto.NotificationDTO;
import team.project.redboost.entities.User;
import team.project.redboost.services.NotificationService;
import team.project.redboost.services.UserService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final UserService userService;

    private Long getAuthenticatedUserId(UserDetails userDetails) {
        User user = userService.findByEmail(userDetails.getUsername());
        if (user == null) {
            throw new RuntimeException("Authenticated user not found.");
        }
        return user.getId();
    }

    @GetMapping("/debug")
    public ResponseEntity<List<team.project.redboost.entities.Notification>> debugNotifications() {
        // Temporary endpoint to dump notifications to check recipient IDs
        List<team.project.redboost.entities.Notification> all = ((team.project.redboost.repositories.NotificationRepository) notificationService.getNotificationRepository()).findAll();
        all.sort((a, b) -> b.getId().compareTo(a.getId()));
        return ResponseEntity.ok(all.size() > 20 ? all.subList(0, 20) : all);
    }

    @GetMapping
    public ResponseEntity<List<NotificationDTO>> getAllNotifications(@AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getAuthenticatedUserId(userDetails);
        List<NotificationDTO> notifications = notificationService.getNotificationsForUser(userId);
        System.out.println("DEBUG - User " + userDetails.getUsername() + " (ID: " + userId + ") requested notifications. Returning " + notifications.size() + " items.");
        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/unread")
    public ResponseEntity<List<NotificationDTO>> getUnreadNotifications(@AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getAuthenticatedUserId(userDetails);
        List<NotificationDTO> notifications = notificationService.getUnreadNotificationsForUser(userId);
        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/count/unread")
    public ResponseEntity<Map<String, Long>> getUnreadNotificationCount(@AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getAuthenticatedUserId(userDetails);
        long count = notificationService.getUnreadNotificationCount(userId);
        return ResponseEntity.ok(Map.of("count", count));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<NotificationDTO> markAsRead(@PathVariable Long id, @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getAuthenticatedUserId(userDetails);
        NotificationDTO updatedNotification = notificationService.markNotificationAsRead(id, userId);
        return ResponseEntity.ok(updatedNotification);
    }

    @PatchMapping("/mark-all-read")
    public ResponseEntity<Void> markAllAsRead(@AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getAuthenticatedUserId(userDetails);
        notificationService.markAllNotificationsAsRead(userId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/delete-all")
    public ResponseEntity<Void> deleteAllNotifications(@AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getAuthenticatedUserId(userDetails);
        notificationService.deleteAllNotificationsForUser(userId);
        return ResponseEntity.noContent().build();
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(@PathVariable Long id, @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getAuthenticatedUserId(userDetails);
        notificationService.deleteNotification(id, userId);
        return ResponseEntity.noContent().build();
    }


}
