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
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

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
            @RequestBody Map<String, String> payload) {
        Long expediteurId = Long.parseLong(payload.get("expediteurId"));
        Long destinataireId = Long.parseLong(payload.get("destinataireId"));
        String contenu = payload.get("contenu");
        MessageDTO saved = messageService.save(expediteurId, destinataireId, contenu);
        Map<String, Object> res = new HashMap<>();
        res.put("data", saved);
        return ResponseEntity.ok(res);
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
