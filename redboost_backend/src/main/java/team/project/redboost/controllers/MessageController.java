package team.project.redboost.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import team.project.redboost.dto.MessageDTO;
import team.project.redboost.services.MessageService;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/messages")
@lombok.RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;
    private final org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

    @GetMapping("/history/{userId1}/{userId2}")
    public ResponseEntity<Map<String, Object>> getHistory(
            @PathVariable Long userId1,
            @PathVariable Long userId2) {
        Map<String, Object> res = new HashMap<>();
        res.put("data", messageService.getConversation(userId1, userId2));
        return ResponseEntity.ok(res);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> sendMessage(
            @RequestBody Map<String, Object> payload) {
        try {
            Object expediteurObj = payload.get("expediteurId");
            Object destinataireObj = payload.get("destinataireId");
            Object contenuObj = payload.get("contenu");

            // Validate required fields before hitting the database
            if (expediteurObj == null || String.valueOf(expediteurObj).isBlank()) {
                Map<String, Object> err = new HashMap<>();
                err.put("error", "expediteurId is required");
                return ResponseEntity.badRequest().body(err);
            }
            if (destinataireObj == null || String.valueOf(destinataireObj).isBlank()) {
                Map<String, Object> err = new HashMap<>();
                err.put("error", "destinataireId is required");
                return ResponseEntity.badRequest().body(err);
            }
            if (contenuObj == null || String.valueOf(contenuObj).isBlank()) {
                Map<String, Object> err = new HashMap<>();
                err.put("error", "contenu is required");
                return ResponseEntity.badRequest().body(err);
            }

            String expediteurIdStr = String.valueOf(expediteurObj);
            String destinataireIdStr = String.valueOf(destinataireObj);
            String contenu = String.valueOf(contenuObj);

            Long expediteurId   = Long.parseLong(expediteurIdStr.trim());
            Long destinataireId = Long.parseLong(destinataireIdStr.trim());

            MessageDTO saved = messageService.save(expediteurId, destinataireId, contenu.trim());
            
            // Broadcast to recipient via WebSocket (principal name = userId string)
            messagingTemplate.convertAndSendToUser(
                    destinataireId.toString(),
                    "/queue/messages",
                    saved);
                    
            Map<String, Object> res = new HashMap<>();
            res.put("data", saved);
            return ResponseEntity.ok(res);
        } catch (NumberFormatException e) {
            Map<String, Object> err = new HashMap<>();
            err.put("error", "Invalid numeric ID: " + e.getMessage());
            return ResponseEntity.badRequest().body(err);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> err = new HashMap<>();
            err.put("error", e.getMessage());
            err.put("type", e.getClass().getName());
            return ResponseEntity.status(500).body(err);
        }
    }

    @PutMapping("/read/{userId}/{otherUserId}")
    public ResponseEntity<Void> markRead(@PathVariable Long userId, @PathVariable Long otherUserId) {
        messageService.markRead(userId, otherUserId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/conversations")
    public ResponseEntity<List<MessageDTO>> getConversations(@RequestParam Long userId) {
        return ResponseEntity.ok(messageService.getConversations(userId));
    }

    @GetMapping("/unread")
    public ResponseEntity<Map<String, Integer>> getUnreadCount(@RequestParam Long userId) {
        return ResponseEntity.ok(Map.of("count", messageService.getUnreadCount(userId)));
    }

    @GetMapping("/presence/{userId}")
    public ResponseEntity<Map<String, Boolean>> getPresence(@PathVariable Long userId) {
        return ResponseEntity.ok(Map.of("online", messageService.isUserOnline(userId)));
    }

    @PostMapping("/presence/online")
    public ResponseEntity<Void> setOnline(@RequestParam Long userId) {
        messageService.setUserOnline(userId);
        return ResponseEntity.ok().build();
    }
}
