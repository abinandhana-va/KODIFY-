package infosys.onlinecodeplate.controller;

import infosys.onlinecodeplate.dto.AppDtos.AssignmentDto;
import infosys.onlinecodeplate.dto.AppDtos.AssignmentParticipantProgressDto;
import infosys.onlinecodeplate.dto.AppDtos.IntegrityReportDto;
import infosys.onlinecodeplate.entity.User;
import infosys.onlinecodeplate.repository.UserRepository;
import infosys.onlinecodeplate.service.AssignmentExamService;
import infosys.onlinecodeplate.service.AssignmentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/assignments")
@PreAuthorize("hasAuthority('ADMIN')")
public class AdminAssignmentController {

    private final AssignmentService assignmentService;
    private final AssignmentExamService examService;
    private final UserRepository userRepo;

    public AdminAssignmentController(AssignmentService assignmentService,
                                     AssignmentExamService examService,
                                     UserRepository userRepo) {
        this.assignmentService = assignmentService;
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

    @GetMapping
    public ResponseEntity<List<AssignmentDto>> getAllAssignments() {
        return ResponseEntity.ok(assignmentService.getAllAssignmentsForAdmin());
    }

    @GetMapping("/{id}/attempts")
    public ResponseEntity<List<AssignmentParticipantProgressDto>> getAssignmentAttempts(@PathVariable("id") Long assignmentId,
                                                                                        Authentication auth) {
        User user = getAuthenticatedUser(auth);
        return ResponseEntity.ok(assignmentService.getAssignmentParticipantsProgress(assignmentId, user));
    }

    @GetMapping("/{id}/attempts/{attemptId}/integrity")
    public ResponseEntity<IntegrityReportDto> getIntegrityReport(@PathVariable("id") Long assignmentId,
                                                                @PathVariable("attemptId") Long attemptId,
                                                                Authentication auth) {
        User user = getAuthenticatedUser(auth);
        return ResponseEntity.ok(examService.getIntegrityReport(attemptId, user));
    }
}
