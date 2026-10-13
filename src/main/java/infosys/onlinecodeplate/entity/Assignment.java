package infosys.onlinecodeplate.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "assignments")
public class Assignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creator_id", nullable = false)
    private User creator;

    private LocalDateTime startTime;

    private LocalDateTime dueDate;

    @Column(nullable = false)
    private String status = "ACTIVE"; // DRAFT, ACTIVE, COMPLETED, ARCHIVED

    @Column(nullable = false)
    private Boolean secureMode = false;

    private Integer durationMinutes = 60;

    private Integer allowedAttempts = 1;

    @OneToMany(mappedBy = "assignment", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("problemOrder ASC")
    private List<AssignmentProblem> assignmentProblems = new ArrayList<>();

    @OneToMany(mappedBy = "assignment", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<AssignmentUser> assignedUsers = new ArrayList<>();

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();

    public Assignment() {}

    public Assignment(String title, String description, User creator, LocalDateTime startTime, LocalDateTime dueDate, String status, Boolean secureMode, Integer durationMinutes) {
        this.title = title;
        this.description = description;
        this.creator = creator;
        this.startTime = startTime != null ? startTime : LocalDateTime.now();
        this.dueDate = dueDate;
        this.status = status != null ? status : "ACTIVE";
        this.secureMode = secureMode != null ? secureMode : false;
        this.durationMinutes = durationMinutes != null ? durationMinutes : 60;
    }


    @PreUpdate
    public void setLastUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public User getCreator() { return creator; }
    public void setCreator(User creator) { this.creator = creator; }

    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }

    public LocalDateTime getDueDate() { return dueDate; }
    public void setDueDate(LocalDateTime dueDate) { this.dueDate = dueDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Boolean getSecureMode() { return secureMode != null ? secureMode : false; }
    public void setSecureMode(Boolean secureMode) { this.secureMode = secureMode; }

    public Integer getDurationMinutes() { return durationMinutes != null ? durationMinutes : 60; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }

    public Integer getAllowedAttempts() { return allowedAttempts != null ? allowedAttempts : 1; }
    public void setAllowedAttempts(Integer allowedAttempts) { this.allowedAttempts = allowedAttempts; }

    public List<AssignmentProblem> getAssignmentProblems() { return assignmentProblems; }

    public void setAssignmentProblems(List<AssignmentProblem> assignmentProblems) { this.assignmentProblems = assignmentProblems; }

    public List<AssignmentUser> getAssignedUsers() { return assignedUsers; }
    public void setAssignedUsers(List<AssignmentUser> assignedUsers) { this.assignedUsers = assignedUsers; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
