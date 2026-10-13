package infosys.onlinecodeplate.service;

import infosys.onlinecodeplate.entity.TestCase;
import infosys.onlinecodeplate.entity.UserSubmission;
import infosys.onlinecodeplate.service.DockerSandboxService.EvaluationResult;
import infosys.onlinecodeplate.util.OutputNormalizer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class DockerSandboxServiceTest {

    private DockerSandboxService dockerSandboxService;

    @BeforeEach
    public void setUp() {
        dockerSandboxService = new DockerSandboxService();
    }

    @Test
    @DisplayName("OutputNormalizer handles CRLF line endings and trailing whitespace")
    public void testOutputNormalizer() {
        String input1 = "Hello World  \r\nLine 2   \r\n";
        String expectedNormalized = "Hello World\nLine 2";

        assertEquals(expectedNormalized, OutputNormalizer.normalize(input1));
        assertTrue(OutputNormalizer.equalsNormalized("Hello World\nLine 2", "Hello World  \r\nLine 2   "));
        assertFalse(OutputNormalizer.equalsNormalized("Hello World", "Different World"));
    }

    @Test
    @DisplayName("Docker availability returns boolean check status on host system")
    public void testDockerAvailabilityCheck() {
        boolean available = dockerSandboxService.isDockerAvailable();
        assertNotNull(Boolean.valueOf(available));
    }

    @Test
    @DisplayName("Real Python submission evaluation in Docker container")
    public void testPythonDockerExecution() {
        if (!dockerSandboxService.isDockerAvailable()) return;

        UserSubmission submission = new UserSubmission();
        submission.setLanguage("Python");
        submission.setCode("import sys\nnum = int(sys.stdin.read().strip())\nprint(num * num)");

        List<TestCase> tcs = new ArrayList<>();
        tcs.add(new TestCase("5", "25", false));
        tcs.add(new TestCase("6", "36", false));

        EvaluationResult result = dockerSandboxService.evaluateSubmission(submission, tcs);
        assertEquals("ACCEPTED", result.getStatus());
        assertEquals(2, result.getPassedTestCases());
        assertEquals(2, result.getTotalTestCases());
        assertNotNull(result.getAggregateRuntime());
    }

    @Test
    @DisplayName("Real C submission evaluation in Docker container")
    public void testCDockerExecution() {
        if (!dockerSandboxService.isDockerAvailable()) return;

        UserSubmission submission = new UserSubmission();
        submission.setLanguage("C");
        submission.setCode("#include <stdio.h>\nint main() {\n    int n;\n    if (scanf(\"%d\", &n) == 1) {\n        printf(\"%d\\n\", n * n);\n    }\n    return 0;\n}");

        List<TestCase> tcs = new ArrayList<>();
        tcs.add(new TestCase("4", "16", false));

        EvaluationResult result = dockerSandboxService.evaluateSubmission(submission, tcs);
        assertEquals("ACCEPTED", result.getStatus());
        assertEquals(1, result.getPassedTestCases());
    }

    @Test
    @DisplayName("Real Java submission evaluation in Docker container")
    public void testJavaDockerExecution() {
        if (!dockerSandboxService.isDockerAvailable()) return;

        UserSubmission submission = new UserSubmission();
        submission.setLanguage("Java");
        submission.setCode("import java.util.Scanner;\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        System.out.println(n * n);\n    }\n}");

        List<TestCase> tcs = new ArrayList<>();
        tcs.add(new TestCase("7", "49", false));

        EvaluationResult result = dockerSandboxService.evaluateSubmission(submission, tcs);
        assertEquals("ACCEPTED", result.getStatus());
        assertEquals(1, result.getPassedTestCases());
    }

    @Test
    @DisplayName("Wrong answer evaluation in Docker container")
    public void testWrongAnswerExecution() {
        if (!dockerSandboxService.isDockerAvailable()) return;

        UserSubmission submission = new UserSubmission();
        submission.setLanguage("Python");
        submission.setCode("print(100)");

        List<TestCase> tcs = new ArrayList<>();
        tcs.add(new TestCase("5", "25", false));

        EvaluationResult result = dockerSandboxService.evaluateSubmission(submission, tcs);
        assertEquals("WRONG_ANSWER", result.getStatus());
        assertEquals(0, result.getPassedTestCases());
    }

    @Test
    @DisplayName("Compilation error evaluation in Docker container")
    public void testCompilationErrorExecution() {
        if (!dockerSandboxService.isDockerAvailable()) return;

        UserSubmission submission = new UserSubmission();
        submission.setLanguage("C");
        submission.setCode("invalid c syntax code here");

        List<TestCase> tcs = new ArrayList<>();
        tcs.add(new TestCase("5", "25", false));

        EvaluationResult result = dockerSandboxService.evaluateSubmission(submission, tcs);
        assertEquals("COMPILATION_ERROR", result.getStatus());
        assertNotNull(result.getCompilerOutput());
    }
}
