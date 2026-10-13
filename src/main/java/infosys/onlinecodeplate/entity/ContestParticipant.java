package infosys.onlinecodeplate.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "contest_participants", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"contest_id", "user_id"})
})
public class ContestParticipant {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contest_id", nullable = false)
    private Contest contest;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private LocalDateTime registeredAt = LocalDateTime.now();
    private LocalDateTime participatedAt;
    private LocalDateTime enteredArenaAt;
    private LocalDateTime startedAt;
    private LocalDateTime submittedAt;

    private Integer score = 0;
    private Integer correctAnswers = 0;
    private Integer attemptedAnswers = 0;
    private Long timeTakenSeconds = 0L;

    @Column(name = "`rank`")
    private Integer rank;

    @Column(name = "reminder_sent")
    private Boolean reminderSent = false;

    @Column(name = "agreed_to_rules")
    private Boolean agreedToRules = false;

    @Column(name = "camera_permission_granted")
    private Boolean cameraPermissionGranted = false;

    @Column(name = "mic_permission_granted")
    private Boolean micPermissionGranted = false;

    @Column(name = "fullscreen_violations")
    private Integer fullscreenViolations = 0;

    private LocalDateTime terminatedAt;

    @Column(columnDefinition = "TEXT")
    private String terminationReason;

    @Column(nullable = false)
    private String status = "REGISTERED"; // REGISTERED, WAITING, IN_ARENA, PARTICIPATING, COMPLETED, DISQUALIFIED

    public ContestParticipant() {}

    public ContestParticipant(Contest contest, User user) {
        this.contest = contest;
        this.user = user;
        this.registeredAt = LocalDateTime.now();
        this.status = "REGISTERED";
        this.reminderSent = false;
        this.agreedToRules = false;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Contest getContest() { return contest; }
    public void setContest(Contest contest) { this.contest = contest; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public LocalDateTime getRegisteredAt() { return registeredAt; }
    public void setRegisteredAt(LocalDateTime registeredAt) { this.registeredAt = registeredAt; }

    public LocalDateTime getParticipatedAt() { return participatedAt; }
    public void setParticipatedAt(LocalDateTime participatedAt) { this.participatedAt = participatedAt; }

    public LocalDateTime getEnteredArenaAt() { return enteredArenaAt; }
    public void setEnteredArenaAt(LocalDateTime enteredArenaAt) { this.enteredArenaAt = enteredArenaAt; }

    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }

    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }

    public Integer getScore() { return score; }
    public void setScore(Integer score) { this.score = score; }

    public Integer getCorrectAnswers() { return correctAnswers; }
    public void setCorrectAnswers(Integer correctAnswers) { this.correctAnswers = correctAnswers; }

    public Integer getAttemptedAnswers() { return attemptedAnswers; }
    public void setAttemptedAnswers(Integer attemptedAnswers) { this.attemptedAnswers = attemptedAnswers; }

    public Long getTimeTakenSeconds() { return timeTakenSeconds; }
    public void setTimeTakenSeconds(Long timeTakenSeconds) { this.timeTakenSeconds = timeTakenSeconds; }

    public Integer getRank() { return rank; }
    public void setRank(Integer rank) { this.rank = rank; }

    public Boolean getReminderSent() { return reminderSent != null ? reminderSent : false; }
    public void setReminderSent(Boolean reminderSent) { this.reminderSent = reminderSent; }

    public Boolean getAgreedToRules() { return agreedToRules != null ? agreedToRules : false; }
    public void setAgreedToRules(Boolean agreedToRules) { this.agreedToRules = agreedToRules; }

    public Boolean getCameraPermissionGranted() { return cameraPermissionGranted != null ? cameraPermissionGranted : false; }
    public Boolean isCameraPermissionGranted() { return getCameraPermissionGranted(); }
    public void setCameraPermissionGranted(Boolean cameraPermissionGranted) { this.cameraPermissionGranted = cameraPermissionGranted; }

    public Boolean getMicPermissionGranted() { return micPermissionGranted != null ? micPermissionGranted : false; }
    public Boolean isMicPermissionGranted() { return getMicPermissionGranted(); }
    public void setMicPermissionGranted(Boolean micPermissionGranted) { this.micPermissionGranted = micPermissionGranted; }

    public Integer getFullscreenViolations() { return fullscreenViolations != null ? fullscreenViolations : 0; }
    public void setFullscreenViolations(Integer fullscreenViolations) { this.fullscreenViolations = fullscreenViolations; }

    public LocalDateTime getTerminatedAt() { return terminatedAt; }
    public void setTerminatedAt(LocalDateTime terminatedAt) { this.terminatedAt = terminatedAt; }

    public String getTerminationReason() { return terminationReason; }
    public void setTerminationReason(String terminationReason) { this.terminationReason = terminationReason; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
