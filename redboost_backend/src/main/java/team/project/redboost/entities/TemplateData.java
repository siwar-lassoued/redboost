// TemplateData.java
package team.project.redboost.entities;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "template_data")
@Data
public class TemplateData {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "template_id", nullable = false)
    private Long templateId;
    
    @Column(name = "row_id", nullable = false)
    private String rowId; // UUID
    
    @Column(name = "column_id", nullable = false)
    private Long columnId;
    
    @Column(columnDefinition = "TEXT")
    private String value;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}