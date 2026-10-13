package infosys.onlinecodeplate.controller;

import infosys.onlinecodeplate.dto.AppDtos.*;
import infosys.onlinecodeplate.entity.User;
import infosys.onlinecodeplate.repository.UserRepository;
import infosys.onlinecodeplate.service.AssignmentExamService;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/assignments")
public class AssignmentExamController {

    private final AssignmentExamService examService;
    private final UserRepository userRepo;

    public AssignmentExamController(AssignmentExamService examService, UserRepository userRepo) {
        this.examService = examService;
        this.userRepo = userRepo;
    }

    private User getAuthenticatedUser(Authentication auth) {
        if (auth == null || auth.getName() == null) {
            throw new RuntimeException("User not authenticated.");
        }
        return userRepo.findByEmailOrUsername(auth.getName(), auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found with identity " + auth.getName()));
    }

    private User getOptionalAuthenticatedUser(Authentication auth) {
        if (auth == null || auth.getName() == null) {
            return null;
        }
        return userRepo.findByEmailOrUsername(auth.getName(), auth.getName()).orElse(null);
    }

    @PostMapping(value = {"/{id}/exam/verify-code", "/{id}/verify-code"})
    public ResponseEntity<ExamCodeVerificationResponseDto> verifyExamCode(
            @PathVariable("id") Long assignmentId,
            @Valid @RequestBody ExamCodeVerificationRequestDto req,
            Authentication auth) {
        User user = getOptionalAuthenticatedUser(auth);
        return ResponseEntity.ok(examService.verifyExamAccessCode(assignmentId, req.getCode(), user));
    }

    @PostMapping(value = {"/{id}/exam/verify-identity", "/{id}/verify-identity"})
    public ResponseEntity<ParticipantIdentityVerificationResponseDto> verifyParticipantIdentity(
            @PathVariable("id") Long assignmentId,
            @Valid @RequestBody ParticipantIdentityVerificationRequestDto req,
            Authentication auth) {
        User user = getAuthenticatedUser(auth);
        return ResponseEntity.ok(examService.verifyParticipantIdentity(
                assignmentId, req.getUsername(), req.getEmail(), req.getGender(), user
        ));
    }

    @PostMapping("/{id}/attempts")
    public ResponseEntity<AssignmentAttemptDto> startOrResumeAttempt(
            @PathVariable("id") Long assignmentId,
            Authentication auth) {
        User user = getAuthenticatedUser(auth);
        return ResponseEntity.ok(examService.startOrResumeAttempt(assignmentId, user));
    }

    @GetMapping("/{id}/attempts/current")
    public ResponseEntity<AssignmentAttemptDto> getCurrentAttempt(
            @PathVariable("id") Long assignmentId,
            Authentication auth) {
        User user = getAuthenticatedUser(auth);
        AssignmentAttemptDto dto = examService.getAttemptStatus(assignmentId, user);
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/{id}/attempts/{attemptId}/events")
    public ResponseEntity<AssignmentAttemptDto> recordIntegrityEvent(
            @PathVariable("id") Long assignmentId,
            @PathVariable("attemptId") Long attemptId,
            @RequestBody IntegrityEventDto eventDto,
            Authentication auth) {
        User user = getAuthenticatedUser(auth);
        return ResponseEntity.ok(examService.recordIntegrityEvent(attemptId, eventDto, user));
    }

    @PostMapping(value = "/{id}/attempts/{attemptId}/recordings", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ExamRecordingDto> uploadExamRecording(
            @PathVariable("id") Long assignmentId,
            @PathVariable("attemptId") Long attemptId,
            @RequestParam("type") String type,
            @RequestParam("file") MultipartFile file,
            Authentication auth) {
        User user = getAuthenticatedUser(auth);
        return ResponseEntity.ok(examService.saveExamRecording(attemptId, type, file, user));
    }

    @GetMapping("/{id}/attempts/{attemptId}/recordings")
    public ResponseEntity<List<ExamRecordingDto>> getAttemptRecordings(
            @PathVariable("id") Long assignmentId,
            @PathVariable("attemptId") Long attemptId,
            Authentication auth) {
        User user = getAuthenticatedUser(auth);
        return ResponseEntity.ok(examService.getAttemptRecordings(attemptId, user));
    }

    @GetMapping("/{id}/recordings/{recordingId}/stream")
    public ResponseEntity<Resource> streamRecording(
            @PathVariable("id") Long assignmentId,
            @PathVariable("recordingId") Long recordingId,
            Authentication auth) {
        User user = getAuthenticatedUser(auth);
        Resource resource = examService.getRecordingStreamResource(recordingId, user);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("video/webm"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"recording_" + recordingId + ".webm\"")
                .body(resource);
    }

    @PostMapping("/{id}/attempts/{attemptId}/submit")
    public ResponseEntity<AssignmentAttemptDto> submitAttempt(
            @PathVariable("id") Long assignmentId,
            @PathVariable("attemptId") Long attemptId,
            Authentication auth) {
        User user = getAuthenticatedUser(auth);
        return ResponseEntity.ok(examService.submitAttempt(attemptId, user));
    }

    @GetMapping("/{id}/attempts/{attemptId}/integrity")
    public ResponseEntity<IntegrityReportDto> getIntegrityReport(
            @PathVariable("id") Long assignmentId,
            @PathVariable("attemptId") Long attemptId,
            Authentication auth) {
        User user = getAuthenticatedUser(auth);
        return ResponseEntity.ok(examService.getIntegrityReport(attemptId, user));
    }
}
