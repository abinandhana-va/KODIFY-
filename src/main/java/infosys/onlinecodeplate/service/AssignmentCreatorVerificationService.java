package infosys.onlinecodeplate.service;

import infosys.onlinecodeplate.dto.AppDtos.AssignmentCreatorVerificationDto;
import infosys.onlinecodeplate.entity.AssignmentCreatorVerification;
import infosys.onlinecodeplate.entity.Role;
import infosys.onlinecodeplate.entity.User;
import infosys.onlinecodeplate.repository.AssignmentCreatorVerificationRepository;
import infosys.onlinecodeplate.repository.UserRepository;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class AssignmentCreatorVerificationService {

    private static final Pattern PHONE_PATTERN = Pattern.compile("^[+]?[0-9\\s\\-().]{7,20}$");
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
    private static final Pattern PAN_PATTERN = Pattern.compile("^[A-Z]{5}[0-9]{4}[A-Z]$");
    private static final Pattern AADHAAR_PATTERN = Pattern.compile("^[0-9]{12}$");
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final AssignmentCreatorVerificationRepository verificationRepo;
    private final UserRepository userRepo;
    private final FileStorageService fileStorageService;
    private final EmailService emailService;
    private final ActivityService activityService;

    public AssignmentCreatorVerificationService(AssignmentCreatorVerificationRepository verificationRepo,
                                                UserRepository userRepo,
                                                FileStorageService fileStorageService,
                                                EmailService emailService,
                                                ActivityService activityService) {
        this.verificationRepo = verificationRepo;
        this.userRepo = userRepo;
        this.fileStorageService = fileStorageService;
        this.emailService = emailService;
        this.activityService = activityService;
    }

    private String generate6DigitOtp() {
        int code = 100000 + SECURE_RANDOM.nextInt(900000);
        return String.valueOf(code);
    }

    private String hashOtp(String otp) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(otp.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("Error hashing verification OTP", e);
        }
    }

    @Transactional
    public AssignmentCreatorVerificationDto submitVerification(User user,
                                                               String fullName,
                                                               String contactEmail,
                                                               String phoneNumber,
                                                               String organizationName,
                                                               String organizationId,
                                                               String organizationWebsite,
                                                               String pan,
                                                               String aadhaar,
                                                               MultipartFile governmentId1,
                                                               MultipartFile governmentId2,
                                                               MultipartFile memberProofPdf) {
        if (user == null) {
            throw new RuntimeException("Authentication required to submit host verification.");
        }

        if (fullName == null || fullName.trim().isEmpty()) {
            throw new RuntimeException("Full name is mandatory.");
        }
        if (contactEmail == null || contactEmail.trim().isEmpty() || !EMAIL_PATTERN.matcher(contactEmail.trim()).matches()) {
            throw new RuntimeException("A valid contact email address is required.");
        }
        if (phoneNumber == null || phoneNumber.trim().isEmpty() || !PHONE_PATTERN.matcher(phoneNumber.trim()).matches()) {
            throw new RuntimeException("A valid phone number (7-20 digits) is required.");
        }
        if (organizationName == null || organizationName.trim().isEmpty()) {
            throw new RuntimeException("Organization or Institutional name is mandatory.");
        }

        // Validate Government ID 1 (Required)
        if (governmentId1 == null || governmentId1.isEmpty()) {
            throw new RuntimeException("Government ID Document 1 is required.");
        }

        // Validate Government ID 2 (Required)
        if (governmentId2 == null || governmentId2.isEmpty()) {
            throw new RuntimeException("Government ID Document 2 is required.");
        }

        // Validate Member Proof (COMPULSORY / REQUIRED - PDF format)
        if (memberProofPdf == null || memberProofPdf.isEmpty()) {
            throw new RuntimeException("Member proof is required.");
        }

        if (isUserApprovedCreator(user)) {
            throw new RuntimeException("Your account is already HOST_VERIFIED. You can create assignments directly.");
        }

        // Check if there is already a pending verification request
        List<AssignmentCreatorVerification> existing = verificationRepo.findByUserIdOrderBySubmittedAtDesc(user.getId());
        if (!existing.isEmpty() && ("PENDING".equalsIgnoreCase(existing.get(0).getStatus()) || "OTP_PENDING".equalsIgnoreCase(existing.get(0).getStatus()))) {
            if ("OTP_PENDING".equalsIgnoreCase(existing.get(0).getStatus())) {
                throw new RuntimeException("Your organization documents have already been approved. Please verify your 6-digit email OTP.");
            }
            throw new RuntimeException("You already have an active host verification request waiting for admin review.");
        }

        // Store files securely
        String govId1Ref = fileStorageService.storeGovernmentId(governmentId1, user.getId(), 1);
        String govId2Ref = fileStorageService.storeGovernmentId(governmentId2, user.getId(), 2);
        String memberProofRef = fileStorageService.storeMemberProof(memberProofPdf, user.getId());

        String cleanPan = (pan != null && !pan.isBlank()) ? pan.trim().toUpperCase() : null;
        String cleanAadhaar = (aadhaar != null && !aadhaar.isBlank()) ? aadhaar.replaceAll("\\s+", "").replaceAll("-", "").trim() : null;

        AssignmentCreatorVerification verification = new AssignmentCreatorVerification(
                user,
                user.getUsername(),
                fullName.trim(),
                contactEmail.trim().toLowerCase(),
                phoneNumber.trim(),
                organizationName.trim(),
                govId1Ref,
                govId2Ref,
                memberProofRef
        );
        verification.setOrganizationId(organizationId != null ? organizationId.trim() : null);
        verification.setOrganizationWebsite(organizationWebsite != null ? organizationWebsite.trim() : null);
        verification.setPan(cleanPan);
        verification.setAadhaar(cleanAadhaar);
        verification.setStatus("PENDING");
        verification = verificationRepo.save(verification);

        user.setHostVerificationStatus("PENDING");
        userRepo.save(user);

        activityService.logActivity(
                user,
                "Host Verification Submitted",
                "Submitted organization host verification request for '" + organizationName.trim() + "' with verification documents."
        );

        return mapToDto(verification);
    }

    @Transactional
    public AssignmentCreatorVerificationDto submitVerification(User user,
                                                               String fullName,
                                                               String contactEmail,
                                                               String phoneNumber,
                                                               String organizationName,
                                                               String pan,
                                                               String aadhaar,
                                                               MultipartFile governmentId1,
                                                               MultipartFile governmentId2,
                                                               MultipartFile memberProofPdf) {
        return submitVerification(user, fullName, contactEmail, phoneNumber, organizationName, null, null, pan, aadhaar, governmentId1, governmentId2, memberProofPdf);
    }

    @Transactional
    public AssignmentCreatorVerificationDto submitVerification(User user,
                                                               String fullName,
                                                               String contactEmail,
                                                               String phoneNumber,
                                                               String organizationName,
                                                               MultipartFile governmentId1,
                                                               MultipartFile governmentId2,
                                                               MultipartFile memberProofPdf) {
        return submitVerification(user, fullName, contactEmail, phoneNumber, organizationName, null, null, null, null, governmentId1, governmentId2, memberProofPdf);
    }

    @Transactional
    public AssignmentCreatorVerificationDto submitVerification(User user,
                                                               String fullName,
                                                               String contactEmail,
                                                               String phoneNumber,
                                                               String organizationName,
                                                               String pan,
                                                               String aadhaar,
                                                               MultipartFile memberProofPdf) {
        return submitVerification(user, fullName, contactEmail, phoneNumber, organizationName, null, null, pan, aadhaar, memberProofPdf, memberProofPdf, memberProofPdf);
    }

    @Transactional
    public AssignmentCreatorVerificationDto submitVerification(User user,
                                                               String fullName,
                                                               String contactEmail,
                                                               String phoneNumber,
                                                               String organizationName,
                                                               MultipartFile memberProofPdf) {
        return submitVerification(user, fullName, contactEmail, phoneNumber, organizationName, null, null, null, null, memberProofPdf, memberProofPdf, memberProofPdf);
    }

    @Transactional(readOnly = true)
    public AssignmentCreatorVerificationDto getUserVerificationStatus(User user) {
        if (user == null) {
            AssignmentCreatorVerificationDto notAuth = new AssignmentCreatorVerificationDto();
            notAuth.setStatus("NOT_VERIFIED");
            notAuth.setApproved(false);
            notAuth.setHostVerified(false);
            return notAuth;
        }

        if (Role.ADMIN.equals(user.getRole())) {
            AssignmentCreatorVerificationDto adminDto = new AssignmentCreatorVerificationDto();
            adminDto.setUserId(user.getId());
            adminDto.setUsername(user.getUsername());
            adminDto.setFullName(user.getName());
            adminDto.setContactEmail(user.getEmail());
            adminDto.setOrganizationName("KODIFY System Administrator");
            adminDto.setStatus("HOST_VERIFIED");
            adminDto.setApproved(true);
            adminDto.setHostVerified(true);
            return adminDto;
        }

        return verificationRepo.findTopByUserIdOrderBySubmittedAtDesc(user.getId())
                .map(this::mapToDto)
                .orElseGet(() -> {
                    AssignmentCreatorVerificationDto empty = new AssignmentCreatorVerificationDto();
                    empty.setUserId(user.getId());
                    empty.setUsername(user.getUsername());
                    empty.setFullName(user.getName());
                    empty.setContactEmail(user.getEmail());
                    empty.setStatus("NOT_VERIFIED");
                    empty.setApproved(false);
                    empty.setHostVerified(false);
                    return empty;
                });
    }

    @Transactional(readOnly = true)
    public boolean isUserApprovedCreator(User user) {
        if (user == null) return false;
        if (Role.ADMIN.equals(user.getRole())) return true;
        if ("HOST_VERIFIED".equalsIgnoreCase(user.getHostVerificationStatus()) || "APPROVED".equalsIgnoreCase(user.getHostVerificationStatus())) {
            return true;
        }
        return verificationRepo.existsByUserIdAndStatus(user.getId(), "HOST_VERIFIED")
                || verificationRepo.existsByUserIdAndStatus(user.getId(), "APPROVED");
    }

    @Transactional(readOnly = true)
    public List<AssignmentCreatorVerificationDto> getAllVerificationsForAdmin(User adminUser) {
        if (adminUser == null || !Role.ADMIN.equals(adminUser.getRole())) {
            throw new RuntimeException("Access denied. Admin privileges required.");
        }
        return verificationRepo.findAllByOrderBySubmittedAtDesc().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public AssignmentCreatorVerificationDto approveVerification(Long id, User adminUser) {
        if (adminUser == null || !Role.ADMIN.equals(adminUser.getRole())) {
            throw new RuntimeException("Access denied. Admin privileges required.");
        }

        AssignmentCreatorVerification verification = verificationRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Verification request not found with ID " + id));

        String rawOtp = generate6DigitOtp();
        verification.setStatus("OTP_PENDING");
        verification.setOtpHash(hashOtp(rawOtp));
        verification.setOtpExpiry(LocalDateTime.now().plusMinutes(15));
        verification.setOtpAttempts(0);
        verification.setOtpLastSentAt(LocalDateTime.now());
        verification.setReviewedAt(LocalDateTime.now());
        verification.setReviewedBy(adminUser.getUsername());
        verification.setAdminComment("Approved by Administrator. 6-digit OTP dispatched to contact email.");
        verification = verificationRepo.save(verification);

        User applicant = verification.getUser();
        if (applicant != null) {
            applicant.setHostVerificationStatus("OTP_PENDING");
            userRepo.save(applicant);
        }

        activityService.logActivity(
                verification.getUser(),
                "Host Verification Approved (OTP Dispatched)",
                "Admin approved your organization documents. Check your email for the 6-digit OTP."
        );

        try {
            if (emailService != null) {
                emailService.sendHostVerificationOtpEmail(
                        applicant != null ? applicant.getId() : null,
                        verification.getContactEmail(),
                        verification.getFullName(),
                        verification.getOrganizationName(),
                        rawOtp
                );
            }
        } catch (Exception e) {
            // Non-blocking notification dispatch
        }

        return mapToDto(verification);
    }

    @Transactional
    public AssignmentCreatorVerificationDto verifyOtp(String otpCode, User user) {
        if (user == null) {
            throw new RuntimeException("Authentication required to verify OTP.");
        }
        if (otpCode == null || !otpCode.trim().matches("^[0-9]{6}$")) {
            throw new RuntimeException("A valid 6-digit numeric OTP is required.");
        }

        AssignmentCreatorVerification verification = verificationRepo.findTopByUserIdOrderBySubmittedAtDesc(user.getId())
                .orElseThrow(() -> new RuntimeException("No active host verification request found for user."));

        if (!"OTP_PENDING".equalsIgnoreCase(verification.getStatus()) && !"ADMIN_APPROVED".equalsIgnoreCase(verification.getStatus())) {
            if ("HOST_VERIFIED".equalsIgnoreCase(verification.getStatus()) || "APPROVED".equalsIgnoreCase(verification.getStatus())) {
                return mapToDto(verification);
            }
            throw new RuntimeException("Verification request is not awaiting OTP verification (current status: " + verification.getStatus() + ").");
        }

        if (verification.getOtpAttempts() != null && verification.getOtpAttempts() >= 5) {
            throw new RuntimeException("Too many failed OTP attempts. Please click 'Resend OTP' to generate a new code.");
        }

        if (verification.getOtpExpiry() != null && LocalDateTime.now().isAfter(verification.getOtpExpiry())) {
            throw new RuntimeException("The OTP code has expired. Please click 'Resend OTP' to receive a new code.");
        }

        String candidateHash = hashOtp(otpCode.trim());
        if (verification.getOtpHash() == null || !candidateHash.equals(verification.getOtpHash())) {
            verification.setOtpAttempts(verification.getOtpAttempts() + 1);
            verificationRepo.save(verification);
            int remaining = Math.max(0, 5 - verification.getOtpAttempts());
            throw new RuntimeException("Invalid OTP code. " + remaining + " attempts remaining.");
        }

        // OTP Match! Grant Verified Host privileges
        verification.setStatus("HOST_VERIFIED");
        verification.setVerifiedAt(LocalDateTime.now());
        verification.setOtpHash(null); // Single use
        verification = verificationRepo.save(verification);

        user.setHostVerificationStatus("HOST_VERIFIED");
        userRepo.save(user);

        activityService.logActivity(
                user,
                "Host Verification Completed",
                "Successfully verified organization OTP. You are now a Verified Host."
        );

        try {
            if (emailService != null) {
                emailService.sendHostVerificationApprovalEmail(user.getId(), verification.getContactEmail(), verification.getFullName());
            }
        } catch (Exception ignored) {}

        return mapToDto(verification);
    }

    @Transactional
    public AssignmentCreatorVerificationDto resendOtp(User user) {
        if (user == null) {
            throw new RuntimeException("Authentication required.");
        }

        AssignmentCreatorVerification verification = verificationRepo.findTopByUserIdOrderBySubmittedAtDesc(user.getId())
                .orElseThrow(() -> new RuntimeException("No host verification request found."));

        if (!"OTP_PENDING".equalsIgnoreCase(verification.getStatus()) && !"ADMIN_APPROVED".equalsIgnoreCase(verification.getStatus())) {
            throw new RuntimeException("Verification request is not awaiting OTP verification.");
        }

        if (verification.getOtpLastSentAt() != null) {
            long secondsSince = Duration.between(verification.getOtpLastSentAt(), LocalDateTime.now()).getSeconds();
            if (secondsSince < 60) {
                long wait = 60 - secondsSince;
                throw new RuntimeException("Please wait " + wait + " seconds before requesting another OTP.");
            }
        }

        String rawOtp = generate6DigitOtp();
        verification.setOtpHash(hashOtp(rawOtp));
        verification.setOtpExpiry(LocalDateTime.now().plusMinutes(15));
        verification.setOtpAttempts(0);
        verification.setOtpLastSentAt(LocalDateTime.now());
        verification = verificationRepo.save(verification);

        try {
            if (emailService != null) {
                emailService.sendHostVerificationOtpEmail(
                        user.getId(),
                        verification.getContactEmail(),
                        verification.getFullName(),
                        verification.getOrganizationName(),
                        rawOtp
                );
            }
        } catch (Exception ignored) {}

        return mapToDto(verification);
    }

    @Transactional
    public AssignmentCreatorVerificationDto rejectVerification(Long id, String reason, User adminUser) {
        if (adminUser == null || !Role.ADMIN.equals(adminUser.getRole())) {
            throw new RuntimeException("Access denied. Admin privileges required.");
        }

        AssignmentCreatorVerification verification = verificationRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Verification request not found with ID " + id));

        verification.setStatus("REJECTED");
        verification.setReviewedAt(LocalDateTime.now());
        verification.setReviewedBy(adminUser.getUsername());
        verification.setAdminComment((reason != null && !reason.isBlank()) ? reason.trim() : "Documentation was insufficient.");
        verification = verificationRepo.save(verification);

        User applicant = verification.getUser();
        if (applicant != null) {
            applicant.setHostVerificationStatus("REJECTED");
            userRepo.save(applicant);
        }

        activityService.logActivity(
                verification.getUser(),
                "Host Verification Rejected",
                "Your Assignment Host verification request was not approved."
        );

        if (emailService != null) {
            emailService.sendCreatorVerificationDecisionEmail(
                    verification.getContactEmail(),
                    verification.getFullName(),
                    false,
                    verification.getAdminComment()
            );
        }

        return mapToDto(verification);
    }

    @Transactional(readOnly = true)
    public Resource getMemberProofPdfResource(Long id, User currentUser) {
        return getDocumentResource(id, "member-proof", currentUser);
    }

    @Transactional(readOnly = true)
    public Resource getDocumentResource(Long id, String docType, User currentUser) {
        if (currentUser == null) {
            throw new RuntimeException("User not authenticated.");
        }

        AssignmentCreatorVerification verification = verificationRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Verification record not found with ID " + id));

        boolean isAdmin = Role.ADMIN.equals(currentUser.getRole());
        boolean isOwner = verification.getUser() != null && verification.getUser().getId().equals(currentUser.getId());

        if (!isAdmin && !isOwner) {
            throw new RuntimeException("Access denied. You do not have authorization to access this verification document.");
        }

        String fileRef;
        String normType = (docType != null ? docType.toLowerCase().trim() : "member-proof");
        if (normType.equals("gov-id-1") || normType.equals("govid1") || normType.equals("government-id-1")) {
            fileRef = verification.getGovernmentId1FileReference();
            if (fileRef == null || fileRef.isBlank()) {
                throw new RuntimeException("Government ID 1 document not found for this verification record.");
            }
        } else if (normType.equals("gov-id-2") || normType.equals("govid2") || normType.equals("government-id-2")) {
            fileRef = verification.getGovernmentId2FileReference();
            if (fileRef == null || fileRef.isBlank()) {
                throw new RuntimeException("Government ID 2 document not found for this verification record.");
            }
        } else {
            fileRef = verification.getMemberProofFileReference();
            if (fileRef == null || fileRef.isBlank()) {
                throw new RuntimeException("Member proof PDF document not found for this verification record.");
            }
        }

        return fileStorageService.loadAsResource(fileRef);
    }

    private AssignmentCreatorVerificationDto mapToDto(AssignmentCreatorVerification v) {
        AssignmentCreatorVerificationDto dto = new AssignmentCreatorVerificationDto();
        dto.setId(v.getId());
        if (v.getUser() != null) {
            dto.setUserId(v.getUser().getId());
        }
        dto.setUsername(v.getUsername());
        dto.setFullName(v.getFullName());
        dto.setContactEmail(v.getContactEmail());
        dto.setPhoneNumber(v.getPhoneNumber());
        dto.setOrganizationName(v.getOrganizationName());
        dto.setOrganizationId(v.getOrganizationId());
        dto.setOrganizationWebsite(v.getOrganizationWebsite());
        dto.setMaskedPan(v.getMaskedPan());
        dto.setMaskedAadhaar(v.getMaskedAadhaar());
        dto.setPan(v.getPan());
        dto.setAadhaar(v.getAadhaar());
        dto.setGovernmentId1FileReference(v.getGovernmentId1FileReference());
        dto.setGovernmentId2FileReference(v.getGovernmentId2FileReference());
        dto.setMemberProofFileReference(v.getMemberProofFileReference());

        String status = v.getStatus();
        if ("APPROVED".equalsIgnoreCase(status)) {
            status = "HOST_VERIFIED";
        }
        dto.setStatus(status);
        boolean isHostVerified = "HOST_VERIFIED".equalsIgnoreCase(status);
        dto.setApproved(isHostVerified);
        dto.setHostVerified(isHostVerified);
        dto.setOtpPending("OTP_PENDING".equalsIgnoreCase(status) || "ADMIN_APPROVED".equalsIgnoreCase(status));
        dto.setOtpLastSentAt(v.getOtpLastSentAt());

        dto.setSubmittedAt(v.getSubmittedAt());
        dto.setReviewedAt(v.getReviewedAt());
        dto.setReviewedBy(v.getReviewedBy());
        dto.setAdminComment(v.getAdminComment());
        return dto;
    }
}
