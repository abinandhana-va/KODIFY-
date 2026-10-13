package infosys.onlinecodeplate.entity;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String username;
    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Column(nullable = false)
    private String status = "ACTIVE"; // ACTIVE, BLOCKED

    @Column(nullable = false)
    private String hostVerificationStatus = "NOT_VERIFIED"; // NOT_VERIFIED, PENDING, REJECTED, HOST_VERIFIED

    @Column(unique = true)
    private String googleId;

    @Column(columnDefinition = "TEXT")
    private String bio;

    private String contact;

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void setLastUpdate() { this.updatedAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
    public String getStatus() { return status != null ? status : "ACTIVE"; }
    public void setStatus(String status) { this.status = status; }
    public boolean isEnabled() { return !"BLOCKED".equalsIgnoreCase(this.status); }
    public String getHostVerificationStatus() {
        if (Role.ADMIN.equals(this.role)) return "HOST_VERIFIED";
        return hostVerificationStatus != null ? hostVerificationStatus : "NOT_VERIFIED";
    }
    public void setHostVerificationStatus(String hostVerificationStatus) { this.hostVerificationStatus = hostVerificationStatus; }
    public boolean isHostVerified() {
        return Role.ADMIN.equals(this.role) || "HOST_VERIFIED".equalsIgnoreCase(this.hostVerificationStatus) || "APPROVED".equalsIgnoreCase(this.hostVerificationStatus);
    }
    public String getGoogleId() { return googleId; }
    public void setGoogleId(String googleId) { this.googleId = googleId; }
    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }
    public String getContact() { return contact; }
    public void setContact(String contact) { this.contact = contact; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}

