package infosys.onlinecodeplate.controller;

import infosys.onlinecodeplate.dto.AppDtos.*;
import infosys.onlinecodeplate.entity.User;
import infosys.onlinecodeplate.repository.UserRepository;
import infosys.onlinecodeplate.service.AssignmentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

import infosys.onlinecodeplate.service.FileStorageService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/assignments")
public class AssignmentController {

    private final AssignmentService assignmentService;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    public AssignmentController(AssignmentService assignmentService, UserRepository userRepository, FileStorageService fileStorageService) {
        this.assignmentService = assignmentService;
        this.userRepository = userRepository;
        this.fileStorageService = fileStorageService;
    }

    @GetMapping("/my-created")
    public ResponseEntity<List<AssignmentDto>> getMyCreatedAssignments(Authentication auth) {
        User user = userRepository.findByEmailOrUsername(auth.getName(), auth.getName()).orElseThrow();
        return ResponseEntity.ok(assignmentService.getAssignmentsCreatedByUser(user));
    }

    @GetMapping("/my-assigned")
    public ResponseEntity<List<AssignmentDto>> getMyAssignedAssignments(Authentication auth) {
        User user = userRepository.findByEmailOrUsername(auth.getName(), auth.getName()).orElseThrow();
        return ResponseEntity.ok(assignmentService.getAssignmentsAssignedToUser(user));
    }

    /**
     * @param id
     * @return
     */
    @GetMapping("/{id}/invitation-info")
    public ResponseEntity<?> getAssignmentInvitationInfo(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(assignmentService.getAssignmentPublicInvitationInfo(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getAssignmentDetail(@PathVariable Long id, Authentication auth) {
        try {
            User user = userRepository.findByEmailOrUsername(auth.getName(), auth.getName()).orElseThrow();
            return ResponseEntity.ok(assignmentService.getAssignmentDetail(id, user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> createAssignment(@Valid @RequestBody AssignmentRequestDto req, Authentication auth) {
        try {
            User user = userRepository.findByEmailOrUsername(auth.getName(), auth.getName()).orElseThrow();
            return ResponseEntity.ok(assignmentService.createAssignment(req, user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateAssignment(@PathVariable Long id, @Valid @RequestBody AssignmentRequestDto req, Authentication auth) {
        try {
            User user = userRepository.findByEmailOrUsername(auth.getName(), auth.getName()).orElseThrow();
            return ResponseEntity.ok(assignmentService.updateAssignment(id, req, user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAssignment(@PathVariable Long id, Authentication auth) {
        try {
            User user = userRepository.findByEmailOrUsername(auth.getName(), auth.getName()).orElseThrow();
            assignmentService.deleteAssignment(id, user);
            return ResponseEntity.ok(Map.of("message", "Assignment deleted successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{id}/progress")
    public ResponseEntity<?> getParticipantsProgress(@PathVariable Long id, Authentication auth) {
        try {
            User user = userRepository.findByEmailOrUsername(auth.getName(), auth.getName()).orElseThrow();
            return ResponseEntity.ok(assignmentService.getAssignmentParticipantsProgress(id, user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{id}/report")
    public ResponseEntity<?> getAssignmentReport(@PathVariable Long id, Authentication auth) {
        try {
            User user = userRepository.findByEmailOrUsername(auth.getName(), auth.getName()).orElseThrow();
            return ResponseEntity.ok(assignmentService.getAssignmentReport(id, user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{id}/my-review")
    public ResponseEntity<?> getMyAssignmentReview(@PathVariable Long id, Authentication auth) {
        try {
            User user = userRepository.findByEmailOrUsername(auth.getName(), auth.getName()).orElseThrow();
            return ResponseEntity.ok(assignmentService.getParticipantAssignmentReview(id, user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{id}/participants/{userId}/review")
    public ResponseEntity<?> getParticipantReviewByCreator(@PathVariable Long id, @PathVariable Long userId, Authentication auth) {
        try {
            User user = userRepository.findByEmailOrUsername(auth.getName(), auth.getName()).orElseThrow();
            return ResponseEntity.ok(assignmentService.getParticipantAssignmentReviewForCreator(id, userId, user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/invite-all")
    public ResponseEntity<?> inviteAllUsers(@PathVariable Long id, Authentication auth) {
        try {
            User user = userRepository.findByEmailOrUsername(auth.getName(), auth.getName()).orElseThrow();
            return ResponseEntity.ok(assignmentService.inviteAllEligibleUsers(id, user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/questions/custom")
    public ResponseEntity<?> createCustomQuestion(@Valid @RequestBody CreateCustomQuestionDto req, Authentication auth) {
        try {
            User user = userRepository.findByEmailOrUsername(auth.getName(), auth.getName()).orElseThrow();
            return ResponseEntity.ok(assignmentService.createCustomQuestionForAssignment(req, user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping(value = "/questions/upload-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadQuestionImage(@RequestParam("image") MultipartFile image, Authentication auth) {
        try {
            User user = userRepository.findByEmailOrUsername(auth.getName(), auth.getName()).orElseThrow();
            String imageUrl = fileStorageService.storeQuestionImage(image, user.getId());
            return ResponseEntity.ok(Map.of("imageUrl", imageUrl));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/questions/images/{filename:.+}")
    public ResponseEntity<Resource> getQuestionImage(@PathVariable String filename) {
        try {
            Resource file = fileStorageService.loadAsResource("question-images/" + filename);
            String contentType = "image/png";
            String lower = filename.toLowerCase();
            if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) contentType = "image/jpeg";
            else if (lower.endsWith(".webp")) contentType = "image/webp";
            else if (lower.endsWith(".svg")) contentType = "image/svg+xml";
            else if (lower.endsWith(".gif")) contentType = "image/gif";

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CACHE_CONTROL, "max-age=86400")
                    .body(file);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
