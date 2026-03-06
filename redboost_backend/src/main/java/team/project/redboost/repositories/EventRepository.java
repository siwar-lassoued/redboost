package team.project.redboost.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import team.project.redboost.entities.Event;
import team.project.redboost.entities.EventStatus;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {
    List<Event> findByStartDateTimeBetween(LocalDateTime start, LocalDateTime end);
    List<Event> findByParticipantEmailsContaining(String email);
    List<Event> findByStatus(EventStatus status);
}