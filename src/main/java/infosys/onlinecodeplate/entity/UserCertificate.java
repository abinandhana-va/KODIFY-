package infosys.onlinecodeplate.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_certificates", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "certificate_id"})
})
public class UserCertificate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "certificate_id", nullable = false)
    private Certificate certificate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contest_id")
    private Contest contest;

    @Column(name = "contest_title")
    private String contestTitle;

    @Column(name = "contest_date")
    private LocalDateTime contestDate;

    @Column(name = "`rank`")
    private Integer rank;

    @Column(name = "category", nullable = false)
    private String category = "GENERAL"; // GENERAL, CONTEST

    private LocalDateTime unlockedAt = LocalDateTime.now();

    @Column(unique = true)
    private String certificateCode;

    @Column(name = "generated_document", columnDefinition = "LONGTEXT")
    private String generatedDocument;

    public UserCertificate() {}

    public UserCertificate(User user, Certificate certificate, LocalDateTime unlockedAt, String certificateCode) {
        this.user = user;
        this.certificate = certificate;
        this.unlockedAt = unlockedAt != null ? unlockedAt : LocalDateTime.now();
        this.certificateCode = certificateCode;
        if (certificate != null && "CONTEST".equalsIgnoreCase(certificate.getCategory())) {
            this.category = "CONTEST";
            this.contest = certificate.getContest();
            this.contestTitle = certificate.getContestTitle();
            this.contestDate = certificate.getContestDate();
            this.rank = certificate.getRank();
        }
    }

    public UserCertificate(User user, Certificate certificate, Contest contest, Integer rank, LocalDateTime unlockedAt, String certificateCode) {
        this.user = user;
        this.certificate = certificate;
        this.contest = contest;
        this.rank = rank;
        this.category = "CONTEST";
        if (contest != null) {
            this.contestTitle = contest.getTitle();
            this.contestDate = contest.getStartTime();
        }
        this.unlockedAt = unlockedAt != null ? unlockedAt : LocalDateTime.now();
        this.certificateCode = certificateCode;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Certificate getCertificate() { return certificate; }
    public void setCertificate(Certificate certificate) { this.certificate = certificate; }

    public LocalDateTime getUnlockedAt() { return unlockedAt; }
    public void setUnlockedAt(LocalDateTime unlockedAt) { this.unlockedAt = unlockedAt; }

    public Contest getContest() { return contest; }
    public void setContest(Contest contest) { this.contest = contest; }

    public String getContestTitle() { return contestTitle; }
    public void setContestTitle(String contestTitle) { this.contestTitle = contestTitle; }

    public LocalDateTime getContestDate() { return contestDate; }
    public void setContestDate(LocalDateTime contestDate) { this.contestDate = contestDate; }

    public Integer getRank() { return rank; }
    public void setRank(Integer rank) { this.rank = rank; }

    public String getCategory() { return category != null ? category : "GENERAL"; }
    public void setCategory(String category) { this.category = category != null ? category.toUpperCase() : "GENERAL"; }

    public String getCertificateCode() { return certificateCode; }
    public void setCertificateCode(String certificateCode) { this.certificateCode = certificateCode; }

    public String getGeneratedDocument() { return generatedDocument; }
    public void setGeneratedDocument(String generatedDocument) { this.generatedDocument = generatedDocument; }
}
