package infosys.onlinecodeplate.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "badges")
public class Badge {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "LONGTEXT")
    private String imageUrl;

    @Column(nullable = false)
    private String shape; // CIRCLE, HEXAGON, DIAMOND

    @Column(nullable = false)
    private String metric; // PROBLEMS_SOLVED

    @Column(nullable = false)
    private Integer target;

    @Column(nullable = false)
    private Boolean enabled = true;

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();

    public Badge() {}

    public Badge(String name, String description, String imageUrl, String shape, String metric, Integer target, Boolean enabled) {
        this.name = name;
        this.description = description;
        this.imageUrl = imageUrl;
        this.shape = shape != null ? shape.toUpperCase() : "CIRCLE";
        this.metric = metric != null ? metric.toUpperCase() : "PROBLEMS_SOLVED";
        this.target = target != null ? target : 1;
        this.enabled = enabled != null ? enabled : true;
    }

    @PreUpdate
    public void setLastUpdate() { this.updatedAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public String getShape() { return shape; }
    public void setShape(String shape) { this.shape = shape != null ? shape.toUpperCase() : "CIRCLE"; }

    public String getMetric() { return metric; }
    public void setMetric(String metric) { this.metric = metric != null ? metric.toUpperCase() : "PROBLEMS_SOLVED"; }

    public Integer getTarget() { return target; }
    public void setTarget(Integer target) { this.target = target; }

    public Boolean getEnabled() { return enabled; }
    public void setEnabled(Boolean enabled) { this.enabled = enabled; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
