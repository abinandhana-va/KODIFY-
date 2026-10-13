package infosys.onlinecodeplate.service;

import infosys.onlinecodeplate.dto.AppDtos.CertificateDto;
import infosys.onlinecodeplate.dto.AppDtos.CertificateRequestDto;
import infosys.onlinecodeplate.dto.AppDtos.UserContestStatsDto;
import infosys.onlinecodeplate.entity.Certificate;
import infosys.onlinecodeplate.entity.Role;
import infosys.onlinecodeplate.entity.User;
import infosys.onlinecodeplate.entity.UserCertificate;
import infosys.onlinecodeplate.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class CertificateServiceTest {

    private CertificateRepository certificateRepo;
    private UserCertificateRepository userCertificateRepo;
    private UserSubmissionRepository submissionRepo;
    private ContestParticipantRepository contestParticipantRepo;
    private ContestRepository contestRepo;
    private ContestSubmissionRepository contestSubmissionRepo;
    private UserActivityRepository activityRepo;
    private AchievementService achievementService;
    private ActivityService activityService;
    private CertificateService certificateService;
    private User testUser;
    private Certificate cert5;
    private Certificate cert10;
    private Certificate cert20;

    @BeforeEach
    public void setUp() {
        certificateRepo = Mockito.mock(CertificateRepository.class);
        userCertificateRepo = Mockito.mock(UserCertificateRepository.class);
        submissionRepo = Mockito.mock(UserSubmissionRepository.class);
        contestParticipantRepo = Mockito.mock(ContestParticipantRepository.class);
        contestRepo = Mockito.mock(ContestRepository.class);
        activityRepo = Mockito.mock(UserActivityRepository.class);

        contestSubmissionRepo = Mockito.mock(ContestSubmissionRepository.class);

        achievementService = new AchievementService(submissionRepo, contestRepo, contestParticipantRepo, contestSubmissionRepo);
        activityService = new ActivityService(activityRepo);
        EmailService emailService = Mockito.mock(EmailService.class);

        certificateService = new CertificateService(certificateRepo, userCertificateRepo, achievementService, activityService, emailService);

        testUser = new User();
        testUser.setId(100L);
        testUser.setName("Test Coder");
        testUser.setUsername("testcoder");
        testUser.setEmail("coder@example.com");
        testUser.setRole(Role.USER);

        cert5 = new Certificate("Beginner Coder", "Complete 5 problems", "PROBLEMS_SOLVED", 5, true);
        cert5.setId(1L);

        cert10 = new Certificate("Problem Solver", "Complete 10 problems", "PROBLEMS_SOLVED", 10, true);
        cert10.setId(2L);

        cert20 = new Certificate("Advanced Coder", "Complete 20 problems", "PROBLEMS_SOLVED", 20, true);
        cert20.setId(3L);
    }

    @Test
    @DisplayName("Admin can create certificate and define target count")
    public void testAdminCreateCertificate() {
        CertificateRequestDto req = new CertificateRequestDto();
        req.setName("Coding Master");
        req.setDescription("Complete 15 coding problems");
        req.setAchievementType("PROBLEMS_SOLVED");
        req.setTarget(15);
        req.setEnabled(true);

        when(certificateRepo.existsByNameIgnoreCase("Coding Master")).thenReturn(false);
        when(certificateRepo.save(any(Certificate.class))).thenAnswer(invocation -> {
            Certificate c = invocation.getArgument(0);
            c.setId(10L);
            return c;
        });

        CertificateDto result = certificateService.createCertificate(req);

        assertNotNull(result);
        assertEquals(10L, result.getId());
        assertEquals("Coding Master", result.getName());
        assertEquals(15, result.getTarget());
        assertEquals("PROBLEMS_SOLVED", result.getAchievementType());
        verify(certificateRepo, times(1)).save(any(Certificate.class));
    }

    @Test
    @DisplayName("Admin can update certificate constraint from 5 to 10")
    public void testAdminUpdateCertificate() {
        when(certificateRepo.findById(1L)).thenReturn(Optional.of(cert5));
        when(certificateRepo.save(any(Certificate.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userCertificateRepo.countByCertificateId(1L)).thenReturn(0L);

        CertificateRequestDto updateReq = new CertificateRequestDto();
        updateReq.setName("Beginner Coder");
        updateReq.setDescription("Complete 10 problems");
        updateReq.setAchievementType("PROBLEMS_SOLVED");
        updateReq.setTarget(10);
        updateReq.setEnabled(true);

        CertificateDto updated = certificateService.updateCertificate(1L, updateReq);

        assertNotNull(updated);
        assertEquals(10, updated.getTarget());
        verify(certificateRepo, times(1)).save(any(Certificate.class));
    }

    @Test
    @DisplayName("User with 3 solved problems sees 3/5, 3/10, 3/20 all locked")
    public void testMultipleCertificatesAllLocked() {
        when(certificateRepo.findByEnabledTrueOrderByTargetAsc()).thenReturn(List.of(cert5, cert10, cert20));
        when(submissionRepo.countSolvedProblemsByUserId(100L, "ACCEPTED")).thenReturn(3L);
        when(userCertificateRepo.findByUserId(100L)).thenReturn(List.of());

        List<CertificateDto> certs = certificateService.getAllCertificatesForUser(testUser);

        assertEquals(3, certs.size());

        assertEquals("Beginner Coder", certs.get(0).getName());
        assertEquals(3, certs.get(0).getCurrentProgress());
        assertEquals(5, certs.get(0).getTarget());
        assertFalse(certs.get(0).isUnlocked());
        assertFalse(certs.get(0).isDownloadable());

        assertEquals("Problem Solver", certs.get(1).getName());
        assertEquals(3, certs.get(1).getCurrentProgress());
        assertEquals(10, certs.get(1).getTarget());
        assertFalse(certs.get(1).isUnlocked());

        assertEquals("Advanced Coder", certs.get(2).getName());
        assertEquals(3, certs.get(2).getCurrentProgress());
        assertEquals(20, certs.get(2).getTarget());
        assertFalse(certs.get(2).isUnlocked());
    }

    @Test
    @DisplayName("User with 5 solved problems sees 5/5 unlocked and 5/10, 5/20 locked")
    public void testMultipleCertificatesPartialUnlocked() {
        when(certificateRepo.findByEnabledTrueOrderByTargetAsc()).thenReturn(List.of(cert5, cert10, cert20));
        when(submissionRepo.countSolvedProblemsByUserId(100L, "ACCEPTED")).thenReturn(5L);
        when(userCertificateRepo.findByUserId(100L)).thenReturn(new ArrayList<>());

        List<CertificateDto> certs = certificateService.getAllCertificatesForUser(testUser);

        assertEquals(3, certs.size());

        // cert 5 is unlocked
        assertTrue(certs.get(0).isUnlocked());
        assertTrue(certs.get(0).isDownloadable());
        assertEquals(5, certs.get(0).getCurrentProgress());
        assertEquals(5, certs.get(0).getTarget());

        // cert 10 is locked
        assertFalse(certs.get(1).isUnlocked());
        assertFalse(certs.get(1).isDownloadable());
        assertEquals(5, certs.get(1).getCurrentProgress());
        assertEquals(10, certs.get(1).getTarget());

        // cert 20 is locked
        assertFalse(certs.get(2).isUnlocked());
        assertEquals(5, certs.get(2).getCurrentProgress());
        assertEquals(20, certs.get(2).getTarget());
    }

    @Test
    @DisplayName("Dynamic target change: Admin changes target 5 to 10 -> user with 7 solved sees 7/10 locked")
    public void testDynamicTargetChangeReflectedImmediately() {
        // User has 7 solved problems
        when(submissionRepo.countSolvedProblemsByUserId(100L, "ACCEPTED")).thenReturn(7L);

        // Certificate target updated from 5 to 10
        Certificate updatedCert = new Certificate("Beginner Coder", "Complete 10 problems", "PROBLEMS_SOLVED", 10, true);
        updatedCert.setId(1L);

        // Simulate a previously saved UserCertificate from when target was 5
        UserCertificate oldUc = new UserCertificate(testUser, updatedCert, LocalDateTime.now(), "KODIFY-CERT-1");
        List<UserCertificate> userCertsList = new ArrayList<>(List.of(oldUc));
        when(userCertificateRepo.findByUserId(100L)).thenReturn(userCertsList);
        when(certificateRepo.findByEnabledTrueOrderByTargetAsc()).thenReturn(List.of(updatedCert));

        List<CertificateDto> certs = certificateService.getAllCertificatesForUser(testUser);

        assertNotNull(certs);
        assertEquals(1, certs.size());
        assertEquals(7, certs.get(0).getCurrentProgress());
        assertEquals(10, certs.get(0).getTarget());
        assertFalse(certs.get(0).isUnlocked(), "7/10 should be LOCKED when target changed to 10");
        assertFalse(certs.get(0).isDownloadable());
    }

    @Test
    @DisplayName("Certificate download blocked before target count is reached")
    public void testDownloadBlockedBeforeTarget() {
        when(certificateRepo.findById(1L)).thenReturn(Optional.of(cert5));
        when(submissionRepo.countSolvedProblemsByUserId(100L, "ACCEPTED")).thenReturn(4L);

        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            certificateService.generateCertificatePdf(testUser, 1L);
        });

        assertTrue(ex.getMessage().contains("locked"));
    }

    @Test
    @DisplayName("Certificate download works after target is reached and generates valid PDF binary")
    public void testDownloadWorksAfterTarget() {
        when(certificateRepo.findById(1L)).thenReturn(Optional.of(cert5));
        when(submissionRepo.countSolvedProblemsByUserId(100L, "ACCEPTED")).thenReturn(5L);

        byte[] pdfBytes = certificateService.generateCertificatePdf(testUser, 1L);

        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 1000);
        String header = new String(pdfBytes, 0, Math.min(pdfBytes.length, 10), StandardCharsets.ISO_8859_1);
        assertTrue(header.startsWith("%PDF-"));
    }
}
