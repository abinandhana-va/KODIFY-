package infosys.onlinecodeplate.controller;

import infosys.onlinecodeplate.dto.AppDtos.AdminProblemDto;
import infosys.onlinecodeplate.dto.AppDtos.HintDto;
import infosys.onlinecodeplate.dto.AppDtos.TestCaseDto;
import infosys.onlinecodeplate.entity.Problem;
import infosys.onlinecodeplate.entity.ProblemHint;
import infosys.onlinecodeplate.entity.TestCase;
import infosys.onlinecodeplate.repository.ProblemRepository;
import infosys.onlinecodeplate.service.DockerSandboxService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/admin/problems")
public class AdminProblemController {
    private final ProblemRepository problemRepo;
    private final DockerSandboxService dockerSandboxService;

    public AdminProblemController(ProblemRepository problemRepo, DockerSandboxService dockerSandboxService) {
        this.problemRepo = problemRepo;
        this.dockerSandboxService = dockerSandboxService;
    }

    @PostMapping
    public ResponseEntity<?> createProblem(@Valid @RequestBody AdminProblemDto dto) {
        validateProblem(dto);
        Problem p = new Problem();
        mapToEntity(dto, p);

        // Optional Reference Solution Sandbox Validation against Test Cases
        validateReferenceSolutions(p);

        problemRepo.save(p);
        return ResponseEntity.ok(mapToAdminDto(p));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateProblem(@PathVariable Long id, @Valid @RequestBody AdminProblemDto dto) {
        validateProblem(dto);
        Problem p = problemRepo.findById(id).orElseThrow(() -> new RuntimeException("Problem not found"));
        mapToEntity(dto, p);

        // Optional Reference Solution Sandbox Validation against Test Cases
        validateReferenceSolutions(p);

        problemRepo.save(p);
        return ResponseEntity.ok(mapToAdminDto(p));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProblem(@PathVariable Long id) {
        problemRepo.deleteById(id);
        return ResponseEntity.ok().build();
    }

    private void validateReferenceSolutions(Problem p) {
        if (p.getTestCasesList() == null || p.getTestCasesList().isEmpty()) return;

        if (p.getSolutionC() != null && !p.getSolutionC().isBlank()) {
            dockerSandboxService.validateReferenceSolution("C", p.getSolutionC(), p.getTestCasesList());
        }
        if (p.getSolutionPython() != null && !p.getSolutionPython().isBlank()) {
            dockerSandboxService.validateReferenceSolution("Python", p.getSolutionPython(), p.getTestCasesList());
        }
        if (p.getSolutionJava() != null && !p.getSolutionJava().isBlank()) {
            dockerSandboxService.validateReferenceSolution("Java", p.getSolutionJava(), p.getTestCasesList());
        }
    }

    private void validateProblem(AdminProblemDto dto) {
        if (dto.getTitle() == null || dto.getTitle().trim().isEmpty()) {
            throw new RuntimeException("Title is required.");
        }
        boolean hasConceptsList = dto.getConcepts() != null && dto.getConcepts().stream().anyMatch(c -> c != null && !c.trim().isEmpty());
        boolean hasSingleConcept = dto.getConcept() != null && !dto.getConcept().trim().isEmpty();
        if (!hasConceptsList && !hasSingleConcept) {
            throw new RuntimeException("At least one topic / concept is required.");
        }
        if (dto.getDifficulty() == null || dto.getDifficulty().trim().isEmpty()) {
            throw new RuntimeException("Difficulty is required.");
        }
        if (dto.getDescription() == null || dto.getDescription().trim().isEmpty()) {
            throw new RuntimeException("Problem description is required.");
        }
        if (dto.getConstraints() == null || dto.getConstraints().trim().isEmpty()) {
            throw new RuntimeException("Constraints are required.");
        }

        // Validate mandatory test cases (at least 1 valid test case with non-blank input and output)
        List<TestCaseDto> tcs = dto.getTestCasesList();
        boolean hasValidTestCase = false;
        if (tcs != null) {
            for (TestCaseDto tc : tcs) {
                if (tc.getInput() != null && !tc.getInput().trim().isEmpty() &&
                    tc.getExpectedOutput() != null && !tc.getExpectedOutput().trim().isEmpty()) {
                    hasValidTestCase = true;
                    break;
                }
            }
        }
        if (!hasValidTestCase) {
            throw new RuntimeException("Please add at least one valid test case (with input and expected output).");
        }

        // Validate mandatory reference solutions (at least 1 solution among C, Python, Java)
        boolean hasSolutionC = dto.getSolutionC() != null && !dto.getSolutionC().trim().isEmpty();
        boolean hasSolutionPython = dto.getSolutionPython() != null && !dto.getSolutionPython().trim().isEmpty();
        boolean hasSolutionJava = dto.getSolutionJava() != null && !dto.getSolutionJava().trim().isEmpty();
        boolean hasGenericSolution = dto.getSolution() != null && !dto.getSolution().trim().isEmpty();

        if (!hasSolutionC && !hasSolutionPython && !hasSolutionJava && !hasGenericSolution) {
            throw new RuntimeException("At least one language reference solution (C, Python, or Java) is required.");
        }
    }

    private void mapToEntity(AdminProblemDto dto, Problem p) {
        p.setTitle(dto.getTitle().trim());
        if (dto.getConcepts() != null && !dto.getConcepts().isEmpty()) {
            p.setConcepts(dto.getConcepts());
        } else if (dto.getConcept() != null) {
            p.setConcept(dto.getConcept().trim());
        }
        
        String diff = dto.getDifficulty().trim().toUpperCase();
        if (!diff.equals("EASY") && !diff.equals("MEDIUM") && !diff.equals("HARD")) {
            diff = "EASY";
        }
        p.setDifficulty(diff);

        p.setDescription(dto.getDescription().trim());
        p.setConstraints(dto.getConstraints().trim());
        p.setSolution(dto.getSolution() != null ? dto.getSolution().trim() : "");
        p.setTestCases(dto.getTestCases() != null ? dto.getTestCases().trim() : "");
        p.setEditorial(dto.getEditorial() != null ? dto.getEditorial().trim() : "");
        
        // Solutions (Admin only)
        p.setSolutionC(dto.getSolutionC() != null ? dto.getSolutionC().trim() : "");
        p.setSolutionPython(dto.getSolutionPython() != null ? dto.getSolutionPython().trim() : "");
        p.setSolutionJava(dto.getSolutionJava() != null ? dto.getSolutionJava().trim() : "");
        p.setSolutionCpp(dto.getSolutionCpp() != null ? dto.getSolutionCpp().trim() : "");
        p.setSolutionJs(dto.getSolutionJs() != null ? dto.getSolutionJs().trim() : "");
        p.setSolutionGo(dto.getSolutionGo() != null ? dto.getSolutionGo().trim() : "");
        p.setSolutionRust(dto.getSolutionRust() != null ? dto.getSolutionRust().trim() : "");

        // Starter Codes
        p.setStarterCodeC(dto.getStarterCodeC() != null ? dto.getStarterCodeC().trim() : "");
        p.setStarterCodePython(dto.getStarterCodePython() != null ? dto.getStarterCodePython().trim() : "");
        p.setStarterCodeJava(dto.getStarterCodeJava() != null ? dto.getStarterCodeJava().trim() : "");
        p.setStarterCodeCpp(dto.getStarterCodeCpp() != null ? dto.getStarterCodeCpp().trim() : "");
        p.setStarterCodeJs(dto.getStarterCodeJs() != null ? dto.getStarterCodeJs().trim() : "");
        p.setStarterCodeGo(dto.getStarterCodeGo() != null ? dto.getStarterCodeGo().trim() : "");
        p.setStarterCodeRust(dto.getStarterCodeRust() != null ? dto.getStarterCodeRust().trim() : "");

        if (dto.getAllowedLanguages() != null && !dto.getAllowedLanguages().isEmpty()) {
            p.setAllowedLanguages(dto.getAllowedLanguages());
        }

        // Relational Test Cases Mapping
        p.clearTestCases();
        if (dto.getTestCasesList() != null) {
            for (TestCaseDto tcDto : dto.getTestCasesList()) {
                if (tcDto.getInput() != null && !tcDto.getInput().trim().isEmpty() &&
                    tcDto.getExpectedOutput() != null && !tcDto.getExpectedOutput().trim().isEmpty()) {
                    TestCase tc = new TestCase(tcDto.getInput().trim(), tcDto.getExpectedOutput().trim(), tcDto.getHidden());
                    p.addTestCase(tc);
                }
            }
        }

        // Relational Hints Mapping
        p.clearHints();
        if (dto.getHints() != null) {
            int order = 1;
            for (HintDto hintDto : dto.getHints()) {
                if (hintDto.getContent() != null && !hintDto.getContent().trim().isEmpty()) {
                    ProblemHint hint = new ProblemHint(order++, hintDto.getContent().trim());
                    p.addHint(hint);
                }
            }
        }
    }

    private AdminProblemDto mapToAdminDto(Problem p) {
        AdminProblemDto dto = new AdminProblemDto();
        dto.setId(p.getId());
        dto.setTitle(p.getTitle());
        dto.setConcept(p.getConcept());
        dto.setConcepts(p.getConcepts());
        dto.setDifficulty(p.getDifficulty());
        dto.setDescription(p.getDescription());
        dto.setConstraints(p.getConstraints());
        dto.setTestCases(p.getTestCases());
        dto.setSolution(p.getSolution());
        dto.setSolutionC(p.getSolutionC());
        dto.setSolutionPython(p.getSolutionPython());
        dto.setSolutionJava(p.getSolutionJava());
        dto.setSolutionCpp(p.getSolutionCpp());
        dto.setSolutionJs(p.getSolutionJs());
        dto.setSolutionGo(p.getSolutionGo());
        dto.setSolutionRust(p.getSolutionRust());
        dto.setStarterCodeC(p.getStarterCodeC());
        dto.setStarterCodePython(p.getStarterCodePython());
        dto.setStarterCodeJava(p.getStarterCodeJava());
        dto.setStarterCodeCpp(p.getStarterCodeCpp());
        dto.setStarterCodeJs(p.getStarterCodeJs());
        dto.setStarterCodeGo(p.getStarterCodeGo());
        dto.setStarterCodeRust(p.getStarterCodeRust());
        dto.setAllowedLanguages(p.getAllowedLanguages());
        dto.setEditorial(p.getEditorial());

        List<TestCaseDto> tcDtos = new ArrayList<>();
        if (p.getTestCasesList() != null) {
            for (TestCase tc : p.getTestCasesList()) {
                tcDtos.add(new TestCaseDto(tc.getInput(), tc.getExpectedOutput(), tc.getHidden()));
            }
        }
        dto.setTestCasesList(tcDtos);

        List<HintDto> hintDtos = new ArrayList<>();
        if (p.getHintsList() != null) {
            for (ProblemHint hint : p.getHintsList()) {
                hintDtos.add(new HintDto(hint.getId(), hint.getHintOrder(), hint.getContent()));
            }
        }
        dto.setHints(hintDtos);

        return dto;
    }
}
