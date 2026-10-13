package infosys.onlinecodeplate.service;

import infosys.onlinecodeplate.dto.AppDtos.LeaderboardEntryDto;
import infosys.onlinecodeplate.entity.Problem;
import infosys.onlinecodeplate.entity.Role;
import infosys.onlinecodeplate.entity.User;
import infosys.onlinecodeplate.entity.UserSubmission;
import infosys.onlinecodeplate.repository.UserRepository;
import infosys.onlinecodeplate.repository.UserSubmissionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

public class LeaderboardServiceTest {

    private UserRepository userRepository;
    private UserSubmissionRepository submissionRepo;
    private LeaderboardService leaderboardService;

    private User userA;
    private User userB;
    private User userC;
    private User adminUser;

    private Problem easyProblem;
    private Problem mediumProblem;
    private Problem hardProblem;

    @BeforeEach
    public void setUp() {
        userRepository = Mockito.mock(UserRepository.class);
        submissionRepo = Mockito.mock(UserSubmissionRepository.class);
        leaderboardService = new LeaderboardService(userRepository, submissionRepo);

        userA = new User();
        userA.setId(1L);
        userA.setUsername("userA");
        userA.setName("User Alpha");
        userA.setRole(Role.USER);

        userB = new User();
        userB.setId(2L);
        userB.setUsername("userB");
        userB.setName("User Beta");
        userB.setRole(Role.USER);

        userC = new User();
        userC.setId(3L);
        userC.setUsername("userC");
        userC.setName("User Gamma");
        userC.setRole(Role.USER);

        adminUser = new User();
        adminUser.setId(99L);
        adminUser.setUsername("admin");
        adminUser.setName("System Admin");
        adminUser.setRole(Role.ADMIN);

        easyProblem = new Problem();
        easyProblem.setId(101L);
        easyProblem.setTitle("Easy Task");
        easyProblem.setDifficulty("EASY");

        mediumProblem = new Problem();
        mediumProblem.setId(102L);
        mediumProblem.setTitle("Medium Task");
        mediumProblem.setDifficulty("MEDIUM");

        hardProblem = new Problem();
        hardProblem.setId(103L);
        hardProblem.setTitle("Hard Task");
        hardProblem.setDifficulty("HARD");
    }

    @Test
    @DisplayName("Duplicate accepted submissions for the same problem only count as 1 problem solved")
    public void testDuplicateAcceptedSubmissionsCountOnce() {
        when(userRepository.findAll()).thenReturn(List.of(userA));

        UserSubmission sub1 = new UserSubmission();
        sub1.setUser(userA);
        sub1.setProblem(easyProblem);
        sub1.setStatus("ACCEPTED");
        sub1.setLanguage("JAVA");
        sub1.setRuntime(15.0);
        sub1.setCreatedAt(LocalDateTime.now());

        UserSubmission sub2 = new UserSubmission();
        sub2.setUser(userA);
        sub2.setProblem(easyProblem);
        sub2.setStatus("ACCEPTED");
        sub2.setLanguage("JAVA");
        sub2.setRuntime(12.0);
        sub2.setCreatedAt(LocalDateTime.now());

        when(submissionRepo.findAll()).thenReturn(List.of(sub1, sub2));

        List<LeaderboardEntryDto> leaderboard = leaderboardService.getLeaderboard("global", null);

        assertEquals(1, leaderboard.size());
        LeaderboardEntryDto entry = leaderboard.get(0);
        assertEquals("userA", entry.getUsername());
        assertEquals(1, entry.getProblemsSolved(), "Problems solved must be 1, not 2 for duplicates");
        assertEquals(1, entry.getScore(), "Score should only count easy problem once (1 pt)");
        assertEquals(2, entry.getTotalSubmissions());
        assertEquals(2, entry.getAcceptedSubmissions());
        assertEquals(100.0, entry.getAcceptanceRate());
    }

    @Test
    @DisplayName("Difficulty score weighting: Easy=1, Medium=2, Hard=3 sums to 6")
    public void testDifficultyScoring() {
        when(userRepository.findAll()).thenReturn(List.of(userB));

        UserSubmission subEasy = new UserSubmission();
        subEasy.setUser(userB);
        subEasy.setProblem(easyProblem);
        subEasy.setStatus("ACCEPTED");
        subEasy.setLanguage("PYTHON");
        subEasy.setCreatedAt(LocalDateTime.now());

        UserSubmission subMed = new UserSubmission();
        subMed.setUser(userB);
        subMed.setProblem(mediumProblem);
        subMed.setStatus("ACCEPTED");
        subMed.setLanguage("PYTHON");
        subMed.setCreatedAt(LocalDateTime.now());

        UserSubmission subHard = new UserSubmission();
        subHard.setUser(userB);
        subHard.setProblem(hardProblem);
        subHard.setStatus("ACCEPTED");
        subHard.setLanguage("PYTHON");
        subHard.setCreatedAt(LocalDateTime.now());

        when(submissionRepo.findAll()).thenReturn(List.of(subEasy, subMed, subHard));

        List<LeaderboardEntryDto> leaderboard = leaderboardService.getLeaderboard("global", null);

        assertEquals(1, leaderboard.size());
        LeaderboardEntryDto entry = leaderboard.get(0);
        assertEquals(3, entry.getProblemsSolved());
        assertEquals(6, entry.getScore(), "1 (Easy) + 2 (Medium) + 3 (Hard) must equal 6");
    }

    @Test
    @DisplayName("Acceptance rate calculation: 10 submissions with 5 accepted results in 50% accuracy")
    public void testAcceptanceRateCalculation() {
        when(userRepository.findAll()).thenReturn(List.of(userC));

        List<UserSubmission> submissions = new ArrayList<>();
        // 5 Accepted
        for (int i = 0; i < 5; i++) {
            UserSubmission sub = new UserSubmission();
            sub.setUser(userC);
            sub.setProblem(easyProblem);
            sub.setStatus("ACCEPTED");
            sub.setLanguage("C");
            sub.setCreatedAt(LocalDateTime.now());
            submissions.add(sub);
        }
        // 3 Wrong Answer
        for (int i = 0; i < 3; i++) {
            UserSubmission sub = new UserSubmission();
            sub.setUser(userC);
            sub.setProblem(easyProblem);
            sub.setStatus("WRONG_ANSWER");
            sub.setLanguage("C");
            sub.setCreatedAt(LocalDateTime.now());
            submissions.add(sub);
        }
        // 2 Compilation Error
        for (int i = 0; i < 2; i++) {
            UserSubmission sub = new UserSubmission();
            sub.setUser(userC);
            sub.setProblem(easyProblem);
            sub.setStatus("COMPILATION_ERROR");
            sub.setLanguage("C");
            sub.setCreatedAt(LocalDateTime.now());
            submissions.add(sub);
        }

        when(submissionRepo.findAll()).thenReturn(submissions);

        List<LeaderboardEntryDto> leaderboard = leaderboardService.getLeaderboard("global", null);

        assertEquals(1, leaderboard.size());
        LeaderboardEntryDto entry = leaderboard.get(0);
        assertEquals(10, entry.getTotalSubmissions());
        assertEquals(5, entry.getAcceptedSubmissions());
        assertEquals(50.0, entry.getAcceptanceRate(), 0.01);
    }

    @Test
    @DisplayName("Zero submissions handles safely with 0% acceptance rate and 0 score")
    public void testZeroSubmissionsSafety() {
        when(userRepository.findAll()).thenReturn(List.of(userA));
        when(submissionRepo.findAll()).thenReturn(List.of());

        List<LeaderboardEntryDto> leaderboard = leaderboardService.getLeaderboard("global", null);

        assertEquals(1, leaderboard.size());
        LeaderboardEntryDto entry = leaderboard.get(0);
        assertEquals(0, entry.getTotalSubmissions());
        assertEquals(0, entry.getAcceptedSubmissions());
        assertEquals(0.0, entry.getAcceptanceRate());
        assertEquals(0, entry.getProblemsSolved());
        assertEquals(0, entry.getScore());
    }

    @Test
    @DisplayName("Admin accounts are excluded from leaderboard rankings")
    public void testAdminExclusion() {
        when(userRepository.findAll()).thenReturn(List.of(userA, adminUser));

        UserSubmission adminSub = new UserSubmission();
        adminSub.setUser(adminUser);
        adminSub.setProblem(hardProblem);
        adminSub.setStatus("ACCEPTED");
        adminSub.setCreatedAt(LocalDateTime.now());

        when(submissionRepo.findAll()).thenReturn(List.of(adminSub));

        List<LeaderboardEntryDto> leaderboard = leaderboardService.getLeaderboard("global", null);

        assertEquals(1, leaderboard.size());
        assertEquals("userA", leaderboard.get(0).getUsername());
        assertFalse(leaderboard.stream().anyMatch(e -> "admin".equals(e.getUsername())));
    }

    @Test
    @DisplayName("Weekly filter only counts submissions created during the current week")
    public void testWeeklyFiltering() {
        when(userRepository.findAll()).thenReturn(List.of(userA));

        // Submission from 3 weeks ago (should NOT count for weekly)
        UserSubmission oldSub = new UserSubmission();
        oldSub.setUser(userA);
        oldSub.setProblem(hardProblem);
        oldSub.setStatus("ACCEPTED");
        oldSub.setLanguage("JAVA");
        oldSub.setCreatedAt(LocalDateTime.now().minusWeeks(3));

        // Submission from today (should count for weekly)
        UserSubmission recentSub = new UserSubmission();
        recentSub.setUser(userA);
        recentSub.setProblem(easyProblem);
        recentSub.setStatus("ACCEPTED");
        recentSub.setLanguage("JAVA");
        recentSub.setCreatedAt(LocalDateTime.now());

        when(submissionRepo.findAll()).thenReturn(List.of(oldSub, recentSub));

        // Global should see 2 solved (Easy + Hard = 1 + 3 = 4 pts)
        List<LeaderboardEntryDto> global = leaderboardService.getLeaderboard("global", null);
        assertEquals(2, global.get(0).getProblemsSolved());
        assertEquals(4, global.get(0).getScore());

        // Weekly should see 1 solved (Easy only = 1 pt)
        List<LeaderboardEntryDto> weekly = leaderboardService.getLeaderboard("weekly", null);
        assertEquals(1, weekly.get(0).getProblemsSolved());
        assertEquals(1, weekly.get(0).getScore());
    }

    @Test
    @DisplayName("Language filter only evaluates submissions in the selected language")
    public void testLanguageFiltering() {
        when(userRepository.findAll()).thenReturn(List.of(userA));

        UserSubmission javaSub = new UserSubmission();
        javaSub.setUser(userA);
        javaSub.setProblem(easyProblem);
        javaSub.setStatus("ACCEPTED");
        javaSub.setLanguage("JAVA");
        javaSub.setCreatedAt(LocalDateTime.now());

        UserSubmission pythonSub = new UserSubmission();
        pythonSub.setUser(userA);
        pythonSub.setProblem(mediumProblem);
        pythonSub.setStatus("ACCEPTED");
        pythonSub.setLanguage("PYTHON");
        pythonSub.setCreatedAt(LocalDateTime.now());

        when(submissionRepo.findAll()).thenReturn(List.of(javaSub, pythonSub));

        List<LeaderboardEntryDto> javaLeaderboard = leaderboardService.getLeaderboard("global", "JAVA");
        assertEquals(1, javaLeaderboard.get(0).getProblemsSolved());
        assertEquals(1, javaLeaderboard.get(0).getScore());

        List<LeaderboardEntryDto> pythonLeaderboard = leaderboardService.getLeaderboard("global", "PYTHON");
        assertEquals(1, pythonLeaderboard.get(0).getProblemsSolved());
        assertEquals(2, pythonLeaderboard.get(0).getScore());

        List<LeaderboardEntryDto> cLeaderboard = leaderboardService.getLeaderboard("global", "C");
        assertEquals(0, cLeaderboard.get(0).getProblemsSolved());
        assertEquals(0, cLeaderboard.get(0).getScore());
    }

    @Test
    @DisplayName("Deterministic sorting orders by Solved DESC, then Acceptance Rate DESC, then Runtime ASC, then Username ASC")
    public void testDeterministicTieBreaking() {
        // UserA: 1 solved, 100% accuracy, runtime 10ms
        UserSubmission subA = new UserSubmission();
        subA.setUser(userA);
        subA.setProblem(easyProblem);
        subA.setStatus("ACCEPTED");
        subA.setRuntime(10.0);
        subA.setCreatedAt(LocalDateTime.now());

        // UserB: 1 solved, 100% accuracy, runtime 20ms
        UserSubmission subB = new UserSubmission();
        subB.setUser(userB);
        subB.setProblem(easyProblem);
        subB.setStatus("ACCEPTED");
        subB.setRuntime(20.0);
        subB.setCreatedAt(LocalDateTime.now());

        // UserC: 2 solved, 50% accuracy
        UserSubmission subC1 = new UserSubmission();
        subC1.setUser(userC);
        subC1.setProblem(easyProblem);
        subC1.setStatus("ACCEPTED");
        subC1.setCreatedAt(LocalDateTime.now());

        UserSubmission subC2 = new UserSubmission();
        subC2.setUser(userC);
        subC2.setProblem(mediumProblem);
        subC2.setStatus("ACCEPTED");
        subC2.setCreatedAt(LocalDateTime.now());

        UserSubmission subC3 = new UserSubmission();
        subC3.setUser(userC);
        subC3.setProblem(hardProblem);
        subC3.setStatus("WRONG_ANSWER");
        subC3.setCreatedAt(LocalDateTime.now());

        UserSubmission subC4 = new UserSubmission();
        subC4.setUser(userC);
        subC4.setProblem(hardProblem);
        subC4.setStatus("WRONG_ANSWER");
        subC4.setCreatedAt(LocalDateTime.now());

        when(userRepository.findAll()).thenReturn(List.of(userA, userB, userC));
        when(submissionRepo.findAll()).thenReturn(List.of(subA, subB, subC1, subC2, subC3, subC4));

        List<LeaderboardEntryDto> leaderboard = leaderboardService.getLeaderboard("global", null);

        assertEquals(3, leaderboard.size());

        // Rank 1: UserC (2 solved)
        assertEquals(1, leaderboard.get(0).getRank());
        assertEquals("userC", leaderboard.get(0).getUsername());

        // Rank 2: UserA (1 solved, 100% accuracy, runtime 10.0ms vs 20.0ms)
        assertEquals(2, leaderboard.get(1).getRank());
        assertEquals("userA", leaderboard.get(1).getUsername());

        // Rank 3: UserB (1 solved, 100% accuracy, runtime 20.0ms)
        assertEquals(3, leaderboard.get(2).getRank());
        assertEquals("userB", leaderboard.get(2).getUsername());
    }
}
