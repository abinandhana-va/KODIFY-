package infosys.onlinecodeplate.controller;

import infosys.onlinecodeplate.dto.AppDtos.AssignmentCreatorVerificationDto;
import infosys.onlinecodeplate.entity.User;
import infosys.onlinecodeplate.repository.UserRepository;
import infosys.onlinecodeplate.service.AssignmentCreatorVerificationService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class AssignmentCreatorVerificationController {

    private final AssignmentCreatorVerificationService verificationService;
    private final UserRepository userRepo;

    public AssignmentCreatorVerificationController(AssignmentCreatorVerificationService verificationService,
                                                   UserRepository userRepo) {
        this.verificationService = verificationService;
        this.userRepo = userRepo;
    }

    private User getAuthenticatedUser(Authentication auth) {
        if (auth == null || auth.getName() == null) {
            throw new RuntimeException("User not authenticated.");
        }
        return userRepo.findByEmailOrUsername(auth.getName(), auth.getName())
                .orElseThrow(() -> new RuntimeException("User identity not found: " + auth.getName()));
    }

    @PostMapping(value = {"/assignment-verifications", "/creator-verification/submit", "/host-verifications", "/host-verifications/submit"}, consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AssignmentCreatorVerificationDto> submitVerification(
            @RequestParam("fullName") String fullName,
            @RequestParam(value = "contactEmail", required = false) String contactEmail,
            @RequestParam(value = "email", required = false) String email,
            @RequestParam("phoneNumber") String phoneNumber,
            @RequestParam("organizationName") String organizationName,
            @RequestParam(value = "organizationId", required = false) String organizationId,
            @RequestParam(value = "orgId", required = false) String orgId,
            @RequestParam(value = "organizationWebsite", required = false) String organizationWebsite,
            @RequestParam(value = "website", required = false) String website,
            @RequestParam(value = "pan", required = false) String pan,
            @RequestParam(value = "aadhaar", required = false) String aadhaar,
            @RequestParam(value = "governmentId1", required = false) MultipartFile governmentId1,
            @RequestParam(value = "govId1", required = false) MultipartFile govId1,
            @RequestParam(value = "governmentId2", required = false) MultipartFile governmentId2,
            @RequestParam(value = "govId2", required = false) MultipartFile govId2,
            @RequestParam(value = "memberProof", required = false) MultipartFile memberProof,
            @RequestParam(value = "proofDocument", required = false) MultipartFile proofDocument,
            Authentication auth) {
        User user = getAuthenticatedUser(auth);
        String effEmail = (contactEmail != null && !contactEmail.isBlank()) ? contactEmail : (email != null ? email : user.getEmail());
        String effOrgId = (organizationId != null && !organizationId.isBlank()) ? organizationId : orgId;
        String effOrgWebsite = (organizationWebsite != null && !organizationWebsite.isBlank()) ? organizationWebsite : website;
        MultipartFile effMemberProof = (memberProof != null && !memberProof.isEmpty()) ? memberProof : proofDocument;
        MultipartFile effGovId1 = (governmentId1 != null && !governmentId1.isEmpty()) ? governmentId1 : govId1;
        MultipartFile effGovId2 = (governmentId2 != null && !governmentId2.isEmpty()) ? governmentId2 : govId2;

        AssignmentCreatorVerificationDto dto = verificationService.submitVerification(
                user, fullName, effEmail, phoneNumber, organizationName, effOrgId, effOrgWebsite, pan, aadhaar, effGovId1, effGovId2, effMemberProof
        );
        return ResponseEntity.ok(dto);
    }

    @PostMapping({"/host-verifications/verify-otp", "/creator-verification/verify-otp", "/assignment-verifications/verify-otp"})
    public ResponseEntity<AssignmentCreatorVerificationDto> verifyOtp(
            @RequestBody Map<String, String> body,
            @RequestParam(value = "otpCode", required = false) String paramOtp,
            Authentication auth) {
        User user = getAuthenticatedUser(auth);
        String otpCode = (paramOtp != null && !paramOtp.isBlank())
                ? paramOtp
                : (body != null ? (body.get("otpCode") != null ? body.get("otpCode") : body.get("otp")) : null);
        return ResponseEntity.ok(verificationService.verifyOtp(otpCode, user));
    }

    @PostMapping({"/host-verifications/resend-otp", "/creator-verification/resend-otp", "/assignment-verifications/resend-otp"})
    public ResponseEntity<AssignmentCreatorVerificationDto> resendOtp(Authentication auth) {
        User user = getAuthenticatedUser(auth);
        return ResponseEntity.ok(verificationService.resendOtp(user));
    }

    @GetMapping({"/assignment-verifications/my-status", "/creator-verification/status", "/host-verifications/my-status", "/host-verifications/status"})
    public ResponseEntity<AssignmentCreatorVerificationDto> getMyVerificationStatus(Authentication auth) {
        User user = (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName()))
                ? userRepo.findByEmailOrUsername(auth.getName(), auth.getName()).orElse(null)
                : null;
        return ResponseEntity.ok(verificationService.getUserVerificationStatus(user));
    }

    @GetMapping({"/admin/assignment-verifications", "/creator-verification/admin/list", "/admin/host-verifications"})
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<AssignmentCreatorVerificationDto>> getAllVerificationsForAdmin(Authentication auth) {
        User admin = getAuthenticatedUser(auth);
        return ResponseEntity.ok(verificationService.getAllVerificationsForAdmin(admin));
    }

    @PostMapping({"/admin/assignment-verifications/{id}/approve", "/creator-verification/admin/{id}/approve", "/admin/host-verifications/{id}/approve"})
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<AssignmentCreatorVerificationDto> approveVerification(@PathVariable Long id, Authentication auth) {
        User admin = getAuthenticatedUser(auth);
        return ResponseEntity.ok(verificationService.approveVerification(id, admin));
    }

    @PostMapping({"/admin/assignment-verifications/{id}/reject", "/creator-verification/admin/{id}/reject", "/admin/host-verifications/{id}/reject"})
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<AssignmentCreatorVerificationDto> rejectVerification(
            @PathVariable Long id,
            @RequestParam(value = "reason", required = false) String paramReason,
            @RequestBody(required = false) Map<String, String> body,
            Authentication auth) {
        User admin = getAuthenticatedUser(auth);
        String reason = (paramReason != null && !paramReason.isBlank()) ? paramReason : (body != null ? body.get("reason") : null);
        return ResponseEntity.ok(verificationService.rejectVerification(id, reason, admin));
    }

    @GetMapping({
            "/admin/assignment-verifications/{id}/member-proof",
            "/creator-verification/admin/{id}/document",
            "/admin/host-verifications/{id}/member-proof",
            "/admin/assignment-verifications/{id}/document/{docType}",
            "/creator-verification/admin/{id}/document/{docType}",
            "/admin/host-verifications/{id}/document/{docType}"
    })
    public ResponseEntity<Resource> getVerificationDocument(
            @PathVariable Long id,
            @PathVariable(value = "docType", required = false) String docType,
            Authentication auth) {
        User user = getAuthenticatedUser(auth);
        String effectiveDocType = (docType != null && !docType.isBlank()) ? docType : "member-proof";
        Resource resource = verificationService.getDocumentResource(id, effectiveDocType, user);

        MediaType mediaType = MediaType.APPLICATION_PDF;
        String filename = resource.getFilename() != null ? resource.getFilename().toLowerCase() : "";
        if (filename.endsWith(".png")) {
            mediaType = MediaType.IMAGE_PNG;
        } else if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) {
            mediaType = MediaType.IMAGE_JPEG;
        }

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + (resource.getFilename() != null ? resource.getFilename() : "verification_doc_" + id + ".pdf") + "\"")
                .body(resource);
    }
}
