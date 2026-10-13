package infosys.onlinecodeplate.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "certificates")
public class Certificate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String templateStyle; // DEFAULT, GOLD, PLATINUM, EMERALD, ELITE, CUSTOM

    @Column(name = "template_document", columnDefinition = "LONGTEXT")
    private String templateDocument;

    @Column(nullable = false)
    private String achievementType = "PROBLEMS_SOLVED"; // PROBLEMS_SOLVED, CONTESTS_PARTICIPATED, CONTESTS_CONDUCTED, CONTEST_WINS, CONTEST, CONTEST_RANK_1

    @Column(name = "category", nullable = false)
    private String category = "GENERAL"; // GENERAL, CONTEST, CODING_MILESTONE, ASSIGNMENT, COURSE, EVENT, CHALLENGE

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contest_id")
    private Contest contest;

    @Column(name = "contest_title")
    private String contestTitle;

    @Column(name = "contest_date")
    private LocalDateTime contestDate;

    @Column(name = "`rank`")
    private Integer rank;

    @Column(nullable = false)
    private Integer target = 5;

    @Column(nullable = false)
    private Boolean enabled = true;

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();

    public Certificate() {}

    public Certificate(String name, String description, String achievementType, Integer target, Boolean enabled) {
        this.name = name;
        this.description = description;
        this.achievementType = achievementType != null ? achievementType.toUpperCase() : "PROBLEMS_SOLVED";
        this.category = ("CONTEST".equalsIgnoreCase(this.achievementType) || "CONTEST_RANK_1".equalsIgnoreCase(this.achievementType)) ? "CONTEST" : "GENERAL";
        this.target = target != null ? target : 5;
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

    public String getTemplateStyle() { return templateStyle; }
    public void setTemplateStyle(String templateStyle) { this.templateStyle = templateStyle; }

    public String getTemplateDocument() { return templateDocument; }
    public void setTemplateDocument(String templateDocument) { this.templateDocument = templateDocument; }

    public String getCategory() { return category != null ? category : "GENERAL"; }
    public void setCategory(String category) { this.category = category != null ? category.toUpperCase() : "GENERAL"; }

    public Contest getContest() { return contest; }
    public void setContest(Contest contest) { this.contest = contest; }

    public String getContestTitle() { return contestTitle; }
    public void setContestTitle(String contestTitle) { this.contestTitle = contestTitle; }

    public LocalDateTime getContestDate() { return contestDate; }
    public void setContestDate(LocalDateTime contestDate) { this.contestDate = contestDate; }

    public Integer getRank() { return rank; }
    public void setRank(Integer rank) { this.rank = rank; }

    public String getAchievementType() { return achievementType; }
    public void setAchievementType(String achievementType) {
        this.achievementType = achievementType != null ? achievementType.toUpperCase() : "PROBLEMS_SOLVED";
        if ("CONTEST".equalsIgnoreCase(this.achievementType) || "CONTEST_RANK_1".equalsIgnoreCase(this.achievementType)) {
            this.category = "CONTEST";
        }
    }

    public Integer getTarget() { return target; }
    public void setTarget(Integer target) { this.target = target; }

    public Boolean getEnabled() { return enabled; }
    public void setEnabled(Boolean enabled) { this.enabled = enabled; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
