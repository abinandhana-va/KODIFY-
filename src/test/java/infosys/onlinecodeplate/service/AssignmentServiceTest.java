package infosys.onlinecodeplate.service;

import infosys.onlinecodeplate.dto.AppDtos.*;
import infosys.onlinecodeplate.entity.*;
import infosys.onlinecodeplate.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class AssignmentServiceTest {

    private AssignmentRepository assignmentRepo;
    private AssignmentProblemRepository assignmentProblemRepo;
    private AssignmentUserRepository assignmentUserRepo;
    private ProblemRepository problemRepo;
    private UserRepository userRepo;
    private UserSubmissionRepository userSubmissionRepo;
    private ActivityService activityService;
    private AssignmentService assignmentService;

    private User creatorUser;
    private User student1;
    private User student2;
    private User hackerUser;
    private Problem problem1;
    private Problem problem2;

    @BeforeEach
    public void setUp() {
        assignmentRepo = Mockito.mock(AssignmentRepository.class);
        assignmentProblemRepo = Mockito.mock(AssignmentProblemRepository.class);
        assignmentUserRepo = Mockito.mock(AssignmentUserRepository.class);
        AssignmentAttemptRepository assignmentAttemptRepo = Mockito.mock(AssignmentAttemptRepository.class);
        problemRepo = Mockito.mock(ProblemRepository.class);
        userRepo = Mockito.mock(UserRepository.class);
        userSubmissionRepo = Mockito.mock(UserSubmissionRepository.class);
        UserActivityRepository activityRepo = Mockito.mock(UserActivityRepository.class);
        activityService = new ActivityService(activityRepo);
        AssignmentCreatorVerificationService creatorVerificationService = Mockito.mock(AssignmentCreatorVerificationService.class);
        when(creatorVerificationService.isUserApprovedCreator(any(User.class))).thenReturn(true);
        EmailService emailService = Mockito.mock(EmailService.class);
        ExamRecordingRepository examRecordingRepo = Mockito.mock(ExamRecordingRepository.class);
        AssignmentExamService assignmentExamService = Mockito.mock(AssignmentExamService.class);

        assignmentService = new AssignmentService(
                assignmentRepo,
                assignmentProblemRepo,
                assignmentUserRepo,
                assignmentAttemptRepo,
                problemRepo,
                userRepo,
                userSubmissionRepo,
                activityService,
                creatorVerificationService,
                emailService,
                examRecordingRepo,
                assignmentExamService
        );


        creatorUser = new User();
        creatorUser.setId(10L);
        creatorUser.setUsername("prof_john");
        creatorUser.setName("Professor John");
        creatorUser.setRole(Role.USER);

        student1 = new User();
        student1.setId(20L);
        student1.setUsername("student_alice");
        student1.setName("Alice");
        student1.setRole(Role.USER);

        student2 = new User();
        student2.setId(21L);
        student2.setUsername("student_bob");
        student2.setName("Bob");
        student2.setRole(Role.USER);

        hackerUser = new User();
        hackerUser.setId(99L);
        hackerUser.setUsername("hacker");
        hackerUser.setRole(Role.USER);

        problem1 = new Problem();
        problem1.setId(101L);
        problem1.setTitle("Two Sum");
        problem1.setDifficulty("EASY");

        problem2 = new Problem();
        problem2.setId(102L);
        problem2.setTitle("LRU Cache");
        problem2.setDifficulty("HARD");
    }

    @Test
    @DisplayName("User can create an assignment with selected problems and assignees")
    public void testCreateAssignment() {
        AssignmentRequestDto req = new AssignmentRequestDto();
        req.setTitle("Week 1 Homework");
        req.setDescription("Complete Two Sum and LRU Cache");
        req.setDueDate(LocalDateTime.now().plusDays(7));
        req.setProblemIds(List.of(101L, 102L));
        req.setUserIds(List.of(20L, 21L));

        when(problemRepo.findById(101L)).thenReturn(Optional.of(problem1));
        when(problemRepo.findById(102L)).thenReturn(Optional.of(problem2));
        when(userRepo.findById(20L)).thenReturn(Optional.of(student1));
        when(userRepo.findById(21L)).thenReturn(Optional.of(student2));
        when(assignmentRepo.save(any(Assignment.class))).thenAnswer(invocation -> {
            Assignment a = invocation.getArgument(0);
            a.setId(1L);
            return a;
        });

        AssignmentDto result = assignmentService.createAssignment(req, creatorUser);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("Week 1 Homework", result.getTitle());
        assertEquals("prof_john", result.getCreatorUsername());

        verify(assignmentRepo, times(1)).save(any(Assignment.class));
        verify(assignmentProblemRepo, times(2)).save(any(AssignmentProblem.class));
        verify(assignmentUserRepo, times(2)).save(any(AssignmentUser.class));
    }

    @Test
    @DisplayName("Assigned student sees real calculated progress from accepted submissions")
    public void testAssignedProgressCalculation() {
        Assignment assignment = new Assignment();
        assignment.setId(1L);
        assignment.setTitle("Algorithms Lab");
        assignment.setCreator(creatorUser);
        assignment.setDueDate(LocalDateTime.now().plusDays(5));

        AssignmentProblem ap1 = new AssignmentProblem(assignment, problem1, 1, 100);
        AssignmentProblem ap2 = new AssignmentProblem(assignment, problem2, 2, 100);

        when(assignmentRepo.findAssignedToUserId(20L)).thenReturn(List.of(assignment));
        when(assignmentProblemRepo.findByAssignmentIdOrderByProblemOrderAsc(1L)).thenReturn(List.of(ap1, ap2));
        when(assignmentUserRepo.countByAssignmentId(1L)).thenReturn(1L);

        // Student 1 has solved problem1 (Two Sum) with ACCEPTED status, but not problem2
        when(userSubmissionRepo.findSolvedProblemIdsByUserId(20L, "ACCEPTED")).thenReturn(List.of(101L));

        List<AssignmentDto> assignedList = assignmentService.getAssignmentsAssignedToUser(student1);

        assertEquals(1, assignedList.size());
        AssignmentDto item = assignedList.get(0);
        assertEquals(1, item.getSolvedCount());
        assertEquals(2, item.getProblemCount());
        assertEquals(50.0, item.getProgressPercent());
        assertFalse(item.isCompleted());
    }

    @Test
    @DisplayName("Assigned student with all problems solved sees COMPLETED status (100%)")
    public void testAssignedCompletedStatus() {
        Assignment assignment = new Assignment();
        assignment.setId(1L);
        assignment.setTitle("Algorithms Lab");
        assignment.setCreator(creatorUser);
        assignment.setDueDate(LocalDateTime.now().plusDays(5));

        AssignmentProblem ap1 = new AssignmentProblem(assignment, problem1, 1, 100);
        AssignmentProblem ap2 = new AssignmentProblem(assignment, problem2, 2, 100);

        when(assignmentRepo.findAssignedToUserId(20L)).thenReturn(List.of(assignment));
        when(assignmentProblemRepo.findByAssignmentIdOrderByProblemOrderAsc(1L)).thenReturn(List.of(ap1, ap2));
        when(assignmentUserRepo.countByAssignmentId(1L)).thenReturn(1L);

        // Student 1 has solved BOTH problems
        when(userSubmissionRepo.findSolvedProblemIdsByUserId(20L, "ACCEPTED")).thenReturn(List.of(101L, 102L));

        List<AssignmentDto> assignedList = assignmentService.getAssignmentsAssignedToUser(student1);

        assertEquals(1, assignedList.size());
        AssignmentDto item = assignedList.get(0);
        assertEquals(2, item.getSolvedCount());
        assertEquals(2, item.getProblemCount());
        assertEquals(100.0, item.getProgressPercent());
        assertTrue(item.isCompleted());
    }

    @Test
    @DisplayName("Non-creator and non-admin CANNOT delete an assignment (Ownership security)")
    public void testNonCreatorCannotDeleteAssignment() {
        Assignment assignment = new Assignment();
        assignment.setId(1L);
        assignment.setTitle("Private Assignment");
        assignment.setCreator(creatorUser);

        when(assignmentRepo.findById(1L)).thenReturn(Optional.of(assignment));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            assignmentService.deleteAssignment(1L, hackerUser);
        });

        assertTrue(ex.getMessage().contains("Access denied"));
        verify(assignmentRepo, never()).delete(any(Assignment.class));
    }

    @Test
    @DisplayName("Creator CAN delete an assignment successfully")
    public void testCreatorCanDeleteAssignment() {
        Assignment assignment = new Assignment();
        assignment.setId(1L);
        assignment.setTitle("Old Assignment");
        assignment.setCreator(creatorUser);

        when(assignmentRepo.findById(1L)).thenReturn(Optional.of(assignment));

        assertDoesNotThrow(() -> {
            assignmentService.deleteAssignment(1L, creatorUser);
        });

        verify(assignmentRepo, times(1)).delete(assignment);
    }

    @Test
    @DisplayName("Unverified or Pending user CANNOT create an assignment (Backend enforcement)")
    public void testUnverifiedUserCannotCreateAssignment() {
        AssignmentCreatorVerificationService unverifiedMock = Mockito.mock(AssignmentCreatorVerificationService.class);
        when(unverifiedMock.isUserApprovedCreator(any(User.class))).thenReturn(false);

        AssignmentService serviceWithUnverified = new AssignmentService(
                assignmentRepo,
                assignmentProblemRepo,
                assignmentUserRepo,
                Mockito.mock(AssignmentAttemptRepository.class),
                problemRepo,
                userRepo,
                userSubmissionRepo,
                activityService,
                unverifiedMock,
                Mockito.mock(EmailService.class),
                Mockito.mock(ExamRecordingRepository.class),
                Mockito.mock(AssignmentExamService.class)
        );

        AssignmentRequestDto req = new AssignmentRequestDto();
        req.setTitle("Midterm Exam");
        req.setProblemIds(List.of(101L));
        req.setUserIds(List.of(20L));

        User unverifiedUser = new User();
        unverifiedUser.setId(88L);
        unverifiedUser.setUsername("unverified_user");
        unverifiedUser.setHostVerificationStatus("NOT_VERIFIED");

        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            serviceWithUnverified.createAssignment(req, unverifiedUser);
        });

        assertTrue(ex.getMessage().contains("Host Verification Required"));
        verify(assignmentRepo, never()).save(any(Assignment.class));
    }

    @Test
    @DisplayName("HOST_VERIFIED user can create multiple assignments without repeating verification")
    public void testHostVerifiedUserCanCreateMultipleAssignments() {
        AssignmentRequestDto req1 = new AssignmentRequestDto();
        req1.setTitle("Week 1 Quiz");
        req1.setProblemIds(List.of(101L));
        req1.setUserIds(List.of(20L));

        AssignmentRequestDto req2 = new AssignmentRequestDto();
        req2.setTitle("Week 2 Exam");
        req2.setProblemIds(List.of(102L));
        req2.setUserIds(List.of(21L));

        when(problemRepo.findAllById(any())).thenReturn(List.of(problem1));
        when(userRepo.findAllById(any())).thenReturn(List.of(student1));
        when(assignmentRepo.save(any(Assignment.class))).thenAnswer(i -> {
            Assignment a = i.getArgument(0);
            a.setId(50L);
            return a;
        });

        creatorUser.setHostVerificationStatus("HOST_VERIFIED");

        AssignmentDto res1 = assignmentService.createAssignment(req1, creatorUser);
        assertNotNull(res1);
        assertEquals("Week 1 Quiz", res1.getTitle());

        AssignmentDto res2 = assignmentService.createAssignment(req2, creatorUser);
        assertNotNull(res2);
        assertEquals("Week 2 Exam", res2.getTitle());

        verify(assignmentRepo, times(2)).save(any(Assignment.class));
    }
}
