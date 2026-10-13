package infosys.onlinecodeplate.controller;

import infosys.onlinecodeplate.dto.AppDtos.TestCaseResultDto;
import infosys.onlinecodeplate.dto.AppDtos.UserSubmissionDto;
import infosys.onlinecodeplate.entity.Role;
import infosys.onlinecodeplate.entity.TestCaseResult;
import infosys.onlinecodeplate.entity.User;
import infosys.onlinecodeplate.entity.UserSubmission;
import infosys.onlinecodeplate.repository.TestCaseResultRepository;
import infosys.onlinecodeplate.repository.UserRepository;
import infosys.onlinecodeplate.repository.UserSubmissionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class SubmissionController {
    private final UserSubmissionRepository submissionRepo;
    private final UserRepository userRepository;
    private final TestCaseResultRepository testCaseResultRepo;

    public SubmissionController(UserSubmissionRepository submissionRepo, UserRepository userRepository, TestCaseResultRepository testCaseResultRepo) {
        this.submissionRepo = submissionRepo;
        this.userRepository = userRepository;
        this.testCaseResultRepo = testCaseResultRepo;
    }

    // Normal User: Get authenticated user's own submissions
    @GetMapping("/submissions/my")
    public ResponseEntity<List<UserSubmissionDto>> getMySubmissions(Authentication auth) {
        User user = userRepository.findByEmailOrUsername(auth.getName(), auth.getName()).orElseThrow();
        List<UserSubmission> submissions = submissionRepo.findByUserIdOrderByCreatedAtDesc(user.getId());
        return ResponseEntity.ok(submissions.stream().map(s -> mapToDto(s, user.getRole() == Role.ADMIN)).collect(Collectors.toList()));
    }

    // Single Submission Details (Ownership enforced)
    @GetMapping("/submissions/{id}")
    public ResponseEntity<?> getSubmissionDetails(@PathVariable Long id, Authentication auth) {
        User user = userRepository.findByEmailOrUsername(auth.getName(), auth.getName()).orElseThrow();
        UserSubmission submission = submissionRepo.findById(id).orElseThrow(() -> new RuntimeException("Submission not found"));

        // Security check: User can only view their own submission unless ADMIN
        boolean isAdmin = user.getRole() == Role.ADMIN;
        if (!isAdmin && !submission.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied. You can only view your own submissions.");
        }

        return ResponseEntity.ok(mapToDto(submission, isAdmin));
    }

    // Admin: Get all submissions from all users
    @GetMapping("/admin/submissions")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<UserSubmissionDto>> getAllSubmissionsForAdmin() {
        List<UserSubmission> submissions = submissionRepo.findAllByOrderByCreatedAtDesc();
        return ResponseEntity.ok(submissions.stream().map(s -> mapToDto(s, true)).collect(Collectors.toList()));
    }

    private UserSubmissionDto mapToDto(UserSubmission s, boolean isAdmin) {
        UserSubmissionDto dto = new UserSubmissionDto();
        dto.setId(s.getId());
        if (s.getUser() != null) {
            dto.setUserId(s.getUser().getId());
            dto.setUsername(s.getUser().getUsername());
            dto.setName(s.getUser().getName());
        }
        if (s.getProblem() != null) {
            dto.setProblemId(s.getProblem().getId());
            dto.setProblemTitle(s.getProblem().getTitle());
            dto.setConcept(s.getProblem().getConcept());
            dto.setDifficulty(s.getProblem().getDifficulty());
        }
        dto.setLanguage(s.getLanguage());
        dto.setCode(s.getCode());
        dto.setStatus(s.getStatus());
        dto.setRuntime(s.getRuntime());
        dto.setPassedTestCases(s.getPassedTestCases());
        dto.setTotalTestCases(s.getTotalTestCases());
        dto.setCreatedAt(s.getCreatedAt());

        // Fetch per-test-case results
        List<TestCaseResult> tcResults = testCaseResultRepo.findBySubmissionId(s.getId());
        List<TestCaseResultDto> tcResultDtos = new ArrayList<>();
        for (TestCaseResult tcr : tcResults) {
            boolean isHidden = tcr.getTestCase() != null && tcr.getTestCase().getHidden() != null && tcr.getTestCase().getHidden();
            tcResultDtos.add(new TestCaseResultDto(
                tcr.getTestCase() != null ? tcr.getTestCase().getId() : null,
                tcr.isPassed(),
                tcr.getRuntime(),
                tcr.getStatus(),
                (!isAdmin && isHidden) ? null : tcr.getActualOutput(),
                (!isAdmin && isHidden) ? null : (tcr.getTestCase() != null ? tcr.getTestCase().getInput() : null),
                (!isAdmin && isHidden) ? null : (tcr.getTestCase() != null ? tcr.getTestCase().getExpectedOutput() : null),
                isHidden
            ));
        }
        dto.setTestCaseResults(tcResultDtos);

        return dto;
    }
}
