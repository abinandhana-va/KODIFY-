package infosys.onlinecodeplate.controller;

import infosys.onlinecodeplate.dto.AppDtos.EditorialResponseDto;
import infosys.onlinecodeplate.dto.AppDtos.HintDto;
import infosys.onlinecodeplate.dto.AppDtos.ProblemDto;
import infosys.onlinecodeplate.dto.AppDtos.RunRequestDto;
import infosys.onlinecodeplate.dto.AppDtos.RunResponseDto;
import infosys.onlinecodeplate.dto.AppDtos.SolutionResponseDto;
import infosys.onlinecodeplate.dto.AppDtos.SubmissionRequestDto;
import infosys.onlinecodeplate.dto.AppDtos.SubmissionResponseDto;
import infosys.onlinecodeplate.dto.AppDtos.TestCaseDto;
import infosys.onlinecodeplate.dto.AppDtos.TestCaseResultDto;
import infosys.onlinecodeplate.entity.Problem;
import infosys.onlinecodeplate.entity.ProblemHint;
import infosys.onlinecodeplate.entity.Role;
import infosys.onlinecodeplate.entity.TestCase;
import infosys.onlinecodeplate.entity.TestCaseResult;
import infosys.onlinecodeplate.entity.User;
import infosys.onlinecodeplate.entity.UserSubmission;
import infosys.onlinecodeplate.repository.ProblemRepository;
import infosys.onlinecodeplate.repository.TestCaseResultRepository;
import infosys.onlinecodeplate.repository.UserRepository;
import infosys.onlinecodeplate.repository.UserSubmissionRepository;
import infosys.onlinecodeplate.service.ActivityService;
import infosys.onlinecodeplate.service.DockerSandboxService;
import infosys.onlinecodeplate.service.DockerSandboxService.EvaluationResult;
import infosys.onlinecodeplate.service.DockerSandboxService.TestCaseResultItem;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/problems")
public class ProblemController {
    private final ProblemRepository problemRepo;
    private final UserRepository userRepository;
    private final UserSubmissionRepository submissionRepo;
    private final TestCaseResultRepository testCaseResultRepo;
    private final ActivityService activityService;
    private final DockerSandboxService dockerSandboxService;
    private final infosys.onlinecodeplate.service.BadgeService badgeService;
    private final infosys.onlinecodeplate.service.EmailService emailService;

    private static final String DEFAULT_STARTER_C = "#include <stdio.h>\n\nint main() {\n    // Write your C solution here\n    printf(\"Hello Kodify\\n\");\n    return 0;\n}\n";
    private static final String DEFAULT_STARTER_PYTHON = "# Write your Python solution here\ndef solution():\n    pass\n\nif __name__ == \"__main__\":\n    solution()\n";
    private static final String DEFAULT_STARTER_JAVA = "public class Solution {\n    public static void main(String[] args) {\n        // Write your Java solution here\n        System.out.println(\"Hello Kodify\");\n    }\n}\n";

    @org.springframework.beans.factory.annotation.Autowired
    public ProblemController(ProblemRepository problemRepo,
                             UserRepository userRepository,
                             UserSubmissionRepository submissionRepo,
                             TestCaseResultRepository testCaseResultRepo,
                             ActivityService activityService,
                             DockerSandboxService dockerSandboxService,
                             infosys.onlinecodeplate.service.BadgeService badgeService,
                             infosys.onlinecodeplate.service.EmailService emailService) {
        this.problemRepo = problemRepo;
        this.userRepository = userRepository;
        this.submissionRepo = submissionRepo;
        this.testCaseResultRepo = testCaseResultRepo;
        this.activityService = activityService;
        this.dockerSandboxService = dockerSandboxService;
        this.badgeService = badgeService;
        this.emailService = emailService;
    }

    @GetMapping
    public ResponseEntity<List<ProblemDto>> getAllProblems() {
        return ResponseEntity.ok(problemRepo.findPublicProblems().stream().map(this::mapToUserDto).collect(Collectors.toList()));
    }

    @GetMapping("/topics")
    public ResponseEntity<List<String>> getTopics() {
        List<String> topics = problemRepo.findAll().stream()
                .flatMap(p -> p.getConcepts().stream())
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(this::normalizeTopic)
                .distinct()
                .sorted()
                .collect(Collectors.toList());
        return ResponseEntity.ok(topics);
    }

    @GetMapping("/user-progress")
    public ResponseEntity<List<Long>> getUserSolvedProblemIds(Authentication auth) {
        User user = userRepository.findByEmailOrUsername(auth.getName(), auth.getName()).orElseThrow();
        List<Long> solvedIds = submissionRepo.findSolvedProblemIdsByUserId(user.getId(), "ACCEPTED");
        return ResponseEntity.ok(solvedIds);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProblemDto> getProblem(@PathVariable Long id, Authentication auth) {
        Problem p = problemRepo.findById(id).orElseThrow(() -> new RuntimeException("Problem not found"));
        return ResponseEntity.ok(mapToUserDto(p));
    }

    @GetMapping("/{id}/solution")
    public ResponseEntity<?> getProblemSolution(@PathVariable Long id, Authentication auth) {
        Problem p = problemRepo.findById(id).orElseThrow(() -> new RuntimeException("Problem not found"));
        User user = userRepository.findByEmailOrUsername(auth.getName(), auth.getName()).orElseThrow();

        boolean isAdmin = Role.ADMIN.equals(user.getRole());
        boolean hasAttempted = submissionRepo.existsByUserIdAndProblemId(user.getId(), id);

        if (!isAdmin && !hasAttempted) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Solution locked. Submit at least one attempt first.");
        }

        SolutionResponseDto dto = new SolutionResponseDto();
        dto.setProblemId(p.getId());
        dto.setProblemTitle(p.getTitle());

        boolean hasC = hasContent(p.getSolutionC());
        boolean hasPy = hasContent(p.getSolutionPython());
        boolean hasJava = hasContent(p.getSolutionJava());

        dto.setHasSolutionC(hasC);
        dto.setHasSolutionPython(hasPy);
        dto.setHasSolutionJava(hasJava);

        dto.setSolutionC(hasC ? p.getSolutionC() : null);
        dto.setSolutionPython(hasPy ? p.getSolutionPython() : null);
        dto.setSolutionJava(hasJava ? p.getSolutionJava() : null);

        return ResponseEntity.ok(dto);
    }

    @GetMapping("/{id}/editorial")
    public ResponseEntity<?> getProblemEditorial(@PathVariable Long id, Authentication auth) {
        Problem p = problemRepo.findById(id).orElseThrow(() -> new RuntimeException("Problem not found"));
        User user = userRepository.findByEmailOrUsername(auth.getName(), auth.getName()).orElseThrow();

        boolean isAdmin = Role.ADMIN.equals(user.getRole());
        boolean hasAttempted = submissionRepo.existsByUserIdAndProblemId(user.getId(), id);

        if (!isAdmin && !hasAttempted) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Editorial locked. Make at least one submission attempt first.");
        }

        boolean hasEditorial = hasContent(p.getEditorial());
        String editorialContent = hasEditorial ? p.getEditorial() : "No editorial explanation available for this problem.";

        return ResponseEntity.ok(new EditorialResponseDto(p.getId(), p.getTitle(), editorialContent, hasEditorial));
    }

    @PostMapping("/{id}/run")
    public ResponseEntity<RunResponseDto> runSolution(@PathVariable Long id, @Valid @RequestBody RunRequestDto request, Authentication auth) {
        Problem p = problemRepo.findById(id).orElseThrow(() -> new RuntimeException("Problem not found"));

        if (request.getCode() == null || request.getCode().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new RunResponseDto("VALIDATION_ERROR", "Submitted code cannot be empty.", null, 0.0, 0, 0, Collections.emptyList()));
        }

        String requestedLang = request.getLanguage();
        if (!infosys.onlinecodeplate.model.LanguageRegistry.isSupported(requestedLang)) {
            return ResponseEntity.badRequest().body(new RunResponseDto("UNSUPPORTED_LANGUAGE", "Unsupported programming language: " + requestedLang, null, 0.0, 0, 0, Collections.emptyList()));
        }
        if (!p.isLanguageAllowed(requestedLang)) {
            return ResponseEntity.badRequest().body(new RunResponseDto("LANGUAGE_NOT_ALLOWED", "Selected programming language is not allowed for this question.", null, 0.0, 0, 0, Collections.emptyList()));
        }

        // Filter ONLY visible/public test cases for RUN action
        List<TestCase> visibleTestCases = p.getTestCasesList().stream()
                .filter(tc -> tc.getHidden() == null || !tc.getHidden())
                .collect(Collectors.toList());

        if (visibleTestCases.isEmpty()) {
            return ResponseEntity.ok(new RunResponseDto("NO_VISIBLE_TEST_CASES", "No visible test cases available for user testing.", null, 0.0, 0, 0, Collections.emptyList()));
        }

        // Dummy submission object (not saved in DB)
        UserSubmission dummySub = new UserSubmission();
        dummySub.setLanguage(request.getLanguage());
        dummySub.setCode(request.getCode());

        EvaluationResult evalResult = dockerSandboxService.evaluateSubmission(dummySub, visibleTestCases);

        List<TestCaseResultDto> resultDtos = new ArrayList<>();
        Map<Long, TestCase> tcMap = visibleTestCases.stream().collect(Collectors.toMap(TestCase::getId, tc -> tc, (a, b) -> a));

        int caseNum = 1;
        for (TestCaseResultItem item : evalResult.getTestCaseResults()) {
            TestCase tc = tcMap.get(item.getTestCaseId());
            if (tc != null) {
                TestCaseResultDto tcDto = new TestCaseResultDto(
                    tc.getId(),
                    item.isPassed(),
                    item.getRuntime(),
                    item.getStatus(),
                    item.getActualOutput(),
                    tc.getInput(),
                    tc.getExpectedOutput(),
                    false
                );
                tcDto.setTestCaseNumber(caseNum++);
                if (!item.isPassed()) {
                    if ("COMPILATION_ERROR".equals(evalResult.getStatus())) {
                        tcDto.setCompilationError(evalResult.getCompilerOutput());
                    } else if ("RUNTIME_ERROR".equals(item.getStatus()) || "TIMEOUT".equals(item.getStatus())) {
                        tcDto.setErrorMessage(item.getActualOutput());
                    }
                }
                resultDtos.add(tcDto);
            }
        }

        RunResponseDto response = new RunResponseDto(
            evalResult.getStatus(),
            evalResult.getMessage(),
            evalResult.getCompilerOutput(),
            evalResult.getAggregateRuntime(),
            evalResult.getPassedTestCases(),
            evalResult.getTotalTestCases(),
            resultDtos
        );
        response.setCompilationTimeMs(evalResult.getCompilationTimeMs());
        response.setAverageExecutionTimeMs(evalResult.getAverageExecutionTimeMs());
        response.setAverageCompilationTimeMs(evalResult.getAverageCompilationTimeMs());
        response.setPublicPassedCount(evalResult.getPassedTestCases());
        response.setPublicTotalCount(evalResult.getTotalTestCases());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<SubmissionResponseDto> submitSolution(@PathVariable Long id, @Valid @RequestBody SubmissionRequestDto request, Authentication auth) {
        Problem p = problemRepo.findById(id).orElseThrow(() -> new RuntimeException("Problem not found"));
        User user = userRepository.findByEmailOrUsername(auth.getName(), auth.getName()).orElseThrow();

        if (request.getCode() == null || request.getCode().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new SubmissionResponseDto(null, "VALIDATION_ERROR", "Submitted code cannot be empty.", false, LocalDateTime.now()));
        }

        String requestedLang = request.getLanguage();
        if (!"MCQ".equalsIgnoreCase(p.getQuestionType())) {
            if (!infosys.onlinecodeplate.model.LanguageRegistry.isSupported(requestedLang)) {
                return ResponseEntity.badRequest().body(new SubmissionResponseDto(null, "UNSUPPORTED_LANGUAGE", "Unsupported programming language: " + requestedLang, false, LocalDateTime.now()));
            }
            if (!p.isLanguageAllowed(requestedLang)) {
                return ResponseEntity.badRequest().body(new SubmissionResponseDto(null, "LANGUAGE_NOT_ALLOWED", "Selected programming language is not allowed for this question.", false, LocalDateTime.now()));
            }
        }

        // Save initial submission record with status PENDING
        UserSubmission submission = new UserSubmission();
        submission.setUser(user);
        submission.setProblem(p);
        submission.setLanguage(request.getLanguage() != null ? request.getLanguage() : "MCQ");
        submission.setCode(request.getCode());
        submission.setStatus("PENDING");
        submissionRepo.save(submission);

        // If Question is an MCQ, evaluate directly against correct option
        if ("MCQ".equalsIgnoreCase(p.getQuestionType())) {
            String chosen = request.getCode() != null ? request.getCode().trim() : "";
            String correct = p.getCorrectOption() != null ? p.getCorrectOption().trim() : "";
            boolean isCorrect = !correct.isEmpty() && (
                correct.equalsIgnoreCase(chosen) ||
                chosen.toUpperCase().startsWith(correct.toUpperCase())
            );
            String status = isCorrect ? "ACCEPTED" : "WRONG_ANSWER";
            submission.setStatus(status);
            submission.setRuntime(0.0);
            submission.setPassedTestCases(isCorrect ? 1 : 0);
            submission.setTotalTestCases(1);
            submissionRepo.save(submission);

            SubmissionResponseDto resp = new SubmissionResponseDto(
                submission.getId(),
                status,
                isCorrect ? "Correct answer recorded." : "Answer recorded.",
                isCorrect,
                LocalDateTime.now()
            );
            resp.setPassedTestCases(isCorrect ? 1 : 0);
            resp.setTotalTestCases(1);
            resp.setLanguage("MCQ");
            resp.setCode(chosen);
            return ResponseEntity.ok(resp);
        }

        // Execute submission in Docker Sandbox (Visible + Hidden test cases)
        List<TestCase> problemTestCases = p.getTestCasesList();
        EvaluationResult evalResult = dockerSandboxService.evaluateSubmission(submission, problemTestCases);

        // Update submission with actual evaluation outcome
        submission.setStatus(evalResult.getStatus());
        submission.setRuntime(evalResult.getAggregateRuntime());
        submission.setPassedTestCases(evalResult.getPassedTestCases());
        submission.setTotalTestCases(evalResult.getTotalTestCases());
        submissionRepo.save(submission);

        // Save TestCaseResult entities in DB and build public results + private aggregate
        List<TestCaseResultDto> publicResultDtos = new ArrayList<>();
        Map<Long, TestCase> tcMap = problemTestCases.stream().collect(Collectors.toMap(TestCase::getId, tc -> tc, (a, b) -> a));

        int publicPassed = 0;
        int publicTotal = 0;
        int privatePassed = 0;
        int privateTotal = 0;
        double privateTimeSum = 0.0;
        int privateEvaluatedCount = 0;
        int publicCaseNum = 1;

        for (TestCaseResultItem item : evalResult.getTestCaseResults()) {
            TestCase tc = tcMap.get(item.getTestCaseId());
            if (tc != null) {
                TestCaseResult tcEntity = new TestCaseResult(submission, tc, item.isPassed(), item.getActualOutput(), item.getRuntime(), item.getStatus());
                testCaseResultRepo.save(tcEntity);

                boolean isHidden = tc.getHidden() != null && tc.getHidden();
                if (isHidden) {
                    privateTotal++;
                    if (item.isPassed()) {
                        privatePassed++;
                    }
                    if (item.getRuntime() != null) {
                        privateTimeSum += item.getRuntime();
                        privateEvaluatedCount++;
                    }
                } else {
                    publicTotal++;
                    if (item.isPassed()) {
                        publicPassed++;
                    }
                    TestCaseResultDto publicDto = new TestCaseResultDto(
                        tc.getId(),
                        item.isPassed(),
                        item.getRuntime(),
                        item.getStatus(),
                        item.getActualOutput(),
                        tc.getInput(),
                        tc.getExpectedOutput(),
                        false
                    );
                    publicDto.setTestCaseNumber(publicCaseNum++);
                    if (!item.isPassed()) {
                        if ("COMPILATION_ERROR".equals(evalResult.getStatus())) {
                            publicDto.setCompilationError(evalResult.getCompilerOutput());
                        } else if ("RUNTIME_ERROR".equals(item.getStatus()) || "TIMEOUT".equals(item.getStatus())) {
                            publicDto.setErrorMessage(item.getActualOutput());
                        }
                    }
                    publicResultDtos.add(publicDto);
                }
            }
        }

        // Also count any remaining un-evaluated test cases if execution broke early on error
        for (TestCase tc : problemTestCases) {
            boolean wasEvaluated = evalResult.getTestCaseResults().stream().anyMatch(r -> r.getTestCaseId().equals(tc.getId()));
            if (!wasEvaluated) {
                if (tc.getHidden() != null && tc.getHidden()) {
                    privateTotal++;
                } else {
                    publicTotal++;
                    TestCaseResultDto unrunDto = new TestCaseResultDto(
                        tc.getId(),
                        false,
                        0.0,
                        "SKIPPED",
                        "Execution aborted due to previous error.",
                        tc.getInput(),
                        tc.getExpectedOutput(),
                        false
                    );
                    unrunDto.setTestCaseNumber(publicCaseNum++);
                    publicResultDtos.add(unrunDto);
                }
            }
        }

        boolean isSolved = "ACCEPTED".equals(evalResult.getStatus());

        // Update user statistics & log activity ONLY when problem is ACCEPTED
        if (isSolved) {
            List<Long> previouslySolvedIds = submissionRepo.findSolvedProblemIdsByUserId(user.getId(), "ACCEPTED");
            // If this is the first time solving this problem
            if (previouslySolvedIds == null || !previouslySolvedIds.contains(p.getId())) {
                String activityDesc = "Solved Problem #" + p.getId() + " – " + p.getTitle() + " | Topic: " + normalizeTopic(p.getConcept());
                activityService.logActivity(user, "Problem Solved", activityDesc);
                if (emailService != null) {
                    try {
                        emailService.sendProblemSolvedEmail(user.getEmail(), user.getUsername(), p.getTitle(), normalizeDifficulty(p.getDifficulty()));
                    } catch (Exception ignored) {}
                }
            }
            if (badgeService != null) {
                try {
                    badgeService.awardEligibleBadges(user);
                } catch (Exception ignored) {}
            }
        }

        SubmissionResponseDto response = new SubmissionResponseDto(submission.getId(), evalResult.getStatus(), evalResult.getMessage(), isSolved, LocalDateTime.now());
        response.setRuntime(evalResult.getAggregateRuntime());
        response.setPassedTestCases(evalResult.getPassedTestCases());
        response.setTotalTestCases(evalResult.getTotalTestCases());
        response.setCompilerOutput(evalResult.getCompilerOutput());
        response.setCompilationTimeMs(evalResult.getCompilationTimeMs());
        response.setAverageExecutionTimeMs(evalResult.getAverageExecutionTimeMs());
        response.setAverageCompilationTimeMs(evalResult.getAverageCompilationTimeMs());
        response.setPublicPassedCount(publicPassed);
        response.setPublicTotalCount(publicTotal);
        response.setPrivatePassedCount(privatePassed);
        response.setPrivateTotalCount(privateTotal);
        response.setPrivateAverageExecutionTimeMs(privateEvaluatedCount > 0 ? (privateTimeSum / privateEvaluatedCount) : 0.0);
        response.setPrivateAverageCompilationTimeMs(evalResult.getCompilationTimeMs());
        response.setTestCaseResults(publicResultDtos);

        return ResponseEntity.ok(response);
    }

    public ProblemDto mapToUserDto(Problem p) {
        ProblemDto dto = new ProblemDto();
        dto.setId(p.getId());
        dto.setTitle(p.getTitle());
        
        List<String> normalizedConcepts = p.getConcepts().stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(this::normalizeTopic)
                .collect(Collectors.toList());
        dto.setConcepts(normalizedConcepts);
        dto.setConcept(normalizedConcepts.isEmpty() ? normalizeTopic(p.getConcept()) : String.join(", ", normalizedConcepts));
        dto.setDifficulty(normalizeDifficulty(p.getDifficulty()));
        dto.setDescription(p.getDescription());
        dto.setConstraints(p.getConstraints());
        dto.setTestCases(p.getTestCases());

        // Starter codes (fallbacks if null/blank in DB)
        dto.setStarterCodeC(hasContent(p.getStarterCodeC()) ? p.getStarterCodeC() : DEFAULT_STARTER_C);
        dto.setStarterCodePython(hasContent(p.getStarterCodePython()) ? p.getStarterCodePython() : DEFAULT_STARTER_PYTHON);
        dto.setStarterCodeJava(hasContent(p.getStarterCodeJava()) ? p.getStarterCodeJava() : DEFAULT_STARTER_JAVA);
        dto.setStarterCodeCpp(hasContent(p.getStarterCodeCpp()) ? p.getStarterCodeCpp() : infosys.onlinecodeplate.model.LanguageRegistry.getDefaultStarterCode("CPP"));
        dto.setStarterCodeJs(hasContent(p.getStarterCodeJs()) ? p.getStarterCodeJs() : infosys.onlinecodeplate.model.LanguageRegistry.getDefaultStarterCode("JAVASCRIPT"));
        dto.setStarterCodeGo(hasContent(p.getStarterCodeGo()) ? p.getStarterCodeGo() : infosys.onlinecodeplate.model.LanguageRegistry.getDefaultStarterCode("GO"));
        dto.setStarterCodeRust(hasContent(p.getStarterCodeRust()) ? p.getStarterCodeRust() : infosys.onlinecodeplate.model.LanguageRegistry.getDefaultStarterCode("RUST"));

        // Relational Test Cases (Filter out hidden test cases for normal users)
        List<TestCaseDto> tcDtos = new ArrayList<>();
        if (p.getTestCasesList() != null) {
            for (TestCase tc : p.getTestCasesList()) {
                if (tc.getHidden() == null || !tc.getHidden()) {
                    tcDtos.add(new TestCaseDto(tc.getInput(), tc.getExpectedOutput(), false));
                }
            }
        }
        dto.setTestCasesList(tcDtos);

        // Map hints (ordered step-by-step)
        List<HintDto> hintDtos = new ArrayList<>();
        if (p.getHintsList() != null) {
            for (ProblemHint hint : p.getHintsList()) {
                hintDtos.add(new HintDto(hint.getId(), hint.getHintOrder(), hint.getContent()));
            }
        }
        dto.setHints(hintDtos);
        dto.setHasEditorial(hasContent(p.getEditorial()));
        dto.setQuestionType(p.getQuestionType());
        dto.setOptions(p.getOptions());
        dto.setAllowedLanguages(p.getAllowedLanguages());
        dto.setImageUrl(p.getImageUrl());
        dto.setCreatorId(p.getCreatorId());
        dto.setIsPrivate(p.getIsPrivate());

        // NOTE: Solution fields (solution, solutionC, solutionPython, solutionJava) are intentionally NOT mapped into ProblemDto
        return dto;
    }

    private boolean hasContent(String str) {
        return str != null && !str.trim().isEmpty();
    }

    private String normalizeDifficulty(String diff) {
        if (diff == null) return "Medium";
        String clean = diff.trim().toUpperCase();
        if (clean.equals("EASY")) return "Easy";
        if (clean.equals("MEDIUM")) return "Medium";
        if (clean.equals("HARD")) return "Hard";
        return "Medium";
    }

    private String normalizeTopic(String topic) {
        if (topic == null || topic.isBlank()) return "General";
        String[] words = topic.trim().split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (String w : words) {
            if (!w.isEmpty()) {
                if (sb.length() > 0) sb.append(" ");
                sb.append(Character.toUpperCase(w.charAt(0))).append(w.substring(1).toLowerCase());
            }
        }
        return sb.toString();
    }
}

