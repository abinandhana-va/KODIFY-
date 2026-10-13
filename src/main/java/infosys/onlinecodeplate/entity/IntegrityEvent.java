package infosys.onlinecodeplate.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "integrity_events")
public class IntegrityEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attempt_id", nullable = false)
    private AssignmentAttempt attempt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id", nullable = false)
    private Assignment assignment;

    @Column(nullable = false)
    private String eventType; // FULLSCREEN_EXIT, TAB_SWITCH, WINDOW_BLUR, PASTE_ATTEMPT, COPY_ATTEMPT, CUT_ATTEMPT, CONTEXT_MENU_ATTEMPT

    @Column(nullable = false)
    private LocalDateTime timestamp = LocalDateTime.now();

    @Column(columnDefinition = "TEXT")
    private String metadata;

    @Column(nullable = false)
    private String severity = "WARNING"; // INFO, WARNING, CRITICAL

    public IntegrityEvent() {}

    public IntegrityEvent(AssignmentAttempt attempt, User user, Assignment assignment, String eventType, String metadata, String severity) {
        this.attempt = attempt;
        this.user = user;
        this.assignment = assignment;
        this.eventType = eventType;
        this.timestamp = LocalDateTime.now();
        this.metadata = metadata;
        this.severity = severity != null ? severity : "WARNING";
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public AssignmentAttempt getAttempt() { return attempt; }
    public void setAttempt(AssignmentAttempt attempt) { this.attempt = attempt; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Assignment getAssignment() { return assignment; }
    public void setAssignment(Assignment assignment) { this.assignment = assignment; }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    public String getMetadata() { return metadata; }
    public void setMetadata(String metadata) { this.metadata = metadata; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
}
