package infosys.onlinecodeplate.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "contests")
public class Contest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(name = "organization_name")
    private String organizationName;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organizer_id", nullable = false)
    private User organizer;

    @Column(nullable = false)
    private LocalDateTime startTime;

    @Column(nullable = false)
    private LocalDateTime endTime;

    private LocalDateTime registrationStartTime;

    @Column(nullable = false)
    private LocalDateTime registrationDeadline;

    private Integer durationMinutes;

    private String bannerUrl;

    private Integer maxParticipants;

    @Column(name = "contest_type", nullable = false)
    private String contestType = "SCHEDULED"; // SCHEDULED or OPEN

    @Column(nullable = false)
    private String status = "DRAFT"; // DRAFT, PUBLISHED, ONGOING, COMPLETED, CANCELLED

    @Column(name = "access_mode", nullable = false)
    private String accessMode = "PUBLIC"; // PUBLIC, INVITED, PRIVATE

    @Column(name = "public_notification_sent")
    private Boolean publicNotificationSent = false;

    @Column(name = "certificate_issued")
    private Boolean certificateIssued = false;

    @Column(name = "reminder_sent")
    private Boolean reminderSent = false;

    @Column(name = "start_notification_sent")
    private Boolean startNotificationSent = false;

    @Column(name = "result_notification_sent")
    private Boolean resultNotificationSent = false;

    @Column(name = "reminder_minutes")
    private Integer reminderMinutes = 10;

    @Column(name = "scoring_method")
    private String scoringMethod = "ACM_ICPC"; // ACM_ICPC or STANDARD_POINTS

    @OneToMany(mappedBy = "contest", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("questionOrder ASC")
    private List<ContestProblem> contestProblems = new ArrayList<>();

    @OneToMany(mappedBy = "contest", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<ContestParticipant> participants = new ArrayList<>();

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();

    public Contest() {}

    @PreUpdate
    public void setLastUpdate() { this.updatedAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getOrganizationName() { return organizationName; }
    public void setOrganizationName(String organizationName) { this.organizationName = organizationName; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public User getOrganizer() { return organizer; }
    public void setOrganizer(User organizer) { this.organizer = organizer; }

    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }

    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }

    public LocalDateTime getRegistrationStartTime() { return registrationStartTime; }
    public void setRegistrationStartTime(LocalDateTime registrationStartTime) { this.registrationStartTime = registrationStartTime; }

    public LocalDateTime getRegistrationDeadline() { return registrationDeadline; }
    public void setRegistrationDeadline(LocalDateTime registrationDeadline) { this.registrationDeadline = registrationDeadline; }

    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }

    public String getBannerUrl() { return bannerUrl; }
    public void setBannerUrl(String bannerUrl) { this.bannerUrl = bannerUrl; }

    public Integer getMaxParticipants() { return maxParticipants; }
    public void setMaxParticipants(Integer maxParticipants) { this.maxParticipants = maxParticipants; }

    public String getContestType() { return contestType; }
    public void setContestType(String contestType) { this.contestType = contestType; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getAccessMode() { return accessMode != null ? accessMode : "PUBLIC"; }
    public void setAccessMode(String accessMode) { this.accessMode = accessMode != null ? accessMode.toUpperCase() : "PUBLIC"; }

    public boolean isPrivate() {
        return "PRIVATE".equalsIgnoreCase(accessMode) || "INVITED".equalsIgnoreCase(accessMode);
    }

    public Boolean getPublicNotificationSent() { return publicNotificationSent != null ? publicNotificationSent : false; }
    public Boolean isPublicNotificationSent() { return publicNotificationSent != null ? publicNotificationSent : false; }
    public void setPublicNotificationSent(Boolean publicNotificationSent) { this.publicNotificationSent = publicNotificationSent; }

    public Boolean getCertificateIssued() { return certificateIssued != null ? certificateIssued : false; }
    public Boolean isCertificateIssued() { return certificateIssued != null ? certificateIssued : false; }
    public void setCertificateIssued(Boolean certificateIssued) { this.certificateIssued = certificateIssued; }

    public Boolean getReminderSent() { return reminderSent != null ? reminderSent : false; }
    public Boolean isReminderSent() { return reminderSent != null ? reminderSent : false; }
    public void setReminderSent(Boolean reminderSent) { this.reminderSent = reminderSent; }

    public Boolean getStartNotificationSent() { return startNotificationSent != null ? startNotificationSent : false; }
    public Boolean isStartNotificationSent() { return startNotificationSent != null ? startNotificationSent : false; }
    public void setStartNotificationSent(Boolean startNotificationSent) { this.startNotificationSent = startNotificationSent; }

    public Boolean getResultNotificationSent() { return resultNotificationSent != null ? resultNotificationSent : false; }
    public Boolean isResultNotificationSent() { return resultNotificationSent != null ? resultNotificationSent : false; }
    public void setResultNotificationSent(Boolean resultNotificationSent) { this.resultNotificationSent = resultNotificationSent; }

    public Integer getReminderMinutes() { return reminderMinutes != null ? reminderMinutes : 10; }
    public void setReminderMinutes(Integer reminderMinutes) { this.reminderMinutes = reminderMinutes; }

    public String getScoringMethod() { return scoringMethod != null ? scoringMethod : "ACM_ICPC"; }
    public void setScoringMethod(String scoringMethod) { this.scoringMethod = scoringMethod; }

    public List<ContestProblem> getContestProblems() { return contestProblems; }
    public void setContestProblems(List<ContestProblem> contestProblems) { this.contestProblems = contestProblems; }

    public List<ContestParticipant> getParticipants() { return participants; }
    public void setParticipants(List<ContestParticipant> participants) { this.participants = participants; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
