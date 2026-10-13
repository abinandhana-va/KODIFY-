package infosys.onlinecodeplate.service;

import infosys.onlinecodeplate.dto.AppDtos.BadgeDto;
import infosys.onlinecodeplate.dto.AppDtos.BadgeRequestDto;
import infosys.onlinecodeplate.dto.AppDtos.UserContestStatsDto;
import infosys.onlinecodeplate.entity.*;
import infosys.onlinecodeplate.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class BadgeServiceTest {

    private BadgeRepository badgeRepo;
    private UserBadgeRepository userBadgeRepo;
    private UserSubmissionRepository submissionRepo;
    private ContestParticipantRepository contestParticipantRepo;
    private ContestRepository contestRepo;
    private ContestSubmissionRepository contestSubmissionRepo;
    private AchievementService achievementService;
    private ActivityService activityService;
    private BadgeService badgeService;

    private User testUser;
    private Badge badge10;
    private Badge badge50;
    private Badge contestBadge3;

    @BeforeEach
    public void setUp() {
        badgeRepo = Mockito.mock(BadgeRepository.class);
        userBadgeRepo = Mockito.mock(UserBadgeRepository.class);
        submissionRepo = Mockito.mock(UserSubmissionRepository.class);
        contestParticipantRepo = Mockito.mock(ContestParticipantRepository.class);
        contestRepo = Mockito.mock(ContestRepository.class);
        contestSubmissionRepo = Mockito.mock(ContestSubmissionRepository.class);
        achievementService = new AchievementService(submissionRepo, contestRepo, contestParticipantRepo, contestSubmissionRepo);
        UserActivityRepository userActivityRepo = Mockito.mock(UserActivityRepository.class);
        activityService = new ActivityService(userActivityRepo);

        badgeService = new BadgeService(badgeRepo, userBadgeRepo, achievementService, activityService);

        testUser = new User();
        testUser.setId(10L);
        testUser.setUsername("alice");
        testUser.setEmail("alice@test.com");
        testUser.setRole(Role.USER);

        badge10 = new Badge();
        badge10.setId(1L);
        badge10.setName("Problem Solver");
        badge10.setMetric("PROBLEMS_SOLVED");
        badge10.setTarget(10);
        badge10.setEnabled(true);

        badge50 = new Badge();
        badge50.setId(2L);
        badge50.setName("Master of Code");
        badge50.setMetric("PROBLEMS_SOLVED");
        badge50.setTarget(50);
        badge50.setEnabled(true);

        contestBadge3 = new Badge();
        contestBadge3.setId(3L);
        contestBadge3.setName("Contest Explorer");
        contestBadge3.setMetric("CONTESTS_PARTICIPATED");
        contestBadge3.setTarget(3);
        contestBadge3.setEnabled(true);
    }

    @Test
    @DisplayName("Badge is awarded automatically when solved problems reach target count")
    public void testAutomaticBadgeAwarding() {
        when(submissionRepo.countSolvedProblemsByUserId(10L, "ACCEPTED")).thenReturn(12L);
        when(badgeRepo.findByEnabledTrue()).thenReturn(List.of(badge10, badge50));
        when(userBadgeRepo.existsByUserIdAndBadgeId(10L, 1L)).thenReturn(false);
        when(userBadgeRepo.existsByUserIdAndBadgeId(10L, 2L)).thenReturn(false);

        List<UserBadge> awarded = badgeService.awardEligibleBadges(testUser);

        assertEquals(1, awarded.size());
        assertEquals("Problem Solver", awarded.get(0).getBadge().getName());
        verify(userBadgeRepo, times(1)).save(any(UserBadge.class));
    }

    @Test
    @DisplayName("Contest participation badge is awarded when contest participations reach target")
    public void testContestParticipationBadgeAwarding() {
        Contest c1 = new Contest();
        c1.setId(101L);
        c1.setStatus("COMPLETED");
        Contest c2 = new Contest();
        c2.setId(102L);
        c2.setStatus("COMPLETED");
        Contest c3 = new Contest();
        c3.setId(103L);
        c3.setStatus("COMPLETED");

        ContestParticipant cp1 = new ContestParticipant(c1, testUser);
        cp1.setStatus("PARTICIPATED");
        ContestParticipant cp2 = new ContestParticipant(c2, testUser);
        cp2.setStatus("PARTICIPATED");
        ContestParticipant cp3 = new ContestParticipant(c3, testUser);
        cp3.setStatus("PARTICIPATED");

        when(contestParticipantRepo.findByUserId(10L)).thenReturn(List.of(cp1, cp2, cp3));
        when(badgeRepo.findByEnabledTrue()).thenReturn(List.of(contestBadge3));
        when(userBadgeRepo.existsByUserIdAndBadgeId(10L, 3L)).thenReturn(false);

        List<UserBadge> awarded = badgeService.awardEligibleBadges(testUser);

        assertEquals(1, awarded.size());
        assertEquals("Contest Explorer", awarded.get(0).getBadge().getName());
        verify(userBadgeRepo, times(1)).save(any(UserBadge.class));
    }

    @Test
    @DisplayName("Badge is NOT awarded repeatedly if already earned (no duplicate awards)")
    public void testNoDuplicateBadgeAwarding() {
        when(submissionRepo.countSolvedProblemsByUserId(10L, "ACCEPTED")).thenReturn(15L);
        when(badgeRepo.findByEnabledTrue()).thenReturn(List.of(badge10));
        when(userBadgeRepo.existsByUserIdAndBadgeId(10L, 1L)).thenReturn(true); // Already earned

        List<UserBadge> awarded = badgeService.awardEligibleBadges(testUser);

        assertTrue(awarded.isEmpty());
        verify(userBadgeRepo, never()).save(any(UserBadge.class));
    }

    @Test
    @DisplayName("Admin can create a new badge with custom metric")
    public void testAdminCreateBadge() {
        BadgeRequestDto req = new BadgeRequestDto();
        req.setName("Contest Champion");
        req.setDescription("Win 3 contests");
        req.setMetric("CONTEST_WINS");
        req.setTarget(3);
        req.setShape("DIAMOND");
        req.setEnabled(true);

        when(badgeRepo.save(any(Badge.class))).thenAnswer(invocation -> {
            Badge b = invocation.getArgument(0);
            b.setId(99L);
            return b;
        });

        BadgeDto created = badgeService.createBadge(req);
        assertNotNull(created);
        assertEquals(99L, created.getId());
        assertEquals("Contest Champion", created.getName());
        assertEquals("CONTEST_WINS", created.getMetric());
        assertEquals("DIAMOND", created.getShape());
        verify(badgeRepo, times(1)).save(any(Badge.class));
    }
}
