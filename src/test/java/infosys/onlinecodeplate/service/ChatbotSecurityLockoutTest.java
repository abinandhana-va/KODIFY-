package infosys.onlinecodeplate.service;

import infosys.onlinecodeplate.dto.AppDtos.ChatRequestDto;
import infosys.onlinecodeplate.dto.AppDtos.ChatResponseDto;
import infosys.onlinecodeplate.entity.*;
import infosys.onlinecodeplate.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class ChatbotSecurityLockoutTest {

    @Mock
    private UserRepository userRepo;

    @Mock
    private ProblemRepository problemRepo;

    @Mock
    private UserSubmissionRepository userSubmissionRepo;

    @Mock
    private AssignmentRepository assignmentRepo;

    @Mock
    private AssignmentUserRepository assignmentUserRepo;

    @Mock
    private AssignmentAttemptRepository attemptRepo;

    @Mock
    private AchievementService achievementService;

    @Mock
    private CertificateService certificateService;

    @Mock
    private BadgeService badgeService;

    @Mock
    private ContestService contestService;

    @Mock
    private LeaderboardService leaderboardService;

    @InjectMocks
    private ChatService chatService;

    private User student;
    private Assignment secureAssignment;
    private AssignmentAttempt inProgressAttempt;

    @BeforeEach
    void setUp() {
        student = new User();
        student.setId(55L);
        student.setUsername("student_priya");
        student.setEmail("priya@kodify.dev");
        student.setRole(Role.USER);

        secureAssignment = new Assignment();
        secureAssignment.setId(77L);
        secureAssignment.setTitle("Final Competitive Exam");
        secureAssignment.setSecureMode(true);

        inProgressAttempt = new AssignmentAttempt(secureAssignment, student, LocalDateTime.now(), LocalDateTime.now().plusMinutes(60), 5);
        inProgressAttempt.setId(88L);
        inProgressAttempt.setStatus("IN_PROGRESS");
    }

    @Test
    void testProcessChat_ActiveSecureExam_ReturnsLockoutResponse() {
        when(attemptRepo.findByUserIdOrderByStartedAtDesc(55L)).thenReturn(List.of(inProgressAttempt));

        ChatRequestDto request = new ChatRequestDto();
        request.setMessage("Can you explain how to solve binary search?");

        ChatResponseDto response = chatService.processChat(request, student);

        assertNotNull(response);
        assertEquals("DISABLED", response.getMode());
        assertTrue(response.isDisabled(), "Chat should be disabled during active secure exam");
        assertTrue(response.getReply().contains("Chat assistance is disabled during secure assignments"));
    }

    @Test
    void testProcessChat_NoActiveSecureExam_ProcessesNormally() {
        when(attemptRepo.findByUserIdOrderByStartedAtDesc(55L)).thenReturn(List.of());
        when(achievementService.countUniqueSolvedProblems(55L)).thenReturn(5L);
        when(userSubmissionRepo.countSolvedProblemsByUserIdAndDifficulty(55L, "ACCEPTED", "EASY")).thenReturn(3L);
        when(userSubmissionRepo.countSolvedProblemsByUserIdAndDifficulty(55L, "ACCEPTED", "MEDIUM")).thenReturn(2L);
        when(userSubmissionRepo.countSolvedProblemsByUserIdAndDifficulty(55L, "ACCEPTED", "HARD")).thenReturn(0L);
        when(problemRepo.count()).thenReturn(20L);

        ChatRequestDto request = new ChatRequestDto();
        request.setMessage("What is my progress?");

        ChatResponseDto response = chatService.processChat(request, student);

        assertNotNull(response);
        assertEquals("PERSONALIZED", response.getMode());
        assertFalse(response.isDisabled());
    }
}
