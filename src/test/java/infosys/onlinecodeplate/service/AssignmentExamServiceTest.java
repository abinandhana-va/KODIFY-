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

public class AssignmentExamServiceTest {

    private AssignmentRepository assignmentRepo;
    private AssignmentProblemRepository assignmentProblemRepo;
    private AssignmentUserRepository assignmentUserRepo;
    private AssignmentAttemptRepository attemptRepo;
    private IntegrityEventRepository integrityRepo;
    private ExamRecordingRepository examRecordingRepo;
    private ProblemRepository problemRepo;
    private UserSubmissionRepository userSubmissionRepo;
    private ActivityService activityService;
    private FileStorageService fileStorageService;
    private AssignmentCreatorVerificationRepository creatorVerificationRepo;
    private AssignmentExamService examService;

    private User student;
    private User teacher;
    private Assignment assignment;
    private Problem p1;
    private Problem p2;

    @BeforeEach
    public void setUp() {
        assignmentRepo = Mockito.mock(AssignmentRepository.class);
        assignmentProblemRepo = Mockito.mock(AssignmentProblemRepository.class);
        assignmentUserRepo = Mockito.mock(AssignmentUserRepository.class);
        attemptRepo = Mockito.mock(AssignmentAttemptRepository.class);
        integrityRepo = Mockito.mock(IntegrityEventRepository.class);
        examRecordingRepo = Mockito.mock(ExamRecordingRepository.class);
        problemRepo = Mockito.mock(ProblemRepository.class);
        userSubmissionRepo = Mockito.mock(UserSubmissionRepository.class);
        UserActivityRepository activityRepo = Mockito.mock(UserActivityRepository.class);
        activityService = new ActivityService(activityRepo);
        fileStorageService = Mockito.mock(FileStorageService.class);
        creatorVerificationRepo = Mockito.mock(AssignmentCreatorVerificationRepository.class);
        NotificationService notificationService = Mockito.mock(NotificationService.class);

        examService = new AssignmentExamService(
                assignmentRepo,
                assignmentProblemRepo,
                assignmentUserRepo,
                attemptRepo,
                integrityRepo,
                examRecordingRepo,
                problemRepo,
                userSubmissionRepo,
                activityService,
                fileStorageService,
                creatorVerificationRepo,
                notificationService
        );

        teacher = new User();
        teacher.setId(1L);
        teacher.setUsername("prof");
        teacher.setRole(Role.USER);

        student = new User();
        student.setId(10L);
        student.setUsername("student1");
        student.setRole(Role.USER);

        assignment = new Assignment();
        assignment.setId(100L);
        assignment.setTitle("Secure Final Exam");
        assignment.setCreator(teacher);
        assignment.setSecureMode(true);
        assignment.setDurationMinutes(45);
        assignment.setDueDate(LocalDateTime.now().plusDays(2));

        p1 = new Problem();
        p1.setId(201L);
        p1.setTitle("Two Sum");
        p2 = new Problem();
        p2.setId(202L);
        p2.setTitle("Merge Intervals");
    }

    @Test
    @DisplayName("Starting an attempt computes server-authoritative timer without client trust")
    public void testStartAttemptInitializesServerTimer() {
        when(assignmentRepo.findById(100L)).thenReturn(Optional.of(assignment));
        when(assignmentUserRepo.existsByAssignmentIdAndUserId(100L, 10L)).thenReturn(true);
        when(attemptRepo.findByAssignmentIdAndUserId(100L, 10L)).thenReturn(Optional.empty());

        AssignmentProblem ap1 = new AssignmentProblem(assignment, p1, 1, 50);
        AssignmentProblem ap2 = new AssignmentProblem(assignment, p2, 2, 50);
        when(assignmentProblemRepo.findByAssignmentIdOrderByProblemOrderAsc(100L)).thenReturn(List.of(ap1, ap2));

        when(attemptRepo.save(any(AssignmentAttempt.class))).thenAnswer(invocation -> {
            AssignmentAttempt a = invocation.getArgument(0);
            a.setId(500L);
            return a;
        });

        AssignmentAttemptDto attempt = examService.startOrResumeAttempt(100L, student);

        assertNotNull(attempt);
        assertEquals(500L, attempt.getId());
        assertEquals("IN_PROGRESS", attempt.getStatus());
        assertTrue(attempt.getRemainingSeconds() > 0 && attempt.getRemainingSeconds() <= 2700); // 45 mins = 2700s
        assertEquals(2, attempt.getTotalQuestions());
        assertEquals(0, attempt.getIntegrityViolationCount());
        assertFalse(attempt.getFlaggedForReview());
        verify(attemptRepo, times(1)).save(any(AssignmentAttempt.class));
    }

    @Test
    @DisplayName("Refreshing page resumes existing attempt and does NOT reset timer")
    public void testResumeAttemptDoesNotResetTimer() {
        LocalDateTime startedAt = LocalDateTime.now().minusMinutes(15);
        LocalDateTime expiresAt = startedAt.plusMinutes(45); // 30 minutes remaining

        AssignmentAttempt existing = new AssignmentAttempt(assignment, student, startedAt, expiresAt, 2);
        existing.setId(500L);

        when(assignmentRepo.findById(100L)).thenReturn(Optional.of(assignment));
        when(assignmentUserRepo.existsByAssignmentIdAndUserId(100L, 10L)).thenReturn(true);
        when(attemptRepo.findByAssignmentIdAndUserId(100L, 10L)).thenReturn(Optional.of(existing));

        AssignmentAttemptDto resumed = examService.startOrResumeAttempt(100L, student);

        assertNotNull(resumed);
        assertEquals(500L, resumed.getId());
        // Remaining should be approximately 30 mins (1800s)
        assertTrue(resumed.getRemainingSeconds() <= 1800 && resumed.getRemainingSeconds() > 1700);
    }

    @Test
    @DisplayName("Three-strike rule: 3rd violation flags attempt for possible cheating review")
    public void testThreeStrikeViolationRuleFlagsAttempt() {
        AssignmentAttempt attempt = new AssignmentAttempt(assignment, student, LocalDateTime.now(), LocalDateTime.now().plusHours(1), 2);
        attempt.setId(500L);
        attempt.setIntegrityViolationCount(2); // Already 2 violations

        when(attemptRepo.findById(500L)).thenReturn(Optional.of(attempt));
        when(attemptRepo.save(any(AssignmentAttempt.class))).thenAnswer(inv -> inv.getArgument(0));

        IntegrityEventDto eventDto = new IntegrityEventDto();
        eventDto.setEventType("TAB_SWITCH");
        eventDto.setMetadata("User switched away from assessment window");
        eventDto.setSeverity("WARNING");

        AssignmentAttemptDto updated = examService.recordIntegrityEvent(500L, eventDto, student);

        assertNotNull(updated);
        assertEquals(3, updated.getIntegrityViolationCount());
        assertTrue(updated.getFlaggedForReview(), "Attempt must be flagged for review after 3rd strike");
        verify(integrityRepo, times(1)).save(any(IntegrityEvent.class));
    }

    @Test
    @DisplayName("Submit attempt computes score from real accepted submissions and finalizes attempt")
    public void testSubmitAttemptEvaluatesRealSubmissions() {
        AssignmentAttempt attempt = new AssignmentAttempt(assignment, student, LocalDateTime.now().minusMinutes(20), LocalDateTime.now().plusMinutes(25), 2);
        attempt.setId(500L);

        AssignmentProblem ap1 = new AssignmentProblem(assignment, p1, 1, 50);
        AssignmentProblem ap2 = new AssignmentProblem(assignment, p2, 2, 50);
        when(assignmentProblemRepo.findByAssignmentIdOrderByProblemOrderAsc(100L)).thenReturn(List.of(ap1, ap2));
        when(attemptRepo.findById(500L)).thenReturn(Optional.of(attempt));
        when(attemptRepo.save(any(AssignmentAttempt.class))).thenAnswer(inv -> inv.getArgument(0));

        // User solved p1 with ACCEPTED status
        when(userSubmissionRepo.findSolvedProblemIdsByUserId(10L, "ACCEPTED")).thenReturn(List.of(201L));

        AssignmentAttemptDto submitted = examService.submitAttempt(500L, student);

        assertNotNull(submitted);
        assertEquals("COMPLETED", submitted.getStatus());
        assertEquals(1, submitted.getCompletedQuestions());
        assertEquals(50, submitted.getScore());
    }

    @Test
    @DisplayName("Integrity report categorizes all recorded events for admin forensic review")
    public void testIntegrityReportCategorization() {
        AssignmentAttempt attempt = new AssignmentAttempt(assignment, student, LocalDateTime.now().minusMinutes(30), LocalDateTime.now(), 2);
        attempt.setId(500L);
        attempt.setStatus("COMPLETED");
        attempt.setFlaggedForReview(true);

        when(attemptRepo.findById(500L)).thenReturn(Optional.of(attempt));

        IntegrityEvent e1 = new IntegrityEvent(attempt, student, assignment, "FULLSCREEN_EXIT", "ESC key exit", "WARNING");
        IntegrityEvent e2 = new IntegrityEvent(attempt, student, assignment, "TAB_SWITCH", "Left browser tab", "WARNING");
        IntegrityEvent e3 = new IntegrityEvent(attempt, student, assignment, "PASTE_ATTEMPT", "External paste blocked", "WARNING");
        when(integrityRepo.findByAttemptIdOrderByTimestampAsc(500L)).thenReturn(List.of(e1, e2, e3));

        IntegrityReportDto report = examService.getIntegrityReport(500L, teacher);

        assertNotNull(report);
        assertEquals(1, report.getFullscreenExits());
        assertEquals(1, report.getTabSwitches());
        assertEquals(1, report.getPasteAttempts());
        assertEquals(3, report.getTotalViolations());
        assertTrue(report.isFlaggedForReview());
        assertEquals(3, report.getTimeline().size());
    }

    @Test
    @DisplayName("Unauthenticated candidate can verify valid 6-digit access code and receives masked email")
    public void testVerifyExamAccessCode_Unauthenticated_Success() {
        when(assignmentRepo.findById(100L)).thenReturn(Optional.of(assignment));
        student.setEmail("candidate@kodify.dev");
        AssignmentUser au = new AssignmentUser(assignment, student, "583214", LocalDateTime.now(), LocalDateTime.now().plusDays(2));
        when(assignmentUserRepo.findByAssignmentIdAndAccessCode(100L, "583214")).thenReturn(Optional.of(au));

        ExamCodeVerificationResponseDto res = examService.verifyExamAccessCode(100L, "583214", null);

        assertNotNull(res);
        assertTrue(res.isValid());
        assertEquals("Secure Final Exam", res.getAssignmentTitle());
        assertEquals("c***e@kodify.dev", res.getEmail());
    }
}
