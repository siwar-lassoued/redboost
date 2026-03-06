package team.project.redboost.entities;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "template_columns")
@Data
public class TemplateColumn {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id", nullable = false)
    private DatabaseTemplate template;
    
    @Column(name = "column_name", nullable = false)
    private String columnName;
    
    @Column(name = "column_type", nullable = false)
    @Enumerated(EnumType.STRING)
    private ColumnType columnType;
    
    @Column(name = "is_required")
    private Boolean isRequired = false;
    
    @Column(name = "is_unique")
    private Boolean isUnique = false;
    
    @Column(name = "display_order")
    private Integer displayOrder;
    
    @Column(columnDefinition = "TEXT")
    private String options; // JSON for SELECT type
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}