package team.project.redboost.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import team.project.redboost.dto.MessageDTO;
import team.project.redboost.services.MessageService;

@Controller
@RequiredArgsConstructor
public class ChatController {

    private final MessageService messageService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat.send")
    public void sendMessage(@Payload ChatMessagePayload payload) {
        // Save to DB
        MessageDTO saved = messageService.save(
                Long.parseLong(payload.expediteurId()),
                Long.parseLong(payload.destinataireId()),
                payload.contenu());

        // Broadcast to recipient specific queue only
        messagingTemplate.convertAndSendToUser(
                payload.destinataireId(),
                "/queue/messages",
                saved);
    }

    public record ChatMessagePayload(String expediteurId, String destinataireId, String contenu) {
    }
}
