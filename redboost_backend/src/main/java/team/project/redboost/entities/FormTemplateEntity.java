package team.project.redboost.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "form_templates")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FormTemplateEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "profile_type", nullable = false)
    private String profileType; // COACH or ENTREPRENEUR

    private String program;

    @Column(columnDefinition = "TEXT")
    private String sectors;

    @Column(name = "questions_json", columnDefinition = "TEXT")
    private String questionsJson;

    private String deadline;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
