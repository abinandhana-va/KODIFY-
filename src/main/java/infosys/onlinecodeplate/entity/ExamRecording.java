package infosys.onlinecodeplate.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "exam_recordings")
public class ExamRecording {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attempt_id", nullable = false)
    private AssignmentAttempt attempt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "participant_id", nullable = false)
    private User participant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id", nullable = false)
    private Assignment assignment;

    @Column(nullable = false)
    private String type; // VIDEO, AUDIO, SCREEN

    @Column(nullable = false)
    private String storageReference;

    private Long fileSizeBytes;

    private String contentType;

    private LocalDateTime startedAt = LocalDateTime.now();

    private LocalDateTime endedAt;

    @Column(nullable = false)
    private String status = "RECORDED"; // RECORDING, RECORDED, FAILED

    private LocalDateTime createdAt = LocalDateTime.now();

    public ExamRecording() {}

    public ExamRecording(AssignmentAttempt attempt, User participant, Assignment assignment,
                         String type, String storageReference, Long fileSizeBytes, String contentType) {
        this.attempt = attempt;
        this.participant = participant;
        this.assignment = assignment;
        this.type = type != null ? type.toUpperCase() : "VIDEO";
        this.storageReference = storageReference;
        this.fileSizeBytes = fileSizeBytes;
        this.contentType = contentType;
        this.startedAt = LocalDateTime.now();
        this.status = "RECORDED";
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public AssignmentAttempt getAttempt() { return attempt; }
    public void setAttempt(AssignmentAttempt attempt) { this.attempt = attempt; }

    public User getParticipant() { return participant; }
    public void setParticipant(User participant) { this.participant = participant; }

    public Assignment getAssignment() { return assignment; }
    public void setAssignment(Assignment assignment) { this.assignment = assignment; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getStorageReference() { return storageReference; }
    public void setStorageReference(String storageReference) { this.storageReference = storageReference; }

    public Long getFileSizeBytes() { return fileSizeBytes; }
    public void setFileSizeBytes(Long fileSizeBytes) { this.fileSizeBytes = fileSizeBytes; }

    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }

    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }

    public LocalDateTime getEndedAt() { return endedAt; }
    public void setEndedAt(LocalDateTime endedAt) { this.endedAt = endedAt; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
