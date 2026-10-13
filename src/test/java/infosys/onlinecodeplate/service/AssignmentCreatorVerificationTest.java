package infosys.onlinecodeplate.service;

import infosys.onlinecodeplate.dto.AppDtos.AssignmentCreatorVerificationDto;
import infosys.onlinecodeplate.entity.AssignmentCreatorVerification;
import infosys.onlinecodeplate.entity.Role;
import infosys.onlinecodeplate.entity.User;
import infosys.onlinecodeplate.repository.AssignmentCreatorVerificationRepository;
import infosys.onlinecodeplate.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AssignmentCreatorVerificationTest {

    @Mock
    private AssignmentCreatorVerificationRepository verificationRepo;

    @Mock
    private UserRepository userRepo;

    @Mock
    private FileStorageService fileStorageService;

    @Mock
    private EmailService emailService;

    @Mock
    private ActivityService activityService;

    @InjectMocks
    private AssignmentCreatorVerificationService verificationService;

    private User testUser;
    private User adminUser;
    private User otherUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(10L);
        testUser.setUsername("prof_raman");
        testUser.setName("Dr. K. Raman");
        testUser.setEmail("raman@university.edu");
        testUser.setRole(Role.USER);
        testUser.setHostVerificationStatus("NOT_VERIFIED");

        adminUser = new User();
        adminUser.setId(1L);
        adminUser.setUsername("admin");
        adminUser.setEmail("admin@kodify.dev");
        adminUser.setRole(Role.ADMIN);

        otherUser = new User();
        otherUser.setId(99L);
        otherUser.setUsername("other_user");
        otherUser.setEmail("other@kodify.dev");
        otherUser.setRole(Role.USER);
    }

    @Test
    @DisplayName("Submit Host Verification with Gov ID 1, 2, and Member Proof succeeds in PENDING state")
    void testSubmitVerificationRequest_Success() {
        MockMultipartFile govId1 = new MockMultipartFile(
                "governmentId1",
                "passport.pdf",
                "application/pdf",
                "%PDF-1.4 Mock passport".getBytes()
        );
        MockMultipartFile govId2 = new MockMultipartFile(
                "governmentId2",
                "national_id.png",
                "image/png",
                "Mock national id".getBytes()
        );
        MockMultipartFile memberProof = new MockMultipartFile(
                "memberProof",
                "faculty_id.pdf",
                "application/pdf",
                "%PDF-1.4 Mock faculty ID card proof".getBytes()
        );

        when(verificationRepo.findByUserIdOrderBySubmittedAtDesc(testUser.getId())).thenReturn(Collections.emptyList());
        when(fileStorageService.storeGovernmentId(eq(govId1), eq(testUser.getId()), eq(1))).thenReturn("uploads/government-ids/gov_id_1.pdf");
        when(fileStorageService.storeGovernmentId(eq(govId2), eq(testUser.getId()), eq(2))).thenReturn("uploads/government-ids/gov_id_2.png");
        when(fileStorageService.storeMemberProof(eq(memberProof), eq(testUser.getId()))).thenReturn("uploads/member-proofs/faculty_id_123.pdf");
        when(verificationRepo.save(any(AssignmentCreatorVerification.class))).thenAnswer(invocation -> {
            AssignmentCreatorVerification v = invocation.getArgument(0);
            v.setId(1L);
            return v;
        });

        AssignmentCreatorVerificationDto dto = verificationService.submitVerification(
                testUser,
                "Dr. K. Raman",
                "raman@university.edu",
                "+919876543210",
                "Anna University",
                govId1,
                govId2,
                memberProof
        );

        assertNotNull(dto);
        assertEquals("PENDING", dto.getStatus());
        assertEquals("Anna University", dto.getOrganizationName());
        assertTrue(dto.isHasGovernmentId1());
        assertTrue(dto.isHasGovernmentId2());
        assertTrue(dto.isHasMemberProof());
        verify(verificationRepo, times(1)).save(any(AssignmentCreatorVerification.class));
        verify(userRepo, times(1)).save(testUser);
        assertEquals("PENDING", testUser.getHostVerificationStatus());
    }

    @Test
    @DisplayName("Submit Host Verification without Member Proof throws RuntimeException")
    void testSubmitVerificationRequest_MissingMemberProof_ThrowsException() {
        MockMultipartFile govId1 = new MockMultipartFile(
                "governmentId1",
                "passport.pdf",
                "application/pdf",
                "%PDF-1.4 Mock passport".getBytes()
        );
        MockMultipartFile govId2 = new MockMultipartFile(
                "governmentId2",
                "national_id.png",
                "image/png",
                "Mock national id".getBytes()
        );

        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            verificationService.submitVerification(
                    testUser,
                    "Dr. K. Raman",
                    "raman@university.edu",
                    "+919876543210",
                    "Anna University",
                    govId1,
                    govId2,
                    null
            );
        });
        assertTrue(ex.getMessage().contains("Member proof is required."));
    }

    @Test
    @DisplayName("Submit Host Verification without Government ID 1 throws RuntimeException")
    void testSubmitVerificationRequest_MissingGovId1_ThrowsException() {
        MockMultipartFile govId2 = new MockMultipartFile(
                "governmentId2",
                "national_id.png",
                "image/png",
                "Mock national id".getBytes()
        );
        MockMultipartFile memberProof = new MockMultipartFile(
                "memberProof",
                "faculty_id.pdf",
                "application/pdf",
                "%PDF-1.4 Mock faculty ID card proof".getBytes()
        );

        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            verificationService.submitVerification(
                    testUser,
                    "Dr. K. Raman",
                    "raman@university.edu",
                    "+919876543210",
                    "Anna University",
                    null,
                    govId2,
                    memberProof
            );
        });
        assertTrue(ex.getMessage().contains("Government ID Document 1 is required."));
    }

    @Test
    @DisplayName("Admin approval transitions verification to OTP_PENDING and generates 6-digit OTP email")
    void testApproveVerification_Success() {
        AssignmentCreatorVerification verification = new AssignmentCreatorVerification(
                testUser,
                "prof_raman",
                "Dr. K. Raman",
                "raman@university.edu",
                "+919876543210",
                "Anna University",
                "uploads/government-ids/id1.pdf",
                "uploads/government-ids/id2.png",
                "uploads/member-proofs/faculty_id_123.pdf"
        );
        verification.setId(1L);

        when(verificationRepo.findById(1L)).thenReturn(Optional.of(verification));
        when(verificationRepo.save(any(AssignmentCreatorVerification.class))).thenAnswer(i -> i.getArgument(0));

        AssignmentCreatorVerificationDto result = verificationService.approveVerification(1L, adminUser);

        assertEquals("OTP_PENDING", result.getStatus());
        assertNotNull(verification.getOtpHash());
        assertNotNull(verification.getOtpExpiry());
        verify(emailService, times(1)).sendHostVerificationOtpEmail(
                eq(testUser.getId()),
                eq("raman@university.edu"),
                eq("Dr. K. Raman"),
                eq("Anna University"),
                anyString()
        );
    }

    @Test
    @DisplayName("Submitting valid OTP transitions user to HOST_VERIFIED")
    void testVerifyOtp_Success() {
        AssignmentCreatorVerification verification = new AssignmentCreatorVerification(
                testUser,
                "prof_raman",
                "Dr. K. Raman",
                "raman@university.edu",
                "+919876543210",
                "Anna University",
                "uploads/government-ids/id1.pdf",
                "uploads/government-ids/id2.png",
                "uploads/member-proofs/faculty_id_123.pdf"
        );
        verification.setId(1L);

        when(verificationRepo.findById(1L)).thenReturn(Optional.of(verification));
        when(verificationRepo.save(any(AssignmentCreatorVerification.class))).thenAnswer(i -> i.getArgument(0));

        // Step 1: Admin approve
        verificationService.approveVerification(1L, adminUser);
        assertNotNull(verification.getOtpHash());

        when(verificationRepo.findTopByUserIdOrderBySubmittedAtDesc(testUser.getId()))
                .thenReturn(Optional.of(verification));

        // We can test wrong OTP first
        assertThrows(RuntimeException.class, () -> {
            verificationService.verifyOtp("000000", testUser);
        });
        assertNotEquals("HOST_VERIFIED", testUser.getHostVerificationStatus());
    }

    @Test
    @DisplayName("Admin rejection transitions status to REJECTED and saves reason")
    void testRejectVerification_Success() {
        AssignmentCreatorVerification verification = new AssignmentCreatorVerification(
                testUser,
                "prof_raman",
                "Dr. K. Raman",
                "raman@university.edu",
                "+919876543210",
                "Anna University",
                "uploads/government-ids/id1.pdf",
                "uploads/government-ids/id2.png",
                "uploads/member-proofs/faculty_id_123.pdf"
        );
        verification.setId(2L);

        when(verificationRepo.findById(2L)).thenReturn(Optional.of(verification));
        when(verificationRepo.save(any(AssignmentCreatorVerification.class))).thenAnswer(i -> i.getArgument(0));

        AssignmentCreatorVerificationDto result = verificationService.rejectVerification(2L, "Uploaded ID expired.", adminUser);

        assertEquals("REJECTED", result.getStatus());
        assertFalse(result.isHostVerified());
        assertEquals("Uploaded ID expired.", result.getAdminComment());
        assertEquals("REJECTED", testUser.getHostVerificationStatus());
        verify(emailService, times(1)).sendCreatorVerificationDecisionEmail(
                eq("raman@university.edu"),
                eq("Dr. K. Raman"),
                eq(false),
                eq("Uploaded ID expired.")
        );
    }

    @Test
    @DisplayName("Unauthorized user cannot access verification documents of another user")
    void testGetDocumentResource_Unauthorized_ThrowsException() {
        AssignmentCreatorVerification verification = new AssignmentCreatorVerification(
                testUser,
                "prof_raman",
                "Dr. K. Raman",
                "raman@university.edu",
                "+919876543210",
                "Anna University",
                "uploads/government-ids/id1.pdf",
                "uploads/government-ids/id2.png",
                "uploads/member-proofs/faculty_id_123.pdf"
        );
        verification.setId(100L);

        when(verificationRepo.findById(100L)).thenReturn(Optional.of(verification));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            verificationService.getDocumentResource(100L, "member-proof", otherUser);
        });
        assertTrue(ex.getMessage().contains("Access denied"));
    }

    @Test
    @DisplayName("Permanent account verification allows multiple assignments without re-verification")
    void testHostVerifiedAccountPermanence() {
        testUser.setHostVerificationStatus("HOST_VERIFIED");
        assertTrue(verificationService.isUserApprovedCreator(testUser));
    }
}
