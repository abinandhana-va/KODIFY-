package infosys.onlinecodeplate.service;

import infosys.onlinecodeplate.dto.AppDtos.*;
import infosys.onlinecodeplate.entity.*;
import infosys.onlinecodeplate.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AssignmentExamSecurityTest {

    @Mock
    private AssignmentRepository assignmentRepo;

    @Mock
    private AssignmentProblemRepository assignmentProblemRepo;

    @Mock
    private AssignmentUserRepository assignmentUserRepo;

    @Mock
    private AssignmentAttemptRepository attemptRepo;

    @Mock
    private IntegrityEventRepository integrityRepo;

    @Mock
    private ExamRecordingRepository examRecordingRepo;

    @Mock
    private ProblemRepository problemRepo;

    @Mock
    private UserSubmissionRepository userSubmissionRepo;

    @Mock
    private ActivityService activityService;

    @Mock
    private FileStorageService fileStorageService;

    @Mock
    private AssignmentCreatorVerificationRepository creatorVerificationRepo;

    @InjectMocks
    private AssignmentExamService examService;

    private User candidate;
    private Assignment secureAssignment;
    private AssignmentUser assignmentUser;
    private AssignmentAttempt activeAttempt;

    @BeforeEach
    void setUp() {
        candidate = new User();
        candidate.setId(20L);
        candidate.setUsername("anand");
        candidate.setEmail("anand@kodify.dev");
        candidate.setRole(Role.USER);

        secureAssignment = new Assignment();
        secureAssignment.setId(100L);
        secureAssignment.setTitle("Data Structures Final Exam");
        secureAssignment.setSecureMode(true);
        secureAssignment.setDurationMinutes(90);
        secureAssignment.setAllowedAttempts(1);

        assignmentUser = new AssignmentUser(secureAssignment, candidate);
        assignmentUser.setId(200L);
        assignmentUser.setAccessCode("EXAM9988");
        assignmentUser.setCodeIssuedAt(LocalDateTime.now().minusHours(1));
        assignmentUser.setCodeExpiresAt(LocalDateTime.now().plusDays(3));

        activeAttempt = new AssignmentAttempt();
        activeAttempt.setId(300L);
        activeAttempt.setAssignment(secureAssignment);
        activeAttempt.setUser(candidate);
        activeAttempt.setStatus("IN_PROGRESS");
        activeAttempt.setStartedAt(LocalDateTime.now());
        activeAttempt.setExpiresAt(LocalDateTime.now().plusMinutes(90));
        activeAttempt.setTotalQuestions(3);
        activeAttempt.setIntegrityViolationCount(0);
        activeAttempt.setFlaggedForReview(false);
    }

    @Test
    void testVerifyAccessCode_ValidCode_ReturnsTrue() {
        when(assignmentRepo.findById(100L)).thenReturn(Optional.of(secureAssignment));
        when(assignmentUserRepo.findByAssignmentIdAndUserId(100L, 20L)).thenReturn(Optional.of(assignmentUser));

        ExamCodeVerificationResponseDto res = examService.verifyExamAccessCode(100L, "EXAM9988", candidate);

        assertTrue(res.isValid());
        assertEquals("Assignment code verified successfully.", res.getMessage());
        assertEquals("CODE_VERIFIED", assignmentUser.getStatus());
    }

    @Test
    void testVerifyAccessCode_InvalidCode_ThrowsException() {
        when(assignmentRepo.findById(100L)).thenReturn(Optional.of(secureAssignment));
        when(assignmentUserRepo.findByAssignmentIdAndUserId(100L, 20L)).thenReturn(Optional.of(assignmentUser));

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                examService.verifyExamAccessCode(100L, "WRONG123", candidate)
        );

        assertTrue(ex.getMessage().contains("Invalid assignment code"));
    }

    @Test
    void testVerifyAccessCode_DifferentAccount_ThrowsException() {
        when(assignmentRepo.findById(100L)).thenReturn(Optional.of(secureAssignment));
        when(assignmentUserRepo.findByAssignmentIdAndUserId(100L, 20L)).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                examService.verifyExamAccessCode(100L, "EXAM9988", candidate)
        );

        assertTrue(ex.getMessage().contains("This assignment invitation belongs to a different KODIFY account"));
    }

    @Test
    void testVerifyParticipantIdentity_MatchingCredentials_ReturnsTrue() {
        when(assignmentRepo.findById(100L)).thenReturn(Optional.of(secureAssignment));
        when(assignmentUserRepo.findByAssignmentIdAndUserId(100L, 20L)).thenReturn(Optional.of(assignmentUser));

        ParticipantIdentityVerificationResponseDto res = examService.verifyParticipantIdentity(
                100L, "anand", "anand@kodify.dev", "MALE", candidate
        );

        assertTrue(res.isVerified());
        assertEquals("MALE", assignmentUser.getGender());
        assertEquals("IDENTITY_VERIFIED", assignmentUser.getStatus());
    }

    @Test
    void testVerifyParticipantIdentity_MismatchedEmail_ThrowsException() {
        when(assignmentRepo.findById(100L)).thenReturn(Optional.of(secureAssignment));

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                examService.verifyParticipantIdentity(100L, "anand", "different@email.com", "MALE", candidate)
        );

        assertTrue(ex.getMessage().contains("Participant details do not match"));
    }

    @Test
    void testRecordSecurityEvent_ThreeStrikesRule_FlagsAttempt() {
        when(attemptRepo.findById(300L)).thenReturn(Optional.of(activeAttempt));
        when(attemptRepo.save(any(AssignmentAttempt.class))).thenAnswer(i -> i.getArgument(0));
        when(assignmentProblemRepo.findByAssignmentIdOrderByProblemOrderAsc(100L)).thenReturn(Collections.emptyList());
        when(assignmentUserRepo.findByAssignmentIdAndUserId(100L, 20L)).thenReturn(Optional.of(assignmentUser));

        IntegrityEventDto strike1 = new IntegrityEventDto("TAB_SWITCH", "WARNING", "User switched tab");
        IntegrityEventDto strike2 = new IntegrityEventDto("FULLSCREEN_EXIT", "WARNING", "User exited fullscreen");
        IntegrityEventDto strike3 = new IntegrityEventDto("PASTE_ATTEMPT", "WARNING", "User tried to paste code");

        examService.recordIntegrityEvent(300L, strike1, candidate);
        examService.recordIntegrityEvent(300L, strike2, candidate);
        AssignmentAttemptDto finalAttemptDto = examService.recordIntegrityEvent(300L, strike3, candidate);

        assertEquals(3, finalAttemptDto.getIntegrityViolationCount());
        assertTrue(finalAttemptDto.isFlaggedForReview(), "Attempt should be flagged for review after 3 violations");
        assertEquals("FLAGGED_FOR_REVIEW", assignmentUser.getStatus());
    }
}
