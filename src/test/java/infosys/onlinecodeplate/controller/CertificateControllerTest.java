package infosys.onlinecodeplate.controller;

import infosys.onlinecodeplate.dto.AppDtos.CertificateDto;
import infosys.onlinecodeplate.dto.AppDtos.CertificateRequestDto;
import infosys.onlinecodeplate.entity.Certificate;
import infosys.onlinecodeplate.entity.Role;
import infosys.onlinecodeplate.entity.User;
import infosys.onlinecodeplate.repository.CertificateRepository;
import infosys.onlinecodeplate.repository.UserCertificateRepository;
import infosys.onlinecodeplate.repository.UserRepository;
import infosys.onlinecodeplate.repository.UserSubmissionRepository;
import infosys.onlinecodeplate.service.AchievementService;
import infosys.onlinecodeplate.service.ActivityService;
import infosys.onlinecodeplate.service.CertificateService;
import infosys.onlinecodeplate.service.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

public class CertificateControllerTest {

    private CertificateRepository certificateRepo;
    private UserCertificateRepository userCertificateRepo;
    private UserRepository userRepository;
    private UserSubmissionRepository submissionRepo;
    private CertificateService certificateService;
    private CertificateController certificateController;
    private AdminCertificateController adminCertificateController;

    private User testUser;
    private Authentication auth;
    private Certificate cert1;

    @BeforeEach
    public void setUp() {
        certificateRepo = Mockito.mock(CertificateRepository.class);
        userCertificateRepo = Mockito.mock(UserCertificateRepository.class);
        userRepository = Mockito.mock(UserRepository.class);
        submissionRepo = Mockito.mock(UserSubmissionRepository.class);
        AchievementService achievementService = new AchievementService(submissionRepo, Mockito.mock(infosys.onlinecodeplate.repository.ContestRepository.class), Mockito.mock(infosys.onlinecodeplate.repository.ContestParticipantRepository.class), Mockito.mock(infosys.onlinecodeplate.repository.ContestSubmissionRepository.class));
        ActivityService activityService = new ActivityService(Mockito.mock(infosys.onlinecodeplate.repository.UserActivityRepository.class));
        EmailService emailService = Mockito.mock(EmailService.class);

        certificateService = new CertificateService(certificateRepo, userCertificateRepo, achievementService, activityService, emailService);
        certificateController = new CertificateController(certificateService, userRepository);
        adminCertificateController = new AdminCertificateController(certificateService);

        testUser = new User();
        testUser.setId(10L);
        testUser.setUsername("alice");
        testUser.setEmail("alice@test.com");
        testUser.setName("Alice");
        testUser.setRole(Role.USER);

        cert1 = new Certificate("Starter Cert", "Complete 5 problems", "PROBLEMS_SOLVED", 5, true);
        cert1.setId(1L);

        auth = new org.springframework.security.authentication.UsernamePasswordAuthenticationToken("alice", "password");
        when(userRepository.findByEmailOrUsername("alice", "alice")).thenReturn(Optional.of(testUser));
    }

    @Test
    @DisplayName("User can fetch certificates with accurate targets and progress")
    public void testGetMyCertificates() {
        when(certificateRepo.findByEnabledTrueOrderByTargetAsc()).thenReturn(List.of(cert1));
        when(submissionRepo.countSolvedProblemsByUserId(10L, "ACCEPTED")).thenReturn(3L);
        when(userCertificateRepo.findByUserId(10L)).thenReturn(List.of());

        ResponseEntity<List<CertificateDto>> response = certificateController.getMyCertificates(auth);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().size());

        CertificateDto dto = response.getBody().get(0);
        assertEquals("Starter Cert", dto.getName());
        assertEquals(5, dto.getTarget());
        assertEquals(3, dto.getCurrentProgress());
        assertFalse(dto.isUnlocked());
        assertFalse(dto.isDownloadable());
    }

    @Test
    @DisplayName("Admin create certificate API returns 200 and persisted entity DTO")
    public void testAdminCreateCertificateApi() {
        CertificateRequestDto req = new CertificateRequestDto();
        req.setName("New Cert");
        req.setDescription("Solve 8 problems");
        req.setAchievementType("PROBLEMS_SOLVED");
        req.setTarget(8);
        req.setEnabled(true);

        when(certificateRepo.existsByNameIgnoreCase("New Cert")).thenReturn(false);
        when(certificateRepo.save(any(Certificate.class))).thenAnswer(inv -> {
            Certificate c = inv.getArgument(0);
            c.setId(20L);
            return c;
        });

        ResponseEntity<?> response = adminCertificateController.createCertificate(req);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody() instanceof CertificateDto);
        CertificateDto dto = (CertificateDto) response.getBody();
        assertEquals("New Cert", dto.getName());
        assertEquals(8, dto.getTarget());
    }
}
