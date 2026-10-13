package infosys.onlinecodeplate.controller;

import infosys.onlinecodeplate.dto.AppDtos.EditorialResponseDto;
import infosys.onlinecodeplate.dto.AppDtos.ProblemDto;
import infosys.onlinecodeplate.dto.AppDtos.RunRequestDto;
import infosys.onlinecodeplate.dto.AppDtos.RunResponseDto;
import infosys.onlinecodeplate.entity.*;
import infosys.onlinecodeplate.repository.*;
import infosys.onlinecodeplate.service.ActivityService;
import infosys.onlinecodeplate.service.DockerSandboxService;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

public class ProblemControllerTest {

    private ProblemRepository problemRepo;
    private UserRepository userRepository;
    private UserSubmissionRepository submissionRepo;
    private TestCaseResultRepository testCaseResultRepo;
    private ActivityService activityService;
    private DockerSandboxService dockerSandboxService;
    private ProblemController problemController;

    private User normalUser;
    private User adminUser;
    private Problem testProblem;
    private Authentication auth;

    @BeforeEach
    public void setUp() {
        problemRepo = Mockito.mock(ProblemRepository.class);
        userRepository = Mockito.mock(UserRepository.class);
        submissionRepo = Mockito.mock(UserSubmissionRepository.class);
        testCaseResultRepo = Mockito.mock(TestCaseResultRepository.class);
        UserActivityRepository activityRepo = Mockito.mock(UserActivityRepository.class);
        activityService = new ActivityService(activityRepo);
        dockerSandboxService = new DockerSandboxService() {
            @Override
            public EvaluationResult evaluateSubmission(UserSubmission submission, List<TestCase> testCases) {
                return new EvaluationResult(
                    "ACCEPTED", "All visible test cases passed.", null, 12.0, testCases.size(), testCases.size(),
                    List.of(new TestCaseResultItem(1L, true, "0 1", 12.0, "PASSED"))
                );
            }
        };

        BadgeRepository bRepo = Mockito.mock(BadgeRepository.class);
        UserBadgeRepository ubRepo = Mockito.mock(UserBadgeRepository.class);
        ContestRepository cRepo = Mockito.mock(ContestRepository.class);
        ContestParticipantRepository cpRepo = Mockito.mock(ContestParticipantRepository.class);
        ContestSubmissionRepository csRepo = Mockito.mock(ContestSubmissionRepository.class);
        infosys.onlinecodeplate.service.AchievementService achievementService = new infosys.onlinecodeplate.service.AchievementService(submissionRepo, cRepo, cpRepo, csRepo);
        infosys.onlinecodeplate.service.BadgeService badgeService = new infosys.onlinecodeplate.service.BadgeService(bRepo, ubRepo, achievementService, activityService);

        infosys.onlinecodeplate.service.EmailService emailService = Mockito.mock(infosys.onlinecodeplate.service.EmailService.class);

        problemController = new ProblemController(
            problemRepo, userRepository, submissionRepo, testCaseResultRepo, activityService, dockerSandboxService, badgeService, emailService
        );

        normalUser = new User();
        normalUser.setId(1L);
        normalUser.setUsername("testuser");
        normalUser.setEmail("test@user.com");
        normalUser.setRole(Role.USER);

        adminUser = new User();
        adminUser.setId(2L);
        adminUser.setUsername("adminuser");
        adminUser.setEmail("admin@user.com");
        adminUser.setRole(Role.ADMIN);

        testProblem = new Problem();
        testProblem.setId(10L);
        testProblem.setTitle("Two Sum");
        testProblem.setConcept("Arrays");
        testProblem.setDifficulty("EASY");
        testProblem.setDescription("Find two numbers that add to target.");
        testProblem.setConstraints("1 <= N <= 100");
        testProblem.setEditorial("Use a hash table to store complement index.");
        testProblem.setSolutionPython("def solution(): pass");

        testProblem.addTestCase(new TestCase("2 7\n9", "0 1", false)); // Visible
        testProblem.addTestCase(new TestCase("3 3\n6", "0 1", true));  // Hidden
        testProblem.addHint(new ProblemHint(1, "Think about using a Hash Map."));
        testProblem.addHint(new ProblemHint(2, "Store target - current in map."));

        auth = new org.springframework.security.authentication.UsernamePasswordAuthenticationToken("testuser", "password");
        when(userRepository.findByEmailOrUsername("testuser", "testuser")).thenReturn(Optional.of(normalUser));
        when(problemRepo.findById(10L)).thenReturn(Optional.of(testProblem));
    }

    @Test
    @DisplayName("getProblem returns DTO with hints, hasEditorial=true, and ONLY visible test cases")
    public void testGetProblemHidesHiddenTestCases() {
        ResponseEntity<ProblemDto> response = problemController.getProblem(10L, auth);
        assertEquals(HttpStatus.OK, response.getStatusCode());

        ProblemDto dto = response.getBody();
        assertNotNull(dto);
        assertEquals("Two Sum", dto.getTitle());
        assertTrue(dto.isHasEditorial());
        assertEquals(2, dto.getHints().size());
        assertEquals("Think about using a Hash Map.", dto.getHints().get(0).getContent());
        assertEquals("Store target - current in map.", dto.getHints().get(1).getContent());

        // Verify ONLY visible test case is included (hidden test case excluded from problem detail DTO)
        assertEquals(1, dto.getTestCasesList().size());
        assertEquals("2 7\n9", dto.getTestCasesList().get(0).getInput());
    }

    @Test
    @DisplayName("Editorial access is FORBIDDEN before submission attempt")
    public void testEditorialLockedBeforeSubmission() {
        when(submissionRepo.existsByUserIdAndProblemId(1L, 10L)).thenReturn(false);

        ResponseEntity<?> response = problemController.getProblemEditorial(10L, auth);
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertTrue(response.getBody().toString().contains("Editorial locked"));
    }

    @Test
    @DisplayName("Editorial access is ALLOWED after submission attempt")
    public void testEditorialUnlockedAfterSubmission() {
        when(submissionRepo.existsByUserIdAndProblemId(1L, 10L)).thenReturn(true);

        ResponseEntity<?> response = problemController.getProblemEditorial(10L, auth);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody() instanceof EditorialResponseDto);
        EditorialResponseDto dto = (EditorialResponseDto) response.getBody();
        assertEquals("Use a hash table to store complement index.", dto.getEditorial());
    }

    @Test
    @DisplayName("Run endpoint executes code against ONLY visible test cases")
    public void testRunSolutionExecutesOnlyVisibleTestCases() {
        RunRequestDto req = new RunRequestDto();
        req.setLanguage("Python");
        req.setCode("print('hello')");

        ResponseEntity<RunResponseDto> response = problemController.runSolution(10L, req, auth);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        RunResponseDto dto = response.getBody();
        assertNotNull(dto);
        assertEquals("ACCEPTED", dto.getStatus());
        assertEquals(1, dto.getPassedTestCases());
    }
}
