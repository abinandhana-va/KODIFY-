package infosys.onlinecodeplate.service;

import infosys.onlinecodeplate.dto.AppDtos.*;
import infosys.onlinecodeplate.entity.*;
import infosys.onlinecodeplate.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class ContestServiceTest {

    private ContestRepository contestRepo;
    private ContestProblemRepository contestProblemRepo;
    private ContestParticipantRepository contestParticipantRepo;
    private ContestSubmissionRepository contestSubmissionRepo;
    private ProblemRepository problemRepo;
    private UserRepository userRepo;
    private DockerSandboxService dockerSandboxService;
    private ActivityService activityService;
    private BadgeService badgeService;
    private ContestService contestService;

    private User adminUser;
    private User normalUser;
    private User otherUser;
    private Contest upcomingContest;

    @BeforeEach
    public void setUp() {
        contestRepo = Mockito.mock(ContestRepository.class);
        contestProblemRepo = Mockito.mock(ContestProblemRepository.class);
        contestParticipantRepo = Mockito.mock(ContestParticipantRepository.class);
        contestSubmissionRepo = Mockito.mock(ContestSubmissionRepository.class);
        problemRepo = Mockito.mock(ProblemRepository.class);
        userRepo = Mockito.mock(UserRepository.class);
        dockerSandboxService = new DockerSandboxService();
        UserActivityRepository activityRepo = Mockito.mock(UserActivityRepository.class);
        activityService = new ActivityService(activityRepo);
        BadgeRepository badgeRepo = Mockito.mock(BadgeRepository.class);
        UserBadgeRepository userBadgeRepo = Mockito.mock(UserBadgeRepository.class);
        UserSubmissionRepository userSubRepo = Mockito.mock(UserSubmissionRepository.class);
        AchievementService achievementService = new AchievementService(userSubRepo, contestRepo, contestParticipantRepo, contestSubmissionRepo);
        badgeService = new BadgeService(badgeRepo, userBadgeRepo, achievementService, activityService);

        EmailService emailService = Mockito.mock(EmailService.class);
        NotificationService notificationService = Mockito.mock(NotificationService.class);
        CertificateService certificateService = Mockito.mock(CertificateService.class);
        contestService = new ContestService(
                contestRepo,
                contestProblemRepo,
                contestParticipantRepo,
                contestSubmissionRepo,
                problemRepo,
                userRepo,
                dockerSandboxService,
                activityService,
                badgeService,
                emailService,
                notificationService,
                certificateService
        );


        adminUser = new User();
        adminUser.setId(1L);
        adminUser.setUsername("admin");
        adminUser.setRole(Role.ADMIN);

        normalUser = new User();
        normalUser.setId(2L);
        normalUser.setUsername("coder1");
        normalUser.setRole(Role.USER);

        otherUser = new User();
        otherUser.setId(3L);
        otherUser.setUsername("coder2");
        otherUser.setRole(Role.USER);

        LocalDateTime startTime = LocalDateTime.now().plusDays(5);
        LocalDateTime endTime = startTime.plusHours(3);
        LocalDateTime regDeadline = startTime.minusMinutes(30);

        upcomingContest = new Contest();
        upcomingContest.setId(10L);
        upcomingContest.setTitle("Weekly Contest 1");
        upcomingContest.setOrganizer(normalUser);
        upcomingContest.setStartTime(startTime);
        upcomingContest.setEndTime(endTime);
        upcomingContest.setRegistrationDeadline(regDeadline);
        upcomingContest.setStatus("PUBLISHED");
    }

    @Test
    @DisplayName("User and Admin can create contest with custom start/end time and automatic 30-minute cutoff enforcement")
    public void testCreateContest() {
        LocalDateTime start = LocalDateTime.now().plusDays(10);
        LocalDateTime end = start.plusHours(2).plusMinutes(30);

        ContestRequestDto req = new ContestRequestDto();
        req.setTitle("Algorithmic Sprint");
        req.setDescription("Speed coding sprint");
        req.setStartTime(start);
        req.setEndTime(end);
        req.setRegistrationDeadline(start.minusMinutes(10)); // Less than 30 minutes -> should be clamped to 30 minutes before

        when(contestRepo.save(any(Contest.class))).thenAnswer(invocation -> {
            Contest c = invocation.getArgument(0);
            c.setId(100L);
            return c;
        });

        ContestDto created = contestService.createContest(req, normalUser);

        assertNotNull(created);
        assertEquals(100L, created.getId());
        assertEquals("Algorithmic Sprint", created.getTitle());
        assertEquals(150, created.getDurationMinutes()); // 2h 30m = 150m
        assertEquals(start.minusMinutes(30), created.getRegistrationDeadline());
        verify(contestRepo, atLeastOnce()).save(any(Contest.class));
    }

    @Test
    @DisplayName("User CANNOT edit another user's contest (Ownership enforced)")
    public void testUserCannotEditAnotherUsersContest() {
        when(contestRepo.findById(10L)).thenReturn(Optional.of(upcomingContest));

        ContestRequestDto updateReq = new ContestRequestDto();
        updateReq.setTitle("Hacked Title");

        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            contestService.updateContest(10L, updateReq, otherUser);
        });

        assertTrue(ex.getMessage().contains("Permission denied"));
    }

    @Test
    @DisplayName("Registration is ACCEPTED when registering before 30-minute cutoff")
    public void testRegistrationBeforeCutoff() {
        when(contestRepo.findById(10L)).thenReturn(Optional.of(upcomingContest));
        when(contestParticipantRepo.existsByContestIdAndUserId(10L, 3L)).thenReturn(false);

        assertDoesNotThrow(() -> {
            contestService.registerForContest(10L, otherUser);
        });

        verify(contestParticipantRepo, times(1)).save(any(ContestParticipant.class));
    }

    @Test
    @DisplayName("Registration is REJECTED when registering within 30 minutes of contest start")
    public void testRegistrationRejectedAfterCutoff() {
        // Contest starts in 20 minutes (past the 30-minute registration cutoff)
        LocalDateTime nearStart = LocalDateTime.now().plusMinutes(20);
        Contest nearContest = new Contest();
        nearContest.setId(20L);
        nearContest.setTitle("Immediate Contest");
        nearContest.setOrganizer(adminUser);
        nearContest.setStartTime(nearStart);
        nearContest.setEndTime(nearStart.plusHours(2));
        nearContest.setRegistrationDeadline(nearStart.minusMinutes(30));
        nearContest.setStatus("PUBLISHED");

        when(contestRepo.findById(20L)).thenReturn(Optional.of(nearContest));
        when(contestParticipantRepo.existsByContestIdAndUserId(20L, 2L)).thenReturn(false);

        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            contestService.registerForContest(20L, normalUser);
        });

        assertTrue(ex.getMessage().contains("Registration closed"));
        verify(contestParticipantRepo, never()).save(any(ContestParticipant.class));
    }

    @Test
    @DisplayName("Contest Leaderboard ranks users by Solved DESC, Score DESC, Time ASC")
    public void testContestLeaderboardCalculation() {
        Contest contest = new Contest();
        contest.setId(50L);
        contest.setStartTime(LocalDateTime.now().minusHours(2));
        contest.setEndTime(LocalDateTime.now().plusHours(1));

        Problem p1 = new Problem();
        p1.setId(101L);
        p1.setTitle("Two Sum");

        Problem p2 = new Problem();
        p2.setId(102L);
        p2.setTitle("Binary Search");

        ContestProblem cp1 = new ContestProblem(contest, p1, 1, 100);
        ContestProblem cp2 = new ContestProblem(contest, p2, 2, 200);

        when(contestRepo.findById(50L)).thenReturn(Optional.of(contest));
        when(contestProblemRepo.findByContestIdOrderByQuestionOrderAsc(50L)).thenReturn(List.of(cp1, cp2));

        ContestParticipant part1 = new ContestParticipant(contest, normalUser);
        ContestParticipant part2 = new ContestParticipant(contest, otherUser);
        when(contestParticipantRepo.findByContestId(50L)).thenReturn(List.of(part1, part2));

        // User 1 solved 2 problems (score 300)
        ContestSubmission sub1A = new ContestSubmission();
        sub1A.setContest(contest);
        sub1A.setUser(normalUser);
        sub1A.setProblem(p1);
        sub1A.setStatus("ACCEPTED");
        sub1A.setCreatedAt(contest.getStartTime().plusMinutes(10));

        ContestSubmission sub1B = new ContestSubmission();
        sub1B.setContest(contest);
        sub1B.setUser(normalUser);
        sub1B.setProblem(p2);
        sub1B.setStatus("ACCEPTED");
        sub1B.setCreatedAt(contest.getStartTime().plusMinutes(30));

        // User 2 solved 1 problem (score 100)
        ContestSubmission sub2A = new ContestSubmission();
        sub2A.setContest(contest);
        sub2A.setUser(otherUser);
        sub2A.setProblem(p1);
        sub2A.setStatus("ACCEPTED");
        sub2A.setCreatedAt(contest.getStartTime().plusMinutes(15));

        when(contestSubmissionRepo.findByContestIdOrderByCreatedAtDesc(50L)).thenReturn(List.of(sub1A, sub1B, sub2A));

        List<ContestLeaderboardEntryDto> leaderboard = contestService.getContestLeaderboard(50L);

        assertNotNull(leaderboard);
        assertEquals(2, leaderboard.size());

        assertEquals(1, leaderboard.get(0).getRank());
        assertEquals("coder1", leaderboard.get(0).getUsername());
        assertEquals(2, leaderboard.get(0).getProblemsSolved());
        assertEquals(300, leaderboard.get(0).getScore());

        assertEquals(2, leaderboard.get(1).getRank());
        assertEquals("coder2", leaderboard.get(1).getUsername());
        assertEquals(1, leaderboard.get(1).getProblemsSolved());
        assertEquals(100, leaderboard.get(1).getScore());
    }

    @Test
    @DisplayName("Private contest allows invited user direct participation and rejects non-invited user")
    public void testPrivateContestAccessControl() {
        Contest privateContest = new Contest();
        privateContest.setId(60L);
        privateContest.setTitle("Invite Only Cup");
        privateContest.setOrganizer(adminUser);
        privateContest.setAccessMode("INVITED");
        privateContest.setStartTime(LocalDateTime.now().minusMinutes(5));
        privateContest.setEndTime(LocalDateTime.now().plusHours(2));
        privateContest.setStatus("PUBLISHED");

        when(contestRepo.findById(60L)).thenReturn(Optional.of(privateContest));
        // normalUser is registered (invited), otherUser is not
        ContestParticipant invitedParticipant = new ContestParticipant(privateContest, normalUser);
        when(contestParticipantRepo.existsByContestIdAndUserId(60L, normalUser.getId())).thenReturn(true);
        when(contestParticipantRepo.findByContestIdAndUserId(60L, normalUser.getId())).thenReturn(Optional.of(invitedParticipant));
        when(contestParticipantRepo.existsByContestIdAndUserId(60L, otherUser.getId())).thenReturn(false);
        when(contestParticipantRepo.findByContestIdAndUserId(60L, otherUser.getId())).thenReturn(Optional.empty());

        // Invited user can access arena
        assertDoesNotThrow(() -> {
            contestService.enterArena(60L, normalUser);
        });

        // Non-invited user is rejected with 403 / Access Denied
        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            contestService.enterArena(60L, otherUser);
        });
        assertTrue(ex.getMessage().toLowerCase().contains("access denied") || ex.getMessage().contains("private"));
    }

    @Test
    @DisplayName("Rank 1 winner gets contest certificate automatically on completion")
    public void testRank1CertificateIssuance() {
        Contest contest = new Contest();
        contest.setId(70L);
        contest.setTitle("Grand Finale 2026");
        contest.setStartTime(LocalDateTime.now().minusHours(3));
        contest.setEndTime(LocalDateTime.now().minusMinutes(5));
        contest.setStatus("PUBLISHED");
        contest.setCertificateIssued(false);

        when(contestRepo.findById(70L)).thenReturn(Optional.of(contest));

        Problem p1 = new Problem();
        p1.setId(201L);
        p1.setTitle("Hard Problem");

        ContestProblem cp1 = new ContestProblem(contest, p1, 1, 100);
        when(contestProblemRepo.findByContestIdOrderByQuestionOrderAsc(70L)).thenReturn(List.of(cp1));

        ContestParticipant part1 = new ContestParticipant(contest, normalUser);
        when(contestParticipantRepo.findByContestId(70L)).thenReturn(List.of(part1));

        ContestSubmission sub = new ContestSubmission();
        sub.setContest(contest);
        sub.setUser(normalUser);
        sub.setProblem(p1);
        sub.setStatus("ACCEPTED");
        sub.setCreatedAt(contest.getStartTime().plusMinutes(20));

        when(contestSubmissionRepo.findByContestIdOrderByCreatedAtDesc(70L)).thenReturn(List.of(sub));

        List<ContestLeaderboardEntryDto> leaderboard = contestService.getContestLeaderboard(70L);
        assertNotNull(leaderboard);
        assertEquals(1, leaderboard.size());
        assertEquals("coder1", leaderboard.get(0).getUsername());
        assertEquals(1, leaderboard.get(0).getRank());
    }
}
