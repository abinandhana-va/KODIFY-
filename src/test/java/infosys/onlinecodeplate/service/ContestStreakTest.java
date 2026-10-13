package infosys.onlinecodeplate.service;

import infosys.onlinecodeplate.dto.AppDtos.UserContestStatsDto;
import infosys.onlinecodeplate.entity.*;
import infosys.onlinecodeplate.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

public class ContestStreakTest {

    private UserSubmissionRepository userSubmissionRepo;
    private ContestRepository contestRepo;
    private ContestParticipantRepository contestParticipantRepo;
    private ContestSubmissionRepository contestSubmissionRepo;
    private AchievementService achievementService;

    private User testUser;

    @BeforeEach
    public void setUp() {
        userSubmissionRepo = Mockito.mock(UserSubmissionRepository.class);
        contestRepo = Mockito.mock(ContestRepository.class);
        contestParticipantRepo = Mockito.mock(ContestParticipantRepository.class);
        contestSubmissionRepo = Mockito.mock(ContestSubmissionRepository.class);

        achievementService = new AchievementService(
                userSubmissionRepo,
                contestRepo,
                contestParticipantRepo,
                contestSubmissionRepo
        );

        testUser = new User();
        testUser.setId(10L);
        testUser.setUsername("streakcoder");
    }

    @Test
    @DisplayName("Streak increases with consecutive contest participations and preserves longest streak")
    public void testContestStreakCalculation() {
        LocalDateTime baseTime = LocalDateTime.now().minusDays(30);

        Contest c1 = createCompletedContest(1L, baseTime.plusDays(1));
        Contest c2 = createCompletedContest(2L, baseTime.plusDays(5));
        Contest c3 = createCompletedContest(3L, baseTime.plusDays(10));
        Contest c4 = createCompletedContest(4L, baseTime.plusDays(15));
        Contest c5 = createCompletedContest(5L, baseTime.plusDays(20));

        when(contestRepo.findAllByOrderByStartTimeDesc()).thenReturn(List.of(c5, c4, c3, c2, c1));

        // User participated in c1, c2, c3 (streak 3), missed c4, participated in c5 (current streak 1, longest streak 3)
        ContestParticipant p1 = new ContestParticipant(c1, testUser);
        p1.setParticipatedAt(c1.getStartTime().plusMinutes(10));
        p1.setStatus("PARTICIPATED");

        ContestParticipant p2 = new ContestParticipant(c2, testUser);
        p2.setParticipatedAt(c2.getStartTime().plusMinutes(10));
        p2.setStatus("PARTICIPATED");

        ContestParticipant p3 = new ContestParticipant(c3, testUser);
        p3.setParticipatedAt(c3.getStartTime().plusMinutes(10));
        p3.setStatus("PARTICIPATED");

        ContestParticipant p5 = new ContestParticipant(c5, testUser);
        p5.setParticipatedAt(c5.getStartTime().plusMinutes(10));
        p5.setStatus("PARTICIPATED");

        when(contestParticipantRepo.findByUserId(10L)).thenReturn(List.of(p1, p2, p3, p5));
        when(contestSubmissionRepo.findByUserIdOrderByCreatedAtDesc(10L)).thenReturn(List.of());
        when(contestRepo.countConductedContestsByUserId(10L)).thenReturn(1L);

        UserContestStatsDto stats = achievementService.getUserContestStats(10L);

        assertNotNull(stats);
        assertEquals(4, stats.getParticipatedCount());
        assertEquals(1, stats.getConductedCount());
        assertEquals(1, stats.getCurrentStreak()); // c5 participated, c4 missed -> current streak = 1
        assertEquals(3, stats.getLongestStreak()); // c1, c2, c3 -> longest streak = 3
    }

    private Contest createCompletedContest(Long id, LocalDateTime startTime) {
        Contest c = new Contest();
        c.setId(id);
        c.setTitle("Contest #" + id);
        c.setStartTime(startTime);
        c.setEndTime(startTime.plusHours(2));
        c.setStatus("COMPLETED");
        return c;
    }
}
