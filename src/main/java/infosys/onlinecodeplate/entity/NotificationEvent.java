package infosys.onlinecodeplate.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notification_events", indexes = {
    @Index(name = "idx_notif_user_type_ref", columnList = "user_id, notification_type, reference_id"),
    @Index(name = "idx_notif_email_type_ref", columnList = "recipient_email, notification_type, reference_id")
})
public class NotificationEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "notification_type", nullable = false)
    private String type; // USER_REGISTERED, MILESTONE_ACHIEVED, HOST_VERIFIED, CONTEST_INVITED, ASSIGNMENT_INVITED

    @Column(name = "reference_id")
    private String referenceId; // certificate ID, contest ID, assignment ID, etc.

    @Column(name = "recipient_email", nullable = false)
    private String recipientEmail;

    private String subject;

    @Column(nullable = false)
    private String status; // SENT, SIMULATED, FAILED

    @Column(name = "sent_at", nullable = false)
    private LocalDateTime sentAt = LocalDateTime.now();

    public NotificationEvent() {}

    public NotificationEvent(Long userId, String type, String referenceId, String recipientEmail, String subject, String status) {
        this.userId = userId;
        this.type = type;
        this.referenceId = referenceId;
        this.recipientEmail = recipientEmail;
        this.subject = subject;
        this.status = status;
        this.sentAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getReferenceId() { return referenceId; }
    public void setReferenceId(String referenceId) { this.referenceId = referenceId; }

    public String getRecipientEmail() { return recipientEmail; }
    public void setRecipientEmail(String recipientEmail) { this.recipientEmail = recipientEmail; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getSentAt() { return sentAt; }
    public void setSentAt(LocalDateTime sentAt) { this.sentAt = sentAt; }
}
