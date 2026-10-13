package infosys.onlinecodeplate.controller;

import infosys.onlinecodeplate.dto.AppDtos.AdminProblemDto;
import infosys.onlinecodeplate.dto.AppDtos.TestCaseDto;
import infosys.onlinecodeplate.entity.Problem;
import infosys.onlinecodeplate.entity.TestCase;
import infosys.onlinecodeplate.entity.UserSubmission;
import infosys.onlinecodeplate.repository.ProblemRepository;
import infosys.onlinecodeplate.service.DockerSandboxService;
import infosys.onlinecodeplate.service.DockerSandboxService.EvaluationResult;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

public class ProblemMultipleConceptsTest {

    @Test
    @DisplayName("Problem entity supports multiple concepts and backward compatible primary concept")
    public void testProblemMultipleConcepts() {
        Problem problem = new Problem();
        problem.setTitle("3Sum");
        problem.setConcepts(List.of("Arrays", "Two Pointers", "Sorting"));

        assertEquals(3, problem.getConcepts().size());
        assertTrue(problem.getConcepts().contains("Arrays"));
        assertTrue(problem.getConcepts().contains("Two Pointers"));
        assertTrue(problem.getConcepts().contains("Sorting"));
        assertEquals("Arrays, Two Pointers, Sorting", problem.getConcept());
    }

    @Test
    @DisplayName("AdminProblemController handles creating problem with multiple concept chips")
    public void testAdminCreateProblemWithMultipleConcepts() {
        ProblemRepository problemRepo = Mockito.mock(ProblemRepository.class);
        DockerSandboxService dockerSandboxService = new DockerSandboxService() {
            @Override
            public EvaluationResult evaluateSubmission(UserSubmission submission, List<TestCase> testCases) {
                return new EvaluationResult(
                    "ACCEPTED", "Passed", null, 10.0, testCases.size(), testCases.size(), List.of()
                );
            }
        };
        AdminProblemController adminController = new AdminProblemController(problemRepo, dockerSandboxService);

        AdminProblemDto dto = new AdminProblemDto();
        dto.setTitle("Valid Sudoku");
        dto.setDifficulty("MEDIUM");
        dto.setConcepts(List.of("Arrays", "Hash Table", "Matrix"));
        dto.setDescription("Determine if a 9x9 Sudoku board is valid.");
        dto.setConstraints("1 <= board[i][j] <= 9");
        dto.setStarterCodeC("#include <stdio.h>\nint main() { return 0; }");
        dto.setStarterCodePython("def solve(): pass");
        dto.setStarterCodeJava("class Solution {}");
        dto.setSolutionPython("print('test_out')");
        dto.setTestCasesList(List.of(new TestCaseDto("test_in", "test_out", false)));

        when(problemRepo.save(any(Problem.class))).thenAnswer(invocation -> {
            Problem p = invocation.getArgument(0);
            p.setId(42L);
            return p;
        });

        ResponseEntity<?> response = adminController.createProblem(dto);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody() instanceof AdminProblemDto);
        AdminProblemDto savedDto = (AdminProblemDto) response.getBody();
        assertNotNull(savedDto);
        assertEquals(3, savedDto.getConcepts().size());
        assertTrue(savedDto.getConcepts().contains("Matrix"));
    }
}
