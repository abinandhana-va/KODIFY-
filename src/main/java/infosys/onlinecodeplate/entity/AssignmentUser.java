package infosys.onlinecodeplate.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "assignment_users", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"assignment_id", "user_id"})
})
public class AssignmentUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id", nullable = false)
    private Assignment assignment;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String status = "INVITED"; // INVITED, CODE_VERIFIED, IDENTITY_VERIFIED, CONSENT_PENDING, READY, IN_PROGRESS, COMPLETED, EXPIRED, FLAGGED_FOR_REVIEW

    @Column(name = "access_code")
    private String accessCode;

    private LocalDateTime codeIssuedAt;

    private LocalDateTime codeExpiresAt;

    private String gender; // Female, Male, Prefer not to say

    private LocalDateTime assignedAt = LocalDateTime.now();

    private LocalDateTime startedAt;

    private LocalDateTime completedAt;

    public AssignmentUser() {}

    public AssignmentUser(Assignment assignment, User user) {
        this.assignment = assignment;
        this.user = user;
        this.status = "INVITED";
        this.assignedAt = LocalDateTime.now();
    }

    public AssignmentUser(Assignment assignment, User user, String accessCode, LocalDateTime codeIssuedAt, LocalDateTime codeExpiresAt) {
        this.assignment = assignment;
        this.user = user;
        this.status = "INVITED";
        this.accessCode = accessCode;
        this.codeIssuedAt = codeIssuedAt != null ? codeIssuedAt : LocalDateTime.now();
        this.codeExpiresAt = codeExpiresAt;
        this.assignedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Assignment getAssignment() { return assignment; }
    public void setAssignment(Assignment assignment) { this.assignment = assignment; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getAccessCode() { return accessCode; }
    public void setAccessCode(String accessCode) { this.accessCode = accessCode; }

    public LocalDateTime getCodeIssuedAt() { return codeIssuedAt; }
    public void setCodeIssuedAt(LocalDateTime codeIssuedAt) { this.codeIssuedAt = codeIssuedAt; }

    public LocalDateTime getCodeExpiresAt() { return codeExpiresAt; }
    public void setCodeExpiresAt(LocalDateTime codeExpiresAt) { this.codeExpiresAt = codeExpiresAt; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public LocalDateTime getAssignedAt() { return assignedAt; }
    public void setAssignedAt(LocalDateTime assignedAt) { this.assignedAt = assignedAt; }

    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
}
