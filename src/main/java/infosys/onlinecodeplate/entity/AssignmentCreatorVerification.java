package infosys.onlinecodeplate.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "assignment_creator_verifications")
public class AssignmentCreatorVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String username;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false)
    private String contactEmail;

    @Column(nullable = false)
    private String phoneNumber;

    @Column(nullable = false)
    private String organizationName;

    @Column
    private String organizationId;

    @Column
    private String organizationWebsite;

    @Column
    private String pan;

    @Column
    private String aadhaar;

    @Column
    private String governmentId1FileReference;

    @Column
    private String governmentId2FileReference;

    @Column(nullable = false)
    private String memberProofFileReference;

    @Column(nullable = false)
    private String status = "PENDING"; // NOT_VERIFIED, PENDING, OTP_PENDING, REJECTED, HOST_VERIFIED

    @Column
    private String otpHash;

    @Column
    private LocalDateTime otpExpiry;

    @Column
    private Integer otpAttempts = 0;

    private LocalDateTime otpLastSentAt;

    private LocalDateTime verifiedAt;

    @Column(nullable = false)
    private LocalDateTime submittedAt = LocalDateTime.now();

    private LocalDateTime reviewedAt;

    private String reviewedBy;

    @Column(columnDefinition = "TEXT")
    private String adminComment;

    private LocalDateTime updatedAt = LocalDateTime.now();

    public AssignmentCreatorVerification() {}

    public AssignmentCreatorVerification(User user, String username, String fullName, String contactEmail,
                                        String phoneNumber, String organizationName,
                                        String governmentId1FileReference, String governmentId2FileReference,
                                        String memberProofFileReference) {
        this.user = user;
        this.username = username;
        this.fullName = fullName;
        this.contactEmail = contactEmail;
        this.phoneNumber = phoneNumber;
        this.organizationName = organizationName;
        this.governmentId1FileReference = governmentId1FileReference;
        this.governmentId2FileReference = governmentId2FileReference;
        this.memberProofFileReference = memberProofFileReference;
        this.status = "PENDING";
        this.submittedAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public AssignmentCreatorVerification(User user, String username, String fullName, String contactEmail,
                                        String phoneNumber, String organizationName,
                                        String pan, String aadhaar,
                                        String governmentId1FileReference, String governmentId2FileReference,
                                        String memberProofFileReference) {
        this.user = user;
        this.username = username;
        this.fullName = fullName;
        this.contactEmail = contactEmail;
        this.phoneNumber = phoneNumber;
        this.organizationName = organizationName;
        this.pan = pan;
        this.aadhaar = aadhaar;
        this.governmentId1FileReference = governmentId1FileReference;
        this.governmentId2FileReference = governmentId2FileReference;
        this.memberProofFileReference = memberProofFileReference;
        this.status = "PENDING";
        this.submittedAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void setLastUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getContactEmail() { return contactEmail; }
    public void setContactEmail(String contactEmail) { this.contactEmail = contactEmail; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getOrganizationName() { return organizationName; }
    public void setOrganizationName(String organizationName) { this.organizationName = organizationName; }

    public String getPan() { return pan; }
    public void setPan(String pan) { this.pan = pan; }

    public String getAadhaar() { return aadhaar; }
    public void setAadhaar(String aadhaar) { this.aadhaar = aadhaar; }

    public String getMaskedPan() {
        if (pan == null || pan.isBlank()) return null;
        String clean = pan.trim().toUpperCase();
        if (clean.length() >= 10) {
            return clean.substring(0, 5) + "****" + clean.substring(clean.length() - 1);
        }
        return "******";
    }

    public String getMaskedAadhaar() {
        if (aadhaar == null || aadhaar.isBlank()) return null;
        String clean = aadhaar.replaceAll("\\s+", "").trim();
        if (clean.length() >= 12) {
            return "XXXX XXXX " + clean.substring(clean.length() - 4);
        } else if (clean.length() >= 4) {
            return "XXXX " + clean.substring(clean.length() - 4);
        }
        return "XXXXXXXXXXXX";
    }

    public String getGovernmentId1FileReference() { return governmentId1FileReference; }
    public void setGovernmentId1FileReference(String governmentId1FileReference) { this.governmentId1FileReference = governmentId1FileReference; }

    public String getGovernmentId2FileReference() { return governmentId2FileReference; }
    public void setGovernmentId2FileReference(String governmentId2FileReference) { this.governmentId2FileReference = governmentId2FileReference; }

    public String getMemberProofFileReference() { return memberProofFileReference; }
    public void setMemberProofFileReference(String memberProofFileReference) { this.memberProofFileReference = memberProofFileReference; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }

    public LocalDateTime getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(LocalDateTime reviewedAt) { this.reviewedAt = reviewedAt; }

    public String getOrganizationId() { return organizationId; }
    public void setOrganizationId(String organizationId) { this.organizationId = organizationId; }

    public String getOrganizationWebsite() { return organizationWebsite; }
    public void setOrganizationWebsite(String organizationWebsite) { this.organizationWebsite = organizationWebsite; }

    public String getOtpHash() { return otpHash; }
    public void setOtpHash(String otpHash) { this.otpHash = otpHash; }

    public LocalDateTime getOtpExpiry() { return otpExpiry; }
    public void setOtpExpiry(LocalDateTime otpExpiry) { this.otpExpiry = otpExpiry; }

    public Integer getOtpAttempts() { return otpAttempts != null ? otpAttempts : 0; }
    public void setOtpAttempts(Integer otpAttempts) { this.otpAttempts = otpAttempts; }

    public LocalDateTime getOtpLastSentAt() { return otpLastSentAt; }
    public void setOtpLastSentAt(LocalDateTime otpLastSentAt) { this.otpLastSentAt = otpLastSentAt; }

    public LocalDateTime getVerifiedAt() { return verifiedAt; }
    public void setVerifiedAt(LocalDateTime verifiedAt) { this.verifiedAt = verifiedAt; }

    public String getReviewedBy() { return reviewedBy; }
    public void setReviewedBy(String reviewedBy) { this.reviewedBy = reviewedBy; }

    public String getAdminComment() { return adminComment; }
    public void setAdminComment(String adminComment) { this.adminComment = adminComment; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
