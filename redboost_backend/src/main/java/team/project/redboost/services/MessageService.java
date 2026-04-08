package team.project.redboost.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import team.project.redboost.entities.Message;
import team.project.redboost.entities.User;
import team.project.redboost.dto.MessageDTO;
import team.project.redboost.repositories.MessageRepository;
import team.project.redboost.repositories.UserRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    // ── Get History ─────────────────────────────────────────────────────────
    public List<MessageDTO> getConversation(Long userId1, Long userId2) {
        log.info("Fetching conversation from DB for {} and {}", userId1, userId2);
        return messageRepository.findConversation(userId1, userId2).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // ── Send Message ────────────────────────────────────────────────────────
    @Transactional
    public MessageDTO save(Long expediteurId, Long destinataireId, String contenu) {
        User expediteur = userRepository.findById(expediteurId)
                .orElseThrow(() -> new RuntimeException("User not found: " + expediteurId));
        User destinataire = userRepository.findById(destinataireId)
                .orElseThrow(() -> new RuntimeException("User not found: " + destinataireId));

        Message msg = Message.builder()
                .expediteur(expediteur)
                .destinataire(destinataire)
                .contenu(contenu)
                .type(Message.MessageType.TEXT)
                .lu(false)
                .build();
        Message saved = messageRepository.save(msg);

        return toDTO(saved);
    }

    // ── Send File Message ───────────────────────────────────────────────────
    @Transactional
    public MessageDTO sendFileMessage(Long senderId, Long recipientId, String fichierUrl,
            String fichierNom, String fichierType, Long fichierTaille) {
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("Sender not found"));
        User recipient = userRepository.findById(recipientId)
                .orElseThrow(() -> new RuntimeException("Recipient not found"));

        Message msg = Message.builder()
                .expediteur(sender)
                .destinataire(recipient)
                .type(Message.MessageType.FILE)
                .contenu(fichierNom)
                .fichierUrl(fichierUrl)
                .fichierNom(fichierNom)
                .fichierType(fichierType)
                .fichierTaille(fichierTaille)
                .lu(false)
                .build();

        Message saved = messageRepository.save(msg);
        return toDTO(saved);
    }

    // ── Mark Read ───────────────────────────────────────────────────────────
    @Transactional
    public void markRead(Long userId, Long otherUserId) {
        messageRepository.markAsRead(userId, otherUserId);

        // Broadcast "read receipt" to the original sender (otherUserId)
        Map<String, Object> receipt = new HashMap<>();
        receipt.put("readerId", userId);
        receipt.put("senderId", otherUserId);
        receipt.put("timestamp", LocalDateTime.now().toString());

        messagingTemplate.convertAndSendToUser(
                otherUserId.toString(),
                "/queue/read-receipts",
                receipt
        );
    }

    // ── Unread Count ────────────────────────────────────────────────────────
    public int getUnreadCount(Long userId) {
        return messageRepository.countUnreadForUser(userId);
    }

    // ── Get Conversations List ──────────────────────────────────────────────
    public List<MessageDTO> getConversations(Long userId) {
        return messageRepository.findLatestMessagePerConversation(userId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // ── Presence Simplified ──────────────────────────────────────────────────
    // Without Redis, returning true to bypass complexity for now, or could store in memory.
    public boolean isUserOnline(Long userId) {
        return true;
    }
    public void setUserOnline(Long userId) {}
    public void setUserOffline(Long userId) {}

    // ── Mapper ──────────────────────────────────────────────────────────────
    private MessageDTO toDTO(Message m) {
        return new MessageDTO(
                m.getId(),
                m.getExpediteur().getId().toString(),
                m.getExpediteur().getLastName(),
                m.getExpediteur().getFirstName(),
                m.getExpediteur().getProfilePictureUrl(),
                m.getDestinataire().getId().toString(),
                m.getContenu(),
                m.getType() != null ? m.getType().name() : "TEXT",
                m.isLu(),
                m.getSentAt(),
                m.getFichierUrl(),
                m.getFichierNom(),
                m.getFichierType(),
                m.getFichierTaille());
    }
}
