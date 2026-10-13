package infosys.onlinecodeplate.controller;

import infosys.onlinecodeplate.dto.AppDtos.LeaderboardEntryDto;
import infosys.onlinecodeplate.entity.Problem;
import infosys.onlinecodeplate.entity.Role;
import infosys.onlinecodeplate.entity.User;
import infosys.onlinecodeplate.entity.UserSubmission;
import infosys.onlinecodeplate.repository.UserRepository;
import infosys.onlinecodeplate.repository.UserSubmissionRepository;
import infosys.onlinecodeplate.service.LeaderboardService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

public class LeaderboardControllerTest {

    private UserRepository userRepository;
    private UserSubmissionRepository submissionRepo;
    private LeaderboardService leaderboardService;
    private LeaderboardController leaderboardController;

    private User user1;
    private Problem problem1;

    @BeforeEach
    public void setUp() {
        userRepository = Mockito.mock(UserRepository.class);
        submissionRepo = Mockito.mock(UserSubmissionRepository.class);
        leaderboardService = new LeaderboardService(userRepository, submissionRepo);
        leaderboardController = new LeaderboardController(leaderboardService);

        user1 = new User();
        user1.setId(1L);
        user1.setUsername("coder1");
        user1.setName("Coder One");
        user1.setRole(Role.USER);

        problem1 = new Problem();
        problem1.setId(10L);
        problem1.setTitle("Test Problem");
        problem1.setDifficulty("MEDIUM");
    }

    @Test
    @DisplayName("GET /api/leaderboard/global returns global leaderboard entries")
    public void testGetGlobalLeaderboard() {
        UserSubmission sub = new UserSubmission();
        sub.setUser(user1);
        sub.setProblem(problem1);
        sub.setStatus("ACCEPTED");
        sub.setLanguage("JAVA");
        sub.setRuntime(15.0);
        sub.setCreatedAt(LocalDateTime.now());

        when(userRepository.findAll()).thenReturn(List.of(user1));
        when(submissionRepo.findAll()).thenReturn(List.of(sub));

        ResponseEntity<List<LeaderboardEntryDto>> res = leaderboardController.getGlobalLeaderboard("JAVA");
        assertEquals(HttpStatus.OK, res.getStatusCode());
        assertNotNull(res.getBody());
        assertEquals(1, res.getBody().size());
        assertEquals("coder1", res.getBody().get(0).getUsername());
        assertEquals(1, res.getBody().get(0).getProblemsSolved());
        assertEquals(2, res.getBody().get(0).getScore());
    }

    @Test
    @DisplayName("GET /api/leaderboard/weekly returns weekly leaderboard entries")
    public void testGetWeeklyLeaderboard() {
        UserSubmission sub = new UserSubmission();
        sub.setUser(user1);
        sub.setProblem(problem1);
        sub.setStatus("ACCEPTED");
        sub.setLanguage("PYTHON");
        sub.setCreatedAt(LocalDateTime.now());

        when(userRepository.findAll()).thenReturn(List.of(user1));
        when(submissionRepo.findAll()).thenReturn(List.of(sub));

        ResponseEntity<List<LeaderboardEntryDto>> res = leaderboardController.getWeeklyLeaderboard(null);
        assertEquals(HttpStatus.OK, res.getStatusCode());
        assertNotNull(res.getBody());
        assertEquals(1, res.getBody().size());
        assertEquals("coder1", res.getBody().get(0).getUsername());
    }
}
