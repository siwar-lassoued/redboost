package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import team.project.redboost.entities.Message;
import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, String> {
    @Query("SELECT m FROM Message m WHERE " +
            "(m.expediteur.id = :userId1 AND m.destinataire.id = :userId2) OR " +
            "(m.expediteur.id = :userId2 AND m.destinataire.id = :userId1) " +
            "ORDER BY m.sentAt ASC")
    List<Message> findConversation(@org.springframework.data.repository.query.Param("userId1") Long userId1,
                                   @org.springframework.data.repository.query.Param("userId2") Long userId2);

    List<Message> findByDestinataireIdAndLuFalse(Long destinataireId);

    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE Message m SET m.lu = true " +
            "WHERE m.destinataire.id = :userId AND m.expediteur.id = :senderId AND m.lu = false")
    void markAsRead(@org.springframework.data.repository.query.Param("userId") Long userId,
                    @org.springframework.data.repository.query.Param("senderId") Long senderId);

    @Query("SELECT COUNT(m) FROM Message m WHERE m.destinataire.id = :userId AND m.lu = false")
    int countUnreadForUser(@org.springframework.data.repository.query.Param("userId") Long userId);

    @Query(value = "SELECT m.* FROM messages m " +
            "INNER JOIN ( " +
            "  SELECT " +
            "    LEAST(expediteur_id, destinataire_id) AS u1, " +
            "    GREATEST(expediteur_id, destinataire_id) AS u2, " +
            "    MAX(sent_at) AS last_date " +
            "  FROM messages " +
            "  WHERE expediteur_id = :userId OR destinataire_id = :userId " +
            "  GROUP BY u1, u2 " +
            ") latest ON " +
            "  LEAST(m.expediteur_id, m.destinataire_id) = latest.u1 " +
            "  AND GREATEST(m.expediteur_id, m.destinataire_id) = latest.u2 " +
            "  AND m.sent_at = latest.last_date " +
            "ORDER BY m.sent_at DESC", nativeQuery = true)
    List<Message> findLatestMessagePerConversation(@org.springframework.data.repository.query.Param("userId") Long userId);
}
