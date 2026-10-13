package infosys.onlinecodeplate.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "assignment_attempts")
public class AssignmentAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id", nullable = false)
    private Assignment assignment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private LocalDateTime startedAt = LocalDateTime.now();

    private LocalDateTime expiresAt;

    private LocalDateTime submittedAt;

    @Column(nullable = false)
    private String status = "IN_PROGRESS"; // IN_PROGRESS, COMPLETED, TIME_EXPIRED, FLAGGED

    private Integer score = 0;

    private Integer completedQuestions = 0;

    private Integer totalQuestions = 0;

    private Integer integrityViolationCount = 0;

    private Boolean flaggedForReview = false;

    private String cameraStatus = "ACTIVE"; // ACTIVE, PERMISSION_DENIED, UNAVAILABLE

    private Boolean cameraPermissionGranted = true;

    private LocalDateTime cameraInitializedAt;

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();

    public AssignmentAttempt() {}

    public AssignmentAttempt(Assignment assignment, User user, LocalDateTime startedAt, LocalDateTime expiresAt, Integer totalQuestions) {
        this.assignment = assignment;
        this.user = user;
        this.startedAt = startedAt != null ? startedAt : LocalDateTime.now();
        this.expiresAt = expiresAt;
        this.totalQuestions = totalQuestions != null ? totalQuestions : 0;
        this.status = "IN_PROGRESS";
        this.score = 0;
        this.completedQuestions = 0;
        this.integrityViolationCount = 0;
        this.flaggedForReview = false;
    }

    @PreUpdate
    public void setLastUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Assignment getAssignment() { return assignment; }
    public void setAssignment(Assignment assignment) { this.assignment = assignment; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }

    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }

    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getScore() { return score != null ? score : 0; }
    public void setScore(Integer score) { this.score = score; }

    public Integer getCompletedQuestions() { return completedQuestions != null ? completedQuestions : 0; }
    public void setCompletedQuestions(Integer completedQuestions) { this.completedQuestions = completedQuestions; }

    public Integer getTotalQuestions() { return totalQuestions != null ? totalQuestions : 0; }
    public void setTotalQuestions(Integer totalQuestions) { this.totalQuestions = totalQuestions; }

    public Integer getIntegrityViolationCount() { return integrityViolationCount != null ? integrityViolationCount : 0; }
    public void setIntegrityViolationCount(Integer integrityViolationCount) { this.integrityViolationCount = integrityViolationCount; }

    public Boolean getFlaggedForReview() { return flaggedForReview != null ? flaggedForReview : false; }
    public void setFlaggedForReview(Boolean flaggedForReview) { this.flaggedForReview = flaggedForReview; }

    public String getCameraStatus() { return cameraStatus != null ? cameraStatus : "ACTIVE"; }
    public void setCameraStatus(String cameraStatus) { this.cameraStatus = cameraStatus; }

    public Boolean getCameraPermissionGranted() { return cameraPermissionGranted != null ? cameraPermissionGranted : true; }
    public void setCameraPermissionGranted(Boolean cameraPermissionGranted) { this.cameraPermissionGranted = cameraPermissionGranted; }

    public LocalDateTime getCameraInitializedAt() { return cameraInitializedAt; }
    public void setCameraInitializedAt(LocalDateTime cameraInitializedAt) { this.cameraInitializedAt = cameraInitializedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
