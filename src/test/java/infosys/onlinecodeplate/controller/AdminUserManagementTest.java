package infosys.onlinecodeplate.controller;

import infosys.onlinecodeplate.dto.AppDtos.UserContestStatsDto;
import infosys.onlinecodeplate.dto.Dtos.*;
import infosys.onlinecodeplate.entity.*;
import infosys.onlinecodeplate.repository.*;
import infosys.onlinecodeplate.service.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

public class AdminUserManagementTest {

    private UserRepository userRepository;
    private AuthService authService;
    private ProblemRepository problemRepo;
    private UserSubmissionRepository submissionRepo;
    private AchievementService achievementService;
    private BadgeService badgeService;
    private CertificateService certificateService;
    private ActivityService activityService;
    private AssignmentUserRepository assignmentUserRepo;
    private AssignmentAttemptRepository assignmentAttemptRepo;
    private AssignmentCreatorVerificationRepository verificationRepo;
    private AssignmentRepository assignmentRepo;
    private ContestRepository contestRepo;
    private ContestParticipantRepository contestParticipantRepo;
    private ContestSubmissionRepository contestSubmissionRepo;
    private ExamRecordingRepository examRecordingRepo;
    private IntegrityEventRepository integrityEventRepo;
    private TestCaseResultRepository testCaseResultRepo;
    private UserActivityRepository userActivityRepo;
    private UserBadgeRepository userBadgeRepo;
    private UserCertificateRepository userCertificateRepo;
    private AdminAnalyticsService adminAnalyticsService;

    private AdminController adminController;
    private Authentication adminAuth;

    private User adminUser;
    private User targetUser;

    @BeforeEach
    public void setUp() {
        userRepository = mock(UserRepository.class);
        authService = mock(AuthService.class);
        problemRepo = mock(ProblemRepository.class);
        submissionRepo = mock(UserSubmissionRepository.class);
        achievementService = mock(AchievementService.class);
        badgeService = mock(BadgeService.class);
        certificateService = mock(CertificateService.class);
        activityService = mock(ActivityService.class);
        assignmentUserRepo = mock(AssignmentUserRepository.class);
        assignmentAttemptRepo = mock(AssignmentAttemptRepository.class);
        verificationRepo = mock(AssignmentCreatorVerificationRepository.class);
        assignmentRepo = mock(AssignmentRepository.class);
        contestRepo = mock(ContestRepository.class);
        contestParticipantRepo = mock(ContestParticipantRepository.class);
        contestSubmissionRepo = mock(ContestSubmissionRepository.class);
        examRecordingRepo = mock(ExamRecordingRepository.class);
        integrityEventRepo = mock(IntegrityEventRepository.class);
        testCaseResultRepo = mock(TestCaseResultRepository.class);
        userActivityRepo = mock(UserActivityRepository.class);
        userBadgeRepo = mock(UserBadgeRepository.class);
        userCertificateRepo = mock(UserCertificateRepository.class);
        adminAnalyticsService = mock(AdminAnalyticsService.class);

        adminAuth = mock(Authentication.class);
        when(adminAuth.getName()).thenReturn("admin@123");

        adminController = new AdminController(
                userRepository, authService, problemRepo, submissionRepo,
                achievementService, badgeService, certificateService, activityService,
                assignmentUserRepo, assignmentAttemptRepo, verificationRepo, assignmentRepo,
                contestRepo, contestParticipantRepo, contestSubmissionRepo, examRecordingRepo,
                integrityEventRepo, testCaseResultRepo, userActivityRepo, userBadgeRepo, userCertificateRepo,
                adminAnalyticsService
        );

        adminUser = new User();
        adminUser.setId(1L);
        adminUser.setName("Admin User");
        adminUser.setUsername("admin@123");
        adminUser.setEmail("admin@123");
        adminUser.setRole(Role.ADMIN);
        adminUser.setStatus("ACTIVE");

        targetUser = new User();
        targetUser.setId(2L);
        targetUser.setName("Target Student");
        targetUser.setUsername("targetstudent");
        targetUser.setEmail("target@student.edu");
        targetUser.setRole(Role.USER);
        targetUser.setStatus("ACTIVE");
    }

    @Test
    @DisplayName("Admin can view list of users")
    public void testGetAllUsers() {
        when(userRepository.findAll()).thenReturn(List.of(adminUser, targetUser));
        when(authService.mapToDto(any(User.class))).thenAnswer(i -> {
            User u = i.getArgument(0);
            UserDto dto = new UserDto();
            dto.setId(u.getId());
            dto.setName(u.getName());
            dto.setUsername(u.getUsername());
            dto.setEmail(u.getEmail());
            dto.setRole(u.getRole().name());
            dto.setStatus(u.getStatus());
            return dto;
        });

        ResponseEntity<List<UserDto>> response = adminController.getAllUsers();
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(2, response.getBody().size());
        assertEquals("targetstudent", response.getBody().get(1).getUsername());
    }

    @Test
    @DisplayName("Admin can view detailed user profile DTO with real metrics")
    public void testGetUserProfile() {
        when(userRepository.findById(2L)).thenReturn(Optional.of(targetUser));
        when(achievementService.countUniqueSolvedProblems(2L)).thenReturn(17L);
        when(submissionRepo.countSolvedProblemsByUserIdAndDifficulty(2L, "ACCEPTED", "EASY")).thenReturn(10L);
        when(submissionRepo.countSolvedProblemsByUserIdAndDifficulty(2L, "ACCEPTED", "MEDIUM")).thenReturn(5L);
        when(submissionRepo.countSolvedProblemsByUserIdAndDifficulty(2L, "ACCEPTED", "HARD")).thenReturn(2L);

        UserContestStatsDto contestStats = new UserContestStatsDto();
        contestStats.setParticipatedCount(3);
        contestStats.setWinsCount(1);
        contestStats.setCurrentStreak(2);
        when(achievementService.getUserContestStats(2L)).thenReturn(contestStats);

        when(badgeService.getAllBadgesForUser(targetUser)).thenReturn(Collections.emptyList());
        when(certificateService.getAllCertificatesForUser(targetUser)).thenReturn(Collections.emptyList());
        when(submissionRepo.findByUserIdOrderByCreatedAtDesc(2L)).thenReturn(Collections.emptyList());
        when(assignmentUserRepo.findByUserId(2L)).thenReturn(Collections.emptyList());

        ResponseEntity<?> response = adminController.getUserProfile(2L);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody() instanceof AdminUserProfileDto);

        AdminUserProfileDto profile = (AdminUserProfileDto) response.getBody();
        assertEquals("Target Student", profile.getName());
        assertEquals(17L, profile.getSolvedCount());
        assertEquals(10L, profile.getEasySolved());
        assertEquals(5L, profile.getMediumSolved());
        assertEquals(2L, profile.getHardSolved());
        assertEquals(3, profile.getContestsParticipated());
        assertEquals(2, profile.getCurrentStreak());
    }

    @Test
    @DisplayName("Admin can block a normal user")
    public void testBlockUser() {
        when(userRepository.findById(2L)).thenReturn(Optional.of(targetUser));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));
        when(authService.mapToDto(any(User.class))).thenAnswer(i -> {
            User u = i.getArgument(0);
            UserDto dto = new UserDto();
            dto.setId(u.getId());
            dto.setStatus(u.getStatus());
            return dto;
        });

        UserStatusUpdateRequest req = new UserStatusUpdateRequest();
        req.setStatus("BLOCKED");

        ResponseEntity<?> response = adminController.updateUserStatus(2L, req, adminAuth);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("BLOCKED", targetUser.getStatus());
        verify(activityService).logActivity(eq(targetUser), eq("Status Changed"), contains("BLOCKED"));
    }

    @Test
    @DisplayName("Admin can unblock a blocked user")
    public void testUnblockUser() {
        targetUser.setStatus("BLOCKED");
        when(userRepository.findById(2L)).thenReturn(Optional.of(targetUser));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));
        when(authService.mapToDto(any(User.class))).thenAnswer(i -> {
            User u = i.getArgument(0);
            UserDto dto = new UserDto();
            dto.setId(u.getId());
            dto.setStatus(u.getStatus());
            return dto;
        });

        UserStatusUpdateRequest req = new UserStatusUpdateRequest();
        req.setStatus("ACTIVE");

        ResponseEntity<?> response = adminController.updateUserStatus(2L, req, adminAuth);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("ACTIVE", targetUser.getStatus());
        verify(activityService).logActivity(eq(targetUser), eq("Status Changed"), contains("ACTIVE"));
    }

    @Test
    @DisplayName("Admin cannot block administrator account or self")
    public void testAdminSelfProtectionBlock() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));

        UserStatusUpdateRequest req = new UserStatusUpdateRequest();
        req.setStatus("BLOCKED");

        ResponseEntity<?> response = adminController.updateUserStatus(1L, req, adminAuth);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertTrue(response.getBody() instanceof Map);
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertTrue(body.get("message").toString().contains("Cannot modify the status of an administrator account"));
    }

    @Test
    @DisplayName("Admin can delete normal user with relationship cleanup")
    public void testDeleteUser() {
        when(userRepository.findById(2L)).thenReturn(Optional.of(targetUser));
        when(userRepository.findByEmail("admin@123")).thenReturn(Optional.of(adminUser));

        ResponseEntity<?> response = adminController.deleteUser(2L, adminAuth);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody() instanceof Map);

        verify(submissionRepo).deleteAll(anyList());
        verify(userRepository).delete(targetUser);
    }

    @Test
    @DisplayName("Admin cannot delete administrator account")
    public void testAdminSelfProtectionDelete() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));

        ResponseEntity<?> response = adminController.deleteUser(1L, adminAuth);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertTrue(response.getBody() instanceof Map);
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertTrue(body.get("message").toString().contains("Cannot delete an administrator account"));
    }
}
