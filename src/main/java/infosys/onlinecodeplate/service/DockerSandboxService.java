package infosys.onlinecodeplate.service;

import infosys.onlinecodeplate.entity.TestCase;
import infosys.onlinecodeplate.entity.UserSubmission;
import infosys.onlinecodeplate.model.LanguageRegistry;
import infosys.onlinecodeplate.util.OutputNormalizer;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.TimeUnit;

@Service
public class DockerSandboxService {

    private static final int TIMEOUT_SECONDS = 5;
    private static final String MEMORY_LIMIT = "512m";

    private static final String IMAGE_C = "gcc:latest";
    private static final String IMAGE_CPP = "gcc:latest";
    private static final String IMAGE_PYTHON = "python:3.11-slim";
    private static final String IMAGE_JAVA = "eclipse-temurin:17-jdk";
    private static final String IMAGE_JAVASCRIPT = "node:20-slim";
    private static final String IMAGE_GO = "golang:1.22-alpine";
    private static final String IMAGE_RUST = "rust:1.77-slim";
    private static final String IMAGE_TYPESCRIPT = "node:20-slim";

    public static class TestCaseResultItem {
        private final Long testCaseId;
        private final boolean passed;
        private final String actualOutput;
        private final Double runtime;
        private final String status; // PASSED, FAILED, TIMEOUT, RUNTIME_ERROR

        public TestCaseResultItem(Long testCaseId, boolean passed, String actualOutput, Double runtime, String status) {
            this.testCaseId = testCaseId;
            this.passed = passed;
            this.actualOutput = actualOutput;
            this.runtime = runtime;
            this.status = status;
        }

        public Long getTestCaseId() { return testCaseId; }
        public boolean isPassed() { return passed; }
        public String getActualOutput() { return actualOutput; }
        public Double getRuntime() { return runtime; }
        public String getStatus() { return status; }
    }

    public static class EvaluationResult {
        private final String status; // ACCEPTED, WRONG_ANSWER, COMPILATION_ERROR, RUNTIME_ERROR, TIME_LIMIT_EXCEEDED, DOCKER_UNAVAILABLE
        private final String message;
        private final String compilerOutput;
        private final Double aggregateRuntime;
        private final Double compilationTimeMs;
        private final Double averageExecutionTimeMs;
        private final Double averageCompilationTimeMs;
        private final int passedTestCases;
        private final int totalTestCases;
        private final List<TestCaseResultItem> testCaseResults;

        public EvaluationResult(String status, String message, String compilerOutput, Double aggregateRuntime, int passedTestCases, int totalTestCases, List<TestCaseResultItem> testCaseResults) {
            this(status, message, compilerOutput, aggregateRuntime, 0.0, aggregateRuntime != null && totalTestCases > 0 ? aggregateRuntime / Math.max(1, testCaseResults.size()) : 0.0, 0.0, passedTestCases, totalTestCases, testCaseResults);
        }

        public EvaluationResult(String status, String message, String compilerOutput, Double aggregateRuntime, Double compilationTimeMs, Double averageExecutionTimeMs, Double averageCompilationTimeMs, int passedTestCases, int totalTestCases, List<TestCaseResultItem> testCaseResults) {
            this.status = status;
            this.message = message;
            this.compilerOutput = compilerOutput;
            this.aggregateRuntime = aggregateRuntime;
            this.compilationTimeMs = compilationTimeMs;
            this.averageExecutionTimeMs = averageExecutionTimeMs;
            this.averageCompilationTimeMs = averageCompilationTimeMs;
            this.passedTestCases = passedTestCases;
            this.totalTestCases = totalTestCases;
            this.testCaseResults = testCaseResults;
        }

        public String getStatus() { return status; }
        public String getMessage() { return message; }
        public String getCompilerOutput() { return compilerOutput; }
        public Double getAggregateRuntime() { return aggregateRuntime; }
        public Double getCompilationTimeMs() { return compilationTimeMs; }
        public Double getAverageExecutionTimeMs() { return averageExecutionTimeMs; }
        public Double getAverageCompilationTimeMs() { return averageCompilationTimeMs; }
        public int getPassedTestCases() { return passedTestCases; }
        public int getTotalTestCases() { return totalTestCases; }
        public List<TestCaseResultItem> getTestCaseResults() { return testCaseResults; }
    }

    public boolean isDockerAvailable() {
        try {
            ProcessBuilder pb = new ProcessBuilder("docker", "info");
            Process p = pb.start();
            boolean finished = p.waitFor(2, TimeUnit.SECONDS);
            return finished && p.exitValue() == 0;
        } catch (Exception e) {
            return false;
        }
    }

    public EvaluationResult evaluateSubmission(UserSubmission submission, List<TestCase> testCases) {
        if (testCases == null || testCases.isEmpty()) {
            return new EvaluationResult("NO_TEST_CASES", "No test cases configured for this problem.", null, 0.0, 0, 0, Collections.emptyList());
        }

        boolean dockerReady = isDockerAvailable();
        Path tempDir = null;
        try {
            tempDir = Files.createTempDirectory("kodify-sub-" + (submission.getId() != null ? submission.getId() : UUID.randomUUID().toString()) + "-");
            String lang = LanguageRegistry.normalize(submission.getLanguage() != null ? submission.getLanguage() : "");

            switch (lang) {
                case "C":
                    return evaluateC(tempDir, submission.getCode(), testCases, dockerReady);
                case "CPP":
                    return evaluateCpp(tempDir, submission.getCode(), testCases, dockerReady);
                case "PYTHON":
                    return evaluatePython(tempDir, submission.getCode(), testCases, dockerReady);
                case "JAVA":
                    return evaluateJava(tempDir, submission.getCode(), testCases, dockerReady);
                case "JAVASCRIPT":
                    return evaluateJavaScript(tempDir, submission.getCode(), testCases, dockerReady);
                case "GO":
                    return evaluateGo(tempDir, submission.getCode(), testCases, dockerReady);
                case "RUST":
                    return evaluateRust(tempDir, submission.getCode(), testCases, dockerReady);
                case "TYPESCRIPT":
                    return evaluateTypeScript(tempDir, submission.getCode(), testCases, dockerReady);
                default:
                    return new EvaluationResult("UNSUPPORTED_LANGUAGE", "Unsupported programming language: " + lang, null, null, 0, testCases.size(), Collections.emptyList());
            }
        } catch (Exception e) {
            return new EvaluationResult("EXECUTION_ERROR", "Error setting up sandbox execution: " + e.getMessage(), null, null, 0, testCases.size(), Collections.emptyList());
        } finally {
            if (tempDir != null) {
                deleteDirectoryRecursively(tempDir.toFile());
            }
        }
    }

    public void validateReferenceSolution(String language, String code, List<TestCase> testCases) {
        if (code == null || code.trim().isEmpty() || testCases == null || testCases.isEmpty()) {
            return;
        }

        UserSubmission dummySub = new UserSubmission();
        dummySub.setLanguage(language);
        dummySub.setCode(code);

        EvaluationResult res = evaluateSubmission(dummySub, testCases);
        if ("DOCKER_UNAVAILABLE".equals(res.getStatus())) {
            return;
        }
        if (!"ACCEPTED".equals(res.getStatus())) {
            String details = res.getCompilerOutput() != null ? res.getCompilerOutput() : res.getMessage();
            throw new RuntimeException("The " + language + " reference solution is invalid or fails test cases: " + details);
        }
    }

    // =========================================================
    // 1. C EVALUATION
    // =========================================================
    private EvaluationResult evaluateC(Path tempDir, String code, List<TestCase> testCases, boolean useDocker) throws IOException {
        Path sourceFile = tempDir.resolve("solution.c");
        Files.writeString(sourceFile, code != null ? code : "");

        List<String> compileCmd;
        if (useDocker) {
            compileCmd = Arrays.asList(
                "docker", "run", "--rm", "--network", "none", "--memory", MEMORY_LIMIT,
                "-v", tempDir.toAbsolutePath().toString().replace("\\", "/") + ":/sandbox",
                "-w", "/sandbox",
                IMAGE_C, "gcc", "-O3", "solution.c", "-o", "program"
            );
        } else {
            compileCmd = Arrays.asList("gcc", "-O3", "solution.c", "-o", "program");
        }

        long compStart = System.currentTimeMillis();
        ProcessResult compResult = runProcess(compileCmd, tempDir.toFile(), 10);
        long compElapsed = System.currentTimeMillis() - compStart;
        double compilationTimeMs = (double) compElapsed;

        if (compResult.exitCode != 0) {
            if (!useDocker && (compResult.stderr.contains("Cannot run program") || compResult.stderr.contains("not recognized"))) {
                return new EvaluationResult("DOCKER_UNAVAILABLE", "GCC and Docker are unavailable on host system.", null, null, compilationTimeMs, 0.0, compilationTimeMs, 0, testCases.size(), Collections.emptyList());
            }
            String errOut = compResult.stderr != null && !compResult.stderr.isBlank() ? compResult.stderr : compResult.stdout;
            return new EvaluationResult("COMPILATION_ERROR", "C Compilation Error:\n" + errOut, errOut, null, compilationTimeMs, 0.0, compilationTimeMs, 0, testCases.size(), Collections.emptyList());
        }

        return runBinaryTestCases(tempDir, testCases, useDocker, IMAGE_C, compilationTimeMs);
    }

    // =========================================================
    // 2. C++ EVALUATION
    // =========================================================
    private EvaluationResult evaluateCpp(Path tempDir, String code, List<TestCase> testCases, boolean useDocker) throws IOException {
        Path sourceFile = tempDir.resolve("solution.cpp");
        Files.writeString(sourceFile, code != null ? code : "");

        List<String> compileCmd;
        if (useDocker) {
            compileCmd = Arrays.asList(
                "docker", "run", "--rm", "--network", "none", "--memory", MEMORY_LIMIT,
                "-v", tempDir.toAbsolutePath().toString().replace("\\", "/") + ":/sandbox",
                "-w", "/sandbox",
                IMAGE_CPP, "g++", "-O3", "solution.cpp", "-o", "program"
            );
        } else {
            compileCmd = Arrays.asList("g++", "-O3", "solution.cpp", "-o", "program");
        }

        long compStart = System.currentTimeMillis();
        ProcessResult compResult = runProcess(compileCmd, tempDir.toFile(), 10);
        long compElapsed = System.currentTimeMillis() - compStart;
        double compilationTimeMs = (double) compElapsed;

        if (compResult.exitCode != 0) {
            if (!useDocker && (compResult.stderr.contains("Cannot run program") || compResult.stderr.contains("not recognized"))) {
                return new EvaluationResult("DOCKER_UNAVAILABLE", "G++ and Docker are unavailable on host system.", null, null, compilationTimeMs, 0.0, compilationTimeMs, 0, testCases.size(), Collections.emptyList());
            }
            String errOut = compResult.stderr != null && !compResult.stderr.isBlank() ? compResult.stderr : compResult.stdout;
            return new EvaluationResult("COMPILATION_ERROR", "C++ Compilation Error:\n" + errOut, errOut, null, compilationTimeMs, 0.0, compilationTimeMs, 0, testCases.size(), Collections.emptyList());
        }

        return runBinaryTestCases(tempDir, testCases, useDocker, IMAGE_CPP, compilationTimeMs);
    }

    // =========================================================
    // 3. PYTHON EVALUATION
    // =========================================================
    private EvaluationResult evaluatePython(Path tempDir, String code, List<TestCase> testCases, boolean useDocker) throws IOException {
        Path sourceFile = tempDir.resolve("solution.py");
        Files.writeString(sourceFile, code != null ? code : "");

        List<TestCaseResultItem> results = new ArrayList<>();
        int passedCount = 0;
        double totalTime = 0;
        String overallStatus = "ACCEPTED";
        double compilationTimeMs = 0.0;

        for (TestCase tc : testCases) {
            List<String> runCmd;
            if (useDocker) {
                Path inputFile = tempDir.resolve("input.txt");
                Files.writeString(inputFile, tc.getInput() != null ? tc.getInput() : "");
                runCmd = Arrays.asList(
                    "docker", "run", "--rm", "--network", "none", "--memory", MEMORY_LIMIT,
                    "-v", tempDir.toAbsolutePath().toString().replace("\\", "/") + ":/sandbox",
                    "-w", "/sandbox",
                    IMAGE_PYTHON, "sh", "-c", "python solution.py < input.txt"
                );
            } else {
                runCmd = Arrays.asList("python", "solution.py");
            }

            long start = System.currentTimeMillis();
            ProcessResult runResult = useDocker
                ? runProcess(runCmd, tempDir.toFile(), TIMEOUT_SECONDS)
                : runProcessWithInput(runCmd, tempDir.toFile(), tc.getInput(), TIMEOUT_SECONDS);
            long elapsed = System.currentTimeMillis() - start;
            double runtimeMs = (double) elapsed;
            totalTime += runtimeMs;

            if (runResult.timedOut) {
                results.add(new TestCaseResultItem(tc.getId(), false, "Time Limit Exceeded (> 5s)", runtimeMs, "TIMEOUT"));
                overallStatus = "TIME_LIMIT_EXCEEDED";
                break;
            }

            if (runResult.exitCode != 0) {
                if (!useDocker && (runResult.stderr.contains("Cannot run program") || runResult.stderr.contains("not recognized"))) {
                    return new EvaluationResult("DOCKER_UNAVAILABLE", "Python runtime and Docker are unavailable on host system.", null, null, 0.0, 0.0, 0.0, 0, testCases.size(), Collections.emptyList());
                }
                results.add(new TestCaseResultItem(tc.getId(), false, "Runtime Error (exit code " + runResult.exitCode + "):\n" + runResult.stderr, runtimeMs, "RUNTIME_ERROR"));
                overallStatus = "RUNTIME_ERROR";
                break;
            }

            boolean pass = OutputNormalizer.equalsNormalized(runResult.stdout, tc.getExpectedOutput());
            if (pass) {
                passedCount++;
                results.add(new TestCaseResultItem(tc.getId(), true, runResult.stdout, runtimeMs, "PASSED"));
            } else {
                results.add(new TestCaseResultItem(tc.getId(), false, runResult.stdout, runtimeMs, "FAILED"));
                if ("ACCEPTED".equals(overallStatus)) {
                    overallStatus = "WRONG_ANSWER";
                }
            }
        }

        double avgExecTime = results.isEmpty() ? 0.0 : totalTime / results.size();
        String msg = "ACCEPTED".equals(overallStatus)
            ? "All test cases passed! Solution accepted."
            : passedCount + " of " + testCases.size() + " test cases passed.";

        return new EvaluationResult(overallStatus, msg, null, totalTime, compilationTimeMs, avgExecTime, compilationTimeMs, passedCount, testCases.size(), results);
    }

    // =========================================================
    // 4. JAVA EVALUATION
    // =========================================================
    private EvaluationResult evaluateJava(Path tempDir, String code, List<TestCase> testCases, boolean useDocker) throws IOException {
        Path sourceFile = tempDir.resolve("Solution.java");
        Files.writeString(sourceFile, code != null ? code : "");

        List<String> compileCmd;
        if (useDocker) {
            compileCmd = Arrays.asList(
                "docker", "run", "--rm", "--network", "none", "--memory", MEMORY_LIMIT,
                "-v", tempDir.toAbsolutePath().toString().replace("\\", "/") + ":/sandbox",
                "-w", "/sandbox",
                IMAGE_JAVA, "javac", "Solution.java"
            );
        } else {
            compileCmd = Arrays.asList("javac", "Solution.java");
        }

        long compStart = System.currentTimeMillis();
        ProcessResult compResult = runProcess(compileCmd, tempDir.toFile(), 15);
        long compElapsed = System.currentTimeMillis() - compStart;
        double compilationTimeMs = (double) compElapsed;

        if (compResult.exitCode != 0) {
            if (!useDocker && (compResult.stderr.contains("Cannot run program") || compResult.stderr.contains("not recognized"))) {
                return new EvaluationResult("DOCKER_UNAVAILABLE", "Java JDK (javac) and Docker are unavailable on host system.", null, null, compilationTimeMs, 0.0, compilationTimeMs, 0, testCases.size(), Collections.emptyList());
            }
            String errOut = compResult.stderr != null && !compResult.stderr.isBlank() ? compResult.stderr : compResult.stdout;
            return new EvaluationResult("COMPILATION_ERROR", "Java Compilation Error:\n" + errOut, errOut, null, compilationTimeMs, 0.0, compilationTimeMs, 0, testCases.size(), Collections.emptyList());
        }

        List<TestCaseResultItem> results = new ArrayList<>();
        int passedCount = 0;
        double totalTime = 0;
        String overallStatus = "ACCEPTED";

        for (TestCase tc : testCases) {
            List<String> runCmd;
            if (useDocker) {
                Path inputFile = tempDir.resolve("input.txt");
                Files.writeString(inputFile, tc.getInput() != null ? tc.getInput() : "");
                runCmd = Arrays.asList(
                    "docker", "run", "--rm", "--network", "none", "--memory", MEMORY_LIMIT,
                    "-v", tempDir.toAbsolutePath().toString().replace("\\", "/") + ":/sandbox",
                    "-w", "/sandbox",
                    IMAGE_JAVA, "sh", "-c", "java Solution < input.txt"
                );
            } else {
                runCmd = Arrays.asList("java", "Solution");
            }

            long start = System.currentTimeMillis();
            ProcessResult runResult = useDocker
                ? runProcess(runCmd, tempDir.toFile(), TIMEOUT_SECONDS)
                : runProcessWithInput(runCmd, tempDir.toFile(), tc.getInput(), TIMEOUT_SECONDS);
            long elapsed = System.currentTimeMillis() - start;
            double runtimeMs = (double) elapsed;
            totalTime += runtimeMs;

            if (runResult.timedOut) {
                results.add(new TestCaseResultItem(tc.getId(), false, "Time Limit Exceeded (> 5s)", runtimeMs, "TIMEOUT"));
                overallStatus = "TIME_LIMIT_EXCEEDED";
                break;
            }

            if (runResult.exitCode != 0) {
                results.add(new TestCaseResultItem(tc.getId(), false, "Runtime Error (exit code " + runResult.exitCode + "):\n" + runResult.stderr, runtimeMs, "RUNTIME_ERROR"));
                overallStatus = "RUNTIME_ERROR";
                break;
            }

            boolean pass = OutputNormalizer.equalsNormalized(runResult.stdout, tc.getExpectedOutput());
            if (pass) {
                passedCount++;
                results.add(new TestCaseResultItem(tc.getId(), true, runResult.stdout, runtimeMs, "PASSED"));
            } else {
                results.add(new TestCaseResultItem(tc.getId(), false, runResult.stdout, runtimeMs, "FAILED"));
                if ("ACCEPTED".equals(overallStatus)) {
                    overallStatus = "WRONG_ANSWER";
                }
            }
        }

        double avgExecTime = results.isEmpty() ? 0.0 : totalTime / results.size();
        String msg = "ACCEPTED".equals(overallStatus)
            ? "All test cases passed! Solution accepted."
            : passedCount + " of " + testCases.size() + " test cases passed.";

        return new EvaluationResult(overallStatus, msg, null, totalTime, compilationTimeMs, avgExecTime, compilationTimeMs, passedCount, testCases.size(), results);
    }

    // =========================================================
    // 5. JAVASCRIPT EVALUATION
    // =========================================================
    private EvaluationResult evaluateJavaScript(Path tempDir, String code, List<TestCase> testCases, boolean useDocker) throws IOException {
        Path sourceFile = tempDir.resolve("solution.js");
        Files.writeString(sourceFile, code != null ? code : "");

        List<TestCaseResultItem> results = new ArrayList<>();
        int passedCount = 0;
        double totalTime = 0;
        String overallStatus = "ACCEPTED";
        double compilationTimeMs = 0.0;

        for (TestCase tc : testCases) {
            List<String> runCmd;
            if (useDocker) {
                Path inputFile = tempDir.resolve("input.txt");
                Files.writeString(inputFile, tc.getInput() != null ? tc.getInput() : "");
                runCmd = Arrays.asList(
                    "docker", "run", "--rm", "--network", "none", "--memory", MEMORY_LIMIT,
                    "-v", tempDir.toAbsolutePath().toString().replace("\\", "/") + ":/sandbox",
                    "-w", "/sandbox",
                    IMAGE_JAVASCRIPT, "sh", "-c", "node solution.js < input.txt"
                );
            } else {
                runCmd = Arrays.asList("node", "solution.js");
            }

            long start = System.currentTimeMillis();
            ProcessResult runResult = useDocker
                ? runProcess(runCmd, tempDir.toFile(), TIMEOUT_SECONDS)
                : runProcessWithInput(runCmd, tempDir.toFile(), tc.getInput(), TIMEOUT_SECONDS);
            long elapsed = System.currentTimeMillis() - start;
            double runtimeMs = (double) elapsed;
            totalTime += runtimeMs;

            if (runResult.timedOut) {
                results.add(new TestCaseResultItem(tc.getId(), false, "Time Limit Exceeded (> 5s)", runtimeMs, "TIMEOUT"));
                overallStatus = "TIME_LIMIT_EXCEEDED";
                break;
            }

            if (runResult.exitCode != 0) {
                if (!useDocker && (runResult.stderr.contains("Cannot run program") || runResult.stderr.contains("not recognized"))) {
                    return new EvaluationResult("DOCKER_UNAVAILABLE", "Node.js and Docker are unavailable on host system.", null, null, 0.0, 0.0, 0.0, 0, testCases.size(), Collections.emptyList());
                }
                results.add(new TestCaseResultItem(tc.getId(), false, "Runtime Error (exit code " + runResult.exitCode + "):\n" + runResult.stderr, runtimeMs, "RUNTIME_ERROR"));
                overallStatus = "RUNTIME_ERROR";
                break;
            }

            boolean pass = OutputNormalizer.equalsNormalized(runResult.stdout, tc.getExpectedOutput());
            if (pass) {
                passedCount++;
                results.add(new TestCaseResultItem(tc.getId(), true, runResult.stdout, runtimeMs, "PASSED"));
            } else {
                results.add(new TestCaseResultItem(tc.getId(), false, runResult.stdout, runtimeMs, "FAILED"));
                if ("ACCEPTED".equals(overallStatus)) {
                    overallStatus = "WRONG_ANSWER";
                }
            }
        }

        double avgExecTime = results.isEmpty() ? 0.0 : totalTime / results.size();
        String msg = "ACCEPTED".equals(overallStatus)
            ? "All test cases passed! Solution accepted."
            : passedCount + " of " + testCases.size() + " test cases passed.";

        return new EvaluationResult(overallStatus, msg, null, totalTime, compilationTimeMs, avgExecTime, compilationTimeMs, passedCount, testCases.size(), results);
    }

    // =========================================================
    // 6. GO EVALUATION
    // =========================================================
    private EvaluationResult evaluateGo(Path tempDir, String code, List<TestCase> testCases, boolean useDocker) throws IOException {
        Path sourceFile = tempDir.resolve("solution.go");
        Files.writeString(sourceFile, code != null ? code : "");

        List<String> compileCmd;
        if (useDocker) {
            compileCmd = Arrays.asList(
                "docker", "run", "--rm", "--network", "none", "--memory", MEMORY_LIMIT,
                "-v", tempDir.toAbsolutePath().toString().replace("\\", "/") + ":/sandbox",
                "-w", "/sandbox",
                IMAGE_GO, "go", "build", "-o", "program", "solution.go"
            );
        } else {
            compileCmd = Arrays.asList("go", "build", "-o", "program", "solution.go");
        }

        long compStart = System.currentTimeMillis();
        ProcessResult compResult = runProcess(compileCmd, tempDir.toFile(), 15);
        long compElapsed = System.currentTimeMillis() - compStart;
        double compilationTimeMs = (double) compElapsed;

        if (compResult.exitCode != 0) {
            if (!useDocker && (compResult.stderr.contains("Cannot run program") || compResult.stderr.contains("not recognized"))) {
                return new EvaluationResult("DOCKER_UNAVAILABLE", "Go compiler and Docker are unavailable on host system.", null, null, compilationTimeMs, 0.0, compilationTimeMs, 0, testCases.size(), Collections.emptyList());
            }
            String errOut = compResult.stderr != null && !compResult.stderr.isBlank() ? compResult.stderr : compResult.stdout;
            return new EvaluationResult("COMPILATION_ERROR", "Go Compilation Error:\n" + errOut, errOut, null, compilationTimeMs, 0.0, compilationTimeMs, 0, testCases.size(), Collections.emptyList());
        }

        return runBinaryTestCases(tempDir, testCases, useDocker, IMAGE_GO, compilationTimeMs);
    }

    // =========================================================
    // 7. RUST EVALUATION
    // =========================================================
    private EvaluationResult evaluateRust(Path tempDir, String code, List<TestCase> testCases, boolean useDocker) throws IOException {
        Path sourceFile = tempDir.resolve("solution.rs");
        Files.writeString(sourceFile, code != null ? code : "");

        List<String> compileCmd;
        if (useDocker) {
            compileCmd = Arrays.asList(
                "docker", "run", "--rm", "--network", "none", "--memory", MEMORY_LIMIT,
                "-v", tempDir.toAbsolutePath().toString().replace("\\", "/") + ":/sandbox",
                "-w", "/sandbox",
                IMAGE_RUST, "rustc", "-O", "solution.rs", "-o", "program"
            );
        } else {
            compileCmd = Arrays.asList("rustc", "-O", "solution.rs", "-o", "program");
        }

        long compStart = System.currentTimeMillis();
        ProcessResult compResult = runProcess(compileCmd, tempDir.toFile(), 15);
        long compElapsed = System.currentTimeMillis() - compStart;
        double compilationTimeMs = (double) compElapsed;

        if (compResult.exitCode != 0) {
            if (!useDocker && (compResult.stderr.contains("Cannot run program") || compResult.stderr.contains("not recognized"))) {
                return new EvaluationResult("DOCKER_UNAVAILABLE", "Rust compiler and Docker are unavailable on host system.", null, null, compilationTimeMs, 0.0, compilationTimeMs, 0, testCases.size(), Collections.emptyList());
            }
            String errOut = compResult.stderr != null && !compResult.stderr.isBlank() ? compResult.stderr : compResult.stdout;
            return new EvaluationResult("COMPILATION_ERROR", "Rust Compilation Error:\n" + errOut, errOut, null, compilationTimeMs, 0.0, compilationTimeMs, 0, testCases.size(), Collections.emptyList());
        }

        return runBinaryTestCases(tempDir, testCases, useDocker, IMAGE_RUST, compilationTimeMs);
    }

    // =========================================================
    // 8. TYPESCRIPT EVALUATION
    // =========================================================
    private EvaluationResult evaluateTypeScript(Path tempDir, String code, List<TestCase> testCases, boolean useDocker) throws IOException {
        // Evaluate via node after stripping type annotations or direct node runner
        return evaluateJavaScript(tempDir, code, testCases, useDocker);
    }

    // =========================================================
    // HELPER: RUN COMPILED BINARY AGAINST TEST CASES
    // =========================================================
    private EvaluationResult runBinaryTestCases(Path tempDir, List<TestCase> testCases, boolean useDocker, String dockerImage, double compilationTimeMs) throws IOException {
        List<TestCaseResultItem> results = new ArrayList<>();
        int passedCount = 0;
        double totalTime = 0;
        String overallStatus = "ACCEPTED";

        for (TestCase tc : testCases) {
            List<String> runCmd;
            if (useDocker) {
                Path inputFile = tempDir.resolve("input.txt");
                Files.writeString(inputFile, tc.getInput() != null ? tc.getInput() : "");
                runCmd = Arrays.asList(
                    "docker", "run", "--rm", "--network", "none", "--memory", MEMORY_LIMIT,
                    "-v", tempDir.toAbsolutePath().toString().replace("\\", "/") + ":/sandbox",
                    "-w", "/sandbox",
                    dockerImage, "sh", "-c", "./program < input.txt"
                );
            } else {
                String exeName = System.getProperty("os.name", "").toLowerCase().contains("win") ? "program.exe" : "./program";
                runCmd = Arrays.asList(tempDir.resolve(exeName).toAbsolutePath().toString());
            }

            long start = System.currentTimeMillis();
            ProcessResult runResult = useDocker 
                ? runProcess(runCmd, tempDir.toFile(), TIMEOUT_SECONDS)
                : runProcessWithInput(runCmd, tempDir.toFile(), tc.getInput(), TIMEOUT_SECONDS);
            long elapsed = System.currentTimeMillis() - start;
            double runtimeMs = (double) elapsed;
            totalTime += runtimeMs;

            if (runResult.timedOut) {
                results.add(new TestCaseResultItem(tc.getId(), false, "Time Limit Exceeded (> 5s)", runtimeMs, "TIMEOUT"));
                overallStatus = "TIME_LIMIT_EXCEEDED";
                break;
            }

            if (runResult.exitCode != 0) {
                results.add(new TestCaseResultItem(tc.getId(), false, "Runtime Error (exit code " + runResult.exitCode + "):\n" + runResult.stderr, runtimeMs, "RUNTIME_ERROR"));
                overallStatus = "RUNTIME_ERROR";
                break;
            }

            boolean pass = OutputNormalizer.equalsNormalized(runResult.stdout, tc.getExpectedOutput());
            if (pass) {
                passedCount++;
                results.add(new TestCaseResultItem(tc.getId(), true, runResult.stdout, runtimeMs, "PASSED"));
            } else {
                results.add(new TestCaseResultItem(tc.getId(), false, runResult.stdout, runtimeMs, "FAILED"));
                if ("ACCEPTED".equals(overallStatus)) {
                    overallStatus = "WRONG_ANSWER";
                }
            }
        }

        double avgExecTime = results.isEmpty() ? 0.0 : totalTime / results.size();
        String msg = "ACCEPTED".equals(overallStatus)
            ? "All test cases passed! Solution accepted."
            : passedCount + " of " + testCases.size() + " test cases passed.";

        return new EvaluationResult(overallStatus, msg, null, totalTime, compilationTimeMs, avgExecTime, compilationTimeMs, passedCount, testCases.size(), results);
    }

    private static class ProcessResult {
        final int exitCode;
        final String stdout;
        final String stderr;
        final boolean timedOut;

        ProcessResult(int exitCode, String stdout, String stderr, boolean timedOut) {
            this.exitCode = exitCode;
            this.stdout = stdout;
            this.stderr = stderr;
            this.timedOut = timedOut;
        }
    }

    private ProcessResult runProcess(List<String> command, File workingDir, int timeoutSeconds) {
        return runProcessWithInput(command, workingDir, null, timeoutSeconds);
    }

    private ProcessResult runProcessWithInput(List<String> command, File workingDir, String inputData, int timeoutSeconds) {
        try {
            ProcessBuilder pb = new ProcessBuilder(command);
            if (workingDir != null) {
                pb.directory(workingDir);
            }
            Process p = pb.start();

            if (inputData != null) {
                try (OutputStream os = p.getOutputStream()) {
                    os.write(inputData.getBytes(java.nio.charset.StandardCharsets.UTF_8));
                    os.flush();
                } catch (IOException ignored) {}
            }

            StringBuilder stdoutSb = new StringBuilder();
            StringBuilder stderrSb = new StringBuilder();

            Thread outThread = new Thread(() -> readStream(p.getInputStream(), stdoutSb));
            Thread errThread = new Thread(() -> readStream(p.getErrorStream(), stderrSb));
            outThread.start();
            errThread.start();

            boolean finished = p.waitFor(timeoutSeconds, TimeUnit.SECONDS);
            if (!finished) {
                p.destroyForcibly();
                outThread.interrupt();
                errThread.interrupt();
                return new ProcessResult(-1, stdoutSb.toString(), stderrSb.toString(), true);
            }

            outThread.join(1000);
            errThread.join(1000);

            return new ProcessResult(p.exitValue(), stdoutSb.toString(), stderrSb.toString(), false);
        } catch (Exception e) {
            return new ProcessResult(-1, "", e.getMessage(), false);
        }
    }

    private void readStream(InputStream is, StringBuilder sb) {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(is))) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (sb.length() > 0) sb.append("\n");
                sb.append(line);
            }
        } catch (IOException ignored) {}
    }

    private void deleteDirectoryRecursively(File file) {
        if (file.isDirectory()) {
            File[] children = file.listFiles();
            if (children != null) {
                for (File c : children) {
                    deleteDirectoryRecursively(c);
                }
            }
        }
        file.delete();
    }
}
