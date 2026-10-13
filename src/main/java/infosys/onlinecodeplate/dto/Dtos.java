package infosys.onlinecodeplate.dto;
import jakarta.validation.constraints.*;

public class Dtos {
    public static class RegisterRequest {
        @NotBlank(message = "Name is required") private String name;
        @NotBlank(message = "Username is required") private String username;
        @NotBlank(message = "Email is required") @Email(message = "Please enter a valid email") private String email;
        @NotBlank @Size(min = 8, message = "Password must be at least 8 characters")
        @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d@$!%*#?&]{8,}$", message = "Password must contain at least one letter and one number")
        private String password;
        @NotBlank private String repeatPassword;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
        public String getRepeatPassword() { return repeatPassword; }
        public void setRepeatPassword(String repeatPassword) { this.repeatPassword = repeatPassword; }
    }

    public static class LoginRequest {
        @NotBlank private String email;
        @NotBlank private String password;
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class AuthResponse {
        private String token;
        private UserDto user;
        public AuthResponse(String token, UserDto user) { this.token = token; this.user = user; }
        public String getToken() { return token; }
        public void setToken(String token) { this.token = token; }
        public UserDto getUser() { return user; }
        public void setUser(UserDto user) { this.user = user; }
    }

    public static class UserDto {
        private Long id;
        private String name;
        private String username;
        private String email;
        private String role;
        private String status;
        private String hostVerificationStatus;
        private String bio;
        private String contact;
        private java.time.LocalDateTime createdAt;
        private java.time.LocalDateTime updatedAt;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public String getHostVerificationStatus() { return hostVerificationStatus; }
        public void setHostVerificationStatus(String hostVerificationStatus) { this.hostVerificationStatus = hostVerificationStatus; }
        public String getBio() { return bio; }
        public void setBio(String bio) { this.bio = bio; }
        public String getContact() { return contact; }
        public void setContact(String contact) { this.contact = contact; }
        public java.time.LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(java.time.LocalDateTime createdAt) { this.createdAt = createdAt; }
        public java.time.LocalDateTime getUpdatedAt() { return updatedAt; }
        public void setUpdatedAt(java.time.LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    }
    
    public static class ProfileUpdateRequest {
        @NotBlank(message = "Name is required") private String name;
        @NotBlank(message = "Username is required") private String username;
        @NotBlank(message = "Email is required") @Email(message = "Please enter a valid email") private String email;
        private String bio;
        private String contact;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getBio() { return bio; }
        public void setBio(String bio) { this.bio = bio; }
        public String getContact() { return contact; }
        public void setContact(String contact) { this.contact = contact; }
    }

    public static class GoogleAuthRequest {
        private String credential;
        private String idToken;

        public GoogleAuthRequest() {}
        public GoogleAuthRequest(String credential) { 
            this.credential = credential; 
            this.idToken = credential;
        }

        public String getCredential() { 
            return credential != null && !credential.isBlank() ? credential : idToken; 
        }
        public void setCredential(String credential) { 
            this.credential = credential; 
            if (this.idToken == null) this.idToken = credential;
        }
        public String getIdToken() { 
            return idToken != null && !idToken.isBlank() ? idToken : credential; 
        }
        public void setIdToken(String idToken) { 
            this.idToken = idToken; 
            if (this.credential == null) this.credential = idToken;
        }
    }

    public static class UserStatusUpdateRequest {
        @NotBlank(message = "Status cannot be blank")
        private String status; // ACTIVE, BLOCKED

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }

    public static class AdminUserProfileDto {
        private Long id;
        private String name;
        private String username;
        private String email;
        private String role;
        private String status;
        private String hostVerificationStatus;
        private String bio;
        private String contact;
        private java.time.LocalDateTime createdAt;
        private java.time.LocalDateTime updatedAt;

        // Statistics
        private long solvedCount;
        private long easySolved;
        private long mediumSolved;
        private long hardSolved;

        // Contest performance
        private int contestsParticipated;
        private int contestsConducted;
        private int contestWins;
        private int currentStreak;
        private int longestStreak;

        // Achievements
        private java.util.List<infosys.onlinecodeplate.dto.AppDtos.BadgeDto> badges;
        private java.util.List<infosys.onlinecodeplate.dto.AppDtos.CertificateDto> certificates;
        private java.util.List<AdminUserSubmissionDto> recentSubmissions;
        private java.util.List<AdminUserAssignmentDto> assignments;
        private AdminUserVerificationDto creatorVerification;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public String getHostVerificationStatus() { return hostVerificationStatus; }
        public void setHostVerificationStatus(String hostVerificationStatus) { this.hostVerificationStatus = hostVerificationStatus; }
        public String getBio() { return bio; }
        public void setBio(String bio) { this.bio = bio; }
        public String getContact() { return contact; }
        public void setContact(String contact) { this.contact = contact; }
        public java.time.LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(java.time.LocalDateTime createdAt) { this.createdAt = createdAt; }
        public java.time.LocalDateTime getUpdatedAt() { return updatedAt; }
        public void setUpdatedAt(java.time.LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
        public long getSolvedCount() { return solvedCount; }
        public void setSolvedCount(long solvedCount) { this.solvedCount = solvedCount; }
        public long getEasySolved() { return easySolved; }
        public void setEasySolved(long easySolved) { this.easySolved = easySolved; }
        public long getMediumSolved() { return mediumSolved; }
        public void setMediumSolved(long mediumSolved) { this.mediumSolved = mediumSolved; }
        public long getHardSolved() { return hardSolved; }
        public void setHardSolved(long hardSolved) { this.hardSolved = hardSolved; }
        public int getContestsParticipated() { return contestsParticipated; }
        public void setContestsParticipated(int contestsParticipated) { this.contestsParticipated = contestsParticipated; }
        public int getContestsConducted() { return contestsConducted; }
        public void setContestsConducted(int contestsConducted) { this.contestsConducted = contestsConducted; }
        public int getContestWins() { return contestWins; }
        public void setContestWins(int contestWins) { this.contestWins = contestWins; }
        public int getCurrentStreak() { return currentStreak; }
        public void setCurrentStreak(int currentStreak) { this.currentStreak = currentStreak; }
        public int getLongestStreak() { return longestStreak; }
        public void setLongestStreak(int longestStreak) { this.longestStreak = longestStreak; }
        public java.util.List<infosys.onlinecodeplate.dto.AppDtos.BadgeDto> getBadges() { return badges; }
        public void setBadges(java.util.List<infosys.onlinecodeplate.dto.AppDtos.BadgeDto> badges) { this.badges = badges; }
        public java.util.List<infosys.onlinecodeplate.dto.AppDtos.CertificateDto> getCertificates() { return certificates; }
        public void setCertificates(java.util.List<infosys.onlinecodeplate.dto.AppDtos.CertificateDto> certificates) { this.certificates = certificates; }
        public java.util.List<AdminUserSubmissionDto> getRecentSubmissions() { return recentSubmissions; }
        public void setRecentSubmissions(java.util.List<AdminUserSubmissionDto> recentSubmissions) { this.recentSubmissions = recentSubmissions; }
        public java.util.List<AdminUserAssignmentDto> getAssignments() { return assignments; }
        public void setAssignments(java.util.List<AdminUserAssignmentDto> assignments) { this.assignments = assignments; }
        public AdminUserVerificationDto getCreatorVerification() { return creatorVerification; }
        public void setCreatorVerification(AdminUserVerificationDto creatorVerification) { this.creatorVerification = creatorVerification; }
    }

    public static class AdminUserSubmissionDto {
        private Long id;
        private Long problemId;
        private String problemTitle;
        private String problemDifficulty;
        private String language;
        private String status;
        private Double runtime;
        private Double memory;
        private Integer passedTestCases;
        private Integer totalTestCases;
        private java.time.LocalDateTime createdAt;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public Long getProblemId() { return problemId; }
        public void setProblemId(Long problemId) { this.problemId = problemId; }
        public String getProblemTitle() { return problemTitle; }
        public void setProblemTitle(String problemTitle) { this.problemTitle = problemTitle; }
        public String getProblemDifficulty() { return problemDifficulty; }
        public void setProblemDifficulty(String problemDifficulty) { this.problemDifficulty = problemDifficulty; }
        public String getLanguage() { return language; }
        public void setLanguage(String language) { this.language = language; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public Double getRuntime() { return runtime; }
        public void setRuntime(Double runtime) { this.runtime = runtime; }
        public Double getMemory() { return memory; }
        public void setMemory(Double memory) { this.memory = memory; }
        public Integer getPassedTestCases() { return passedTestCases; }
        public void setPassedTestCases(Integer passedTestCases) { this.passedTestCases = passedTestCases; }
        public Integer getTotalTestCases() { return totalTestCases; }
        public void setTotalTestCases(Integer totalTestCases) { this.totalTestCases = totalTestCases; }
        public java.time.LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(java.time.LocalDateTime createdAt) { this.createdAt = createdAt; }
    }

    public static class AdminUserAssignmentDto {
        private Long assignmentId;
        private String assignmentTitle;
        private String status;
        private String accessCode;
        private java.time.LocalDateTime assignedAt;
        private java.time.LocalDateTime completedAt;
        private Integer score;

        public Long getAssignmentId() { return assignmentId; }
        public void setAssignmentId(Long assignmentId) { this.assignmentId = assignmentId; }
        public String getAssignmentTitle() { return assignmentTitle; }
        public void setAssignmentTitle(String assignmentTitle) { this.assignmentTitle = assignmentTitle; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public String getAccessCode() { return accessCode; }
        public void setAccessCode(String accessCode) { this.accessCode = accessCode; }
        public java.time.LocalDateTime getAssignedAt() { return assignedAt; }
        public void setAssignedAt(java.time.LocalDateTime assignedAt) { this.assignedAt = assignedAt; }
        public java.time.LocalDateTime getCompletedAt() { return completedAt; }
        public void setCompletedAt(java.time.LocalDateTime completedAt) { this.completedAt = completedAt; }
        public Integer getScore() { return score; }
        public void setScore(Integer score) { this.score = score; }
    }

    public static class AdminUserVerificationDto {
        private Long id;
        private String organizationName;
        private String maskedPan;
        private String maskedAadhaar;
        private String governmentId1FileReference;
        private String governmentId2FileReference;
        private String memberProofFileReference;
        private boolean hasGovernmentId1;
        private boolean hasGovernmentId2;
        private boolean hasMemberProof;
        private String status;
        private java.time.LocalDateTime submittedAt;
        private java.time.LocalDateTime reviewedAt;
        private String reviewedBy;
        private String adminComment;

        public AdminUserVerificationDto() {}

        public AdminUserVerificationDto(Long id, String organizationName, String status,
                                        java.time.LocalDateTime submittedAt, java.time.LocalDateTime reviewedAt,
                                        String reviewedBy, String adminComment) {
            this.id = id;
            this.organizationName = organizationName;
            this.status = status;
            this.submittedAt = submittedAt;
            this.reviewedAt = reviewedAt;
            this.reviewedBy = reviewedBy;
            this.adminComment = adminComment;
        }

        public AdminUserVerificationDto(Long id, String organizationName, String maskedPan, String maskedAadhaar,
                                        String status, java.time.LocalDateTime submittedAt, java.time.LocalDateTime reviewedAt,
                                        String reviewedBy, String adminComment) {
            this.id = id;
            this.organizationName = organizationName;
            this.maskedPan = maskedPan;
            this.maskedAadhaar = maskedAadhaar;
            this.status = status;
            this.submittedAt = submittedAt;
            this.reviewedAt = reviewedAt;
            this.reviewedBy = reviewedBy;
            this.adminComment = adminComment;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getOrganizationName() { return organizationName; }
        public void setOrganizationName(String organizationName) { this.organizationName = organizationName; }
        public String getMaskedPan() { return maskedPan; }
        public void setMaskedPan(String maskedPan) { this.maskedPan = maskedPan; }
        public String getMaskedAadhaar() { return maskedAadhaar; }
        public void setMaskedAadhaar(String maskedAadhaar) { this.maskedAadhaar = maskedAadhaar; }
        public String getGovernmentId1FileReference() { return governmentId1FileReference; }
        public void setGovernmentId1FileReference(String governmentId1FileReference) { this.governmentId1FileReference = governmentId1FileReference; this.hasGovernmentId1 = (governmentId1FileReference != null && !governmentId1FileReference.isBlank()); }
        public String getGovernmentId2FileReference() { return governmentId2FileReference; }
        public void setGovernmentId2FileReference(String governmentId2FileReference) { this.governmentId2FileReference = governmentId2FileReference; this.hasGovernmentId2 = (governmentId2FileReference != null && !governmentId2FileReference.isBlank()); }
        public String getMemberProofFileReference() { return memberProofFileReference; }
        public void setMemberProofFileReference(String memberProofFileReference) { this.memberProofFileReference = memberProofFileReference; this.hasMemberProof = (memberProofFileReference != null && !memberProofFileReference.isBlank()); }
        public boolean isHasGovernmentId1() { return hasGovernmentId1 || (governmentId1FileReference != null && !governmentId1FileReference.isBlank()); }
        public void setHasGovernmentId1(boolean hasGovernmentId1) { this.hasGovernmentId1 = hasGovernmentId1; }
        public boolean isHasGovernmentId2() { return hasGovernmentId2 || (governmentId2FileReference != null && !governmentId2FileReference.isBlank()); }
        public void setHasGovernmentId2(boolean hasGovernmentId2) { this.hasGovernmentId2 = hasGovernmentId2; }
        public boolean isHasMemberProof() { return hasMemberProof || (memberProofFileReference != null && !memberProofFileReference.isBlank()); }
        public void setHasMemberProof(boolean hasMemberProof) { this.hasMemberProof = hasMemberProof; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public java.time.LocalDateTime getSubmittedAt() { return submittedAt; }
        public void setSubmittedAt(java.time.LocalDateTime submittedAt) { this.submittedAt = submittedAt; }
        public java.time.LocalDateTime getReviewedAt() { return reviewedAt; }
        public void setReviewedAt(java.time.LocalDateTime reviewedAt) { this.reviewedAt = reviewedAt; }
        public String getReviewedBy() { return reviewedBy; }
        public void setReviewedBy(String reviewedBy) { this.reviewedBy = reviewedBy; }
        public String getAdminComment() { return adminComment; }
        public void setAdminComment(String adminComment) { this.adminComment = adminComment; }
    }
}
