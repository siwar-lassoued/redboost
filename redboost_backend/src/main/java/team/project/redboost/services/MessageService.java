package team.project.redboost.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import team.project.redboost.dto.MessageDTO;
import team.project.redboost.entities.Message;
import team.project.redboost.entities.User;
import team.project.redboost.repositories.MessageRepository;
import team.project.redboost.repositories.UserRepository;

import java.time.Duration;
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
    private final RedisTemplate<String, Object> redisTemplate;

    // ── Redis key helpers ────────────────────────────────────────────────────
    private static final String ONLINE_KEY   = "online:";       // online:{userId}  TTL 5min
    private static final String UNREAD_KEY   = "unread:";       // unread:{userId}  counter
    private static final Duration ONLINE_TTL = Duration.ofMinutes(5);

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

        // Increment unread counter in Redis for the recipient
        try {
            redisTemplate.opsForValue().increment(UNREAD_KEY + destinataireId);
        } catch (Exception e) {
            log.warn("[MessageService] Redis unread increment failed for destinataireId={}: {}", destinataireId, e.getMessage());
        }

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

        // Increment unread counter for recipient
        try {
            redisTemplate.opsForValue().increment(UNREAD_KEY + recipientId);
        } catch (Exception e) {
            log.warn("[MessageService] Redis unread increment failed: {}", e.getMessage());
        }

        return toDTO(saved);
    }

    // ── Mark Read ───────────────────────────────────────────────────────────
    @Transactional
    public void markRead(Long userId, Long otherUserId) {
        messageRepository.markAsRead(userId, otherUserId);

        // Reset Redis unread counter for the reader
        try {
            redisTemplate.delete(UNREAD_KEY + userId);
        } catch (Exception e) {
            log.warn("[MessageService] Redis unread reset failed for userId={}: {}", userId, e.getMessage());
        }

        // Broadcast "read receipt" to the original sender (otherUserId)
        Map<String, Object> receipt = new HashMap<>();
        receipt.put("readerId", userId);
        receipt.put("senderId", otherUserId);
        receipt.put("timestamp", LocalDateTime.now().toString());

        try {
            messagingTemplate.convertAndSendToUser(
                    otherUserId.toString(),
                    "/queue/read-receipts",
                    receipt
            );
        } catch (Exception e) {
            log.warn("[MessageService] WebSocket read-receipt broadcast failed: {}", e.getMessage());
        }
    }

    // ── Unread Count ────────────────────────────────────────────────────────
    public int getUnreadCount(Long userId) {
        try {
            Object val = redisTemplate.opsForValue().get(UNREAD_KEY + userId);
            if (val != null) {
                return Integer.parseInt(val.toString());
            }
        } catch (Exception e) {
            log.warn("[MessageService] Redis unread get failed for userId={}, falling back to DB: {}", userId, e.getMessage());
        }
        // Fallback to DB count
        return messageRepository.countUnreadForUser(userId);
    }

    public Map<Long, Integer> getUnreadPerSender(Long userId) {
        List<Object[]> results = messageRepository.countUnreadPerSender(userId);
        return results.stream().collect(Collectors.toMap(
            row -> (Long) row[0],
            row -> ((Number) row[1]).intValue()
        ));
    }

    // ── Get Conversations List ──────────────────────────────────────────────
    public List<MessageDTO> getConversations(Long userId) {
        return messageRepository.findLatestMessagePerConversation(userId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // ── Presence — Redis-backed ──────────────────────────────────────────────
    /**
     * Returns true if the user sent a heartbeat within the last 5 minutes.
     */
    public boolean isUserOnline(Long userId) {
        try {
            Boolean exists = redisTemplate.hasKey(ONLINE_KEY + userId);
            return Boolean.TRUE.equals(exists);
        } catch (Exception e) {
            log.warn("[MessageService] Redis presence check failed for userId={}: {}", userId, e.getMessage());
            return false; // Unknown → treat as offline
        }
    }

    /**
     * Called on every send action to mark the user as active.
     * TTL of 5 minutes — re-set on each message sent.
     */
    public void setUserOnline(Long userId) {
        try {
            redisTemplate.opsForValue().set(ONLINE_KEY + userId, "1", ONLINE_TTL);
        } catch (Exception e) {
            log.warn("[MessageService] Redis setUserOnline failed for userId={}: {}", userId, e.getMessage());
        }
    }

    /**
     * Explicitly mark user offline (e.g. on logout or disconnect).
     */
    public void setUserOffline(Long userId) {
        try {
            redisTemplate.delete(ONLINE_KEY + userId);
        } catch (Exception e) {
            log.warn("[MessageService] Redis setUserOffline failed for userId={}: {}", userId, e.getMessage());
        }
    }

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
