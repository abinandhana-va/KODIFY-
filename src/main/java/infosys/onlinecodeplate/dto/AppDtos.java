package infosys.onlinecodeplate.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.HashSet;

public class AppDtos {

    public static class TestCaseDto {
        private Long id;
        @NotBlank(message = "Test case input cannot be blank")
        private String input;
        @NotBlank(message = "Test case expected output cannot be blank")
        private String expectedOutput;
        private Boolean hidden = false;

        public TestCaseDto() {}
        public TestCaseDto(String input, String expectedOutput, Boolean hidden) {
            this.input = input;
            this.expectedOutput = expectedOutput;
            this.hidden = hidden != null ? hidden : false;
        }

        public Long getId() { return id; } public void setId(Long id) { this.id = id; }
        public String getInput() { return input; } public void setInput(String input) { this.input = input; }
        public String getExpectedOutput() { return expectedOutput; } public void setExpectedOutput(String expectedOutput) { this.expectedOutput = expectedOutput; }
        public Boolean getHidden() { return hidden; } public void setHidden(Boolean hidden) { this.hidden = hidden; }
    }

    public static class TestCaseResultDto {
        private Long testCaseId;
        private Integer testCaseNumber;
        private boolean passed;
        private Double runtime;
        private String status;
        private String actualOutput;
        private String input;
        private String expectedOutput;
        private Boolean hidden;
        private String errorMessage;
        private String compilationError;

        public TestCaseResultDto() {}
        public TestCaseResultDto(Long testCaseId, boolean passed, Double runtime, String status, String actualOutput, String input, String expectedOutput, Boolean hidden) {
            this.testCaseId = testCaseId;
            this.passed = passed;
            this.runtime = runtime;
            this.status = status;
            this.actualOutput = actualOutput;
            this.input = input;
            this.expectedOutput = expectedOutput;
            this.hidden = hidden;
        }

        public Long getTestCaseId() { return testCaseId; } public void setTestCaseId(Long testCaseId) { this.testCaseId = testCaseId; }
        public Integer getTestCaseNumber() { return testCaseNumber; } public void setTestCaseNumber(Integer testCaseNumber) { this.testCaseNumber = testCaseNumber; }
        public boolean isPassed() { return passed; } public void setPassed(boolean passed) { this.passed = passed; }
        public Double getRuntime() { return runtime; } public void setRuntime(Double runtime) { this.runtime = runtime; }
        public String getStatus() { return status; } public void setStatus(String status) { this.status = status; }
        public String getActualOutput() { return actualOutput; } public void setActualOutput(String actualOutput) { this.actualOutput = actualOutput; }
        public String getInput() { return input; } public void setInput(String input) { this.input = input; }
        public String getExpectedOutput() { return expectedOutput; } public void setExpectedOutput(String expectedOutput) { this.expectedOutput = expectedOutput; }
        public Boolean getHidden() { return hidden; } public void setHidden(Boolean hidden) { this.hidden = hidden; }
        public String getErrorMessage() { return errorMessage; } public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
        public String getCompilationError() { return compilationError; } public void setCompilationError(String compilationError) { this.compilationError = compilationError; }
    }

    public static class HintDto {
        private Long id;
        private Integer hintOrder;
        private String content;

        public HintDto() {}
        public HintDto(Long id, Integer hintOrder, String content) {
            this.id = id;
            this.hintOrder = hintOrder;
            this.content = content;
        }

        public Long getId() { return id; } public void setId(Long id) { this.id = id; }
        public Integer getHintOrder() { return hintOrder; } public void setHintOrder(Integer hintOrder) { this.hintOrder = hintOrder; }
        public String getContent() { return content; } public void setContent(String content) { this.content = content; }
    }

    public static class EditorialResponseDto {
        private Long problemId;
        private String problemTitle;
        private String editorial;
        private boolean hasEditorial;

        public EditorialResponseDto() {}
        public EditorialResponseDto(Long problemId, String problemTitle, String editorial, boolean hasEditorial) {
            this.problemId = problemId;
            this.problemTitle = problemTitle;
            this.editorial = editorial;
            this.hasEditorial = hasEditorial;
        }

        public Long getProblemId() { return problemId; } public void setProblemId(Long problemId) { this.problemId = problemId; }
        public String getProblemTitle() { return problemTitle; } public void setProblemTitle(String problemTitle) { this.problemTitle = problemTitle; }
        public String getEditorial() { return editorial; } public void setEditorial(String editorial) { this.editorial = editorial; }
        public boolean isHasEditorial() { return hasEditorial; } public void setHasEditorial(boolean hasEditorial) { this.hasEditorial = hasEditorial; }
    }

    public static class RunRequestDto {
        @NotBlank(message = "Language is required")
        private String language;
        @NotBlank(message = "Code content is required")
        private String code;

        public String getLanguage() { return language; }
        public void setLanguage(String language) { this.language = language; }
        public String getCode() { return code; }
        public void setCode(String code) { this.code = code; }
    }

    public static class RunResponseDto {
        private String status;
        private String message;
        private String compilerOutput;
        private Double aggregateRuntime;
        private Double compilationTimeMs;
        private Double averageExecutionTimeMs;
        private Double averageCompilationTimeMs;
        private Integer passedTestCases;
        private Integer totalTestCases;
        private Integer publicPassedCount;
        private Integer publicTotalCount;
        private List<TestCaseResultDto> testCaseResults = new ArrayList<>();

        public RunResponseDto() {}
        public RunResponseDto(String status, String message, String compilerOutput, Double aggregateRuntime, Integer passedTestCases, Integer totalTestCases, List<TestCaseResultDto> testCaseResults) {
            this.status = status;
            this.message = message;
            this.compilerOutput = compilerOutput;
            this.aggregateRuntime = aggregateRuntime;
            this.passedTestCases = passedTestCases;
            this.totalTestCases = totalTestCases;
            this.publicPassedCount = passedTestCases;
            this.publicTotalCount = totalTestCases;
            this.testCaseResults = testCaseResults;
        }

        public String getStatus() { return status; } public void setStatus(String status) { this.status = status; }
        public String getMessage() { return message; } public void setMessage(String message) { this.message = message; }
        public String getCompilerOutput() { return compilerOutput; } public void setCompilerOutput(String compilerOutput) { this.compilerOutput = compilerOutput; }
        public Double getAggregateRuntime() { return aggregateRuntime; } public void setAggregateRuntime(Double aggregateRuntime) { this.aggregateRuntime = aggregateRuntime; }
        public Double getCompilationTimeMs() { return compilationTimeMs; } public void setCompilationTimeMs(Double compilationTimeMs) { this.compilationTimeMs = compilationTimeMs; }
        public Double getAverageExecutionTimeMs() { return averageExecutionTimeMs; } public void setAverageExecutionTimeMs(Double averageExecutionTimeMs) { this.averageExecutionTimeMs = averageExecutionTimeMs; }
        public Double getAverageCompilationTimeMs() { return averageCompilationTimeMs; } public void setAverageCompilationTimeMs(Double averageCompilationTimeMs) { this.averageCompilationTimeMs = averageCompilationTimeMs; }
        public Integer getPassedTestCases() { return passedTestCases; } public void setPassedTestCases(Integer passedTestCases) { this.passedTestCases = passedTestCases; }
        public Integer getTotalTestCases() { return totalTestCases; } public void setTotalTestCases(Integer totalTestCases) { this.totalTestCases = totalTestCases; }
        public Integer getPublicPassedCount() { return publicPassedCount; } public void setPublicPassedCount(Integer publicPassedCount) { this.publicPassedCount = publicPassedCount; }
        public Integer getPublicTotalCount() { return publicTotalCount; } public void setPublicTotalCount(Integer publicTotalCount) { this.publicTotalCount = publicTotalCount; }
        public List<TestCaseResultDto> getTestCaseResults() { return testCaseResults; } public void setTestCaseResults(List<TestCaseResultDto> testCaseResults) { this.testCaseResults = testCaseResults; }
    }

    // User-facing problem DTO: NO solution fields allowed
    public static class ProblemDto {
        private Long id;
        @NotBlank(message = "Title is required") private String title;
        @NotBlank(message = "Topic / Concept is required") private String concept;
        @NotBlank(message = "Difficulty is required") private String difficulty;
        @NotBlank(message = "Problem statement is required") private String description;
        @NotBlank(message = "Constraints are required") private String constraints;
        private String testCases;
        private String starterCodeC;
        private String starterCodePython;
        private String starterCodeJava;
        private String starterCodeCpp;
        private String starterCodeJs;
        private String starterCodeGo;
        private String starterCodeRust;
        private List<TestCaseDto> testCasesList = new ArrayList<>();
        private List<HintDto> hints = new ArrayList<>();
        private List<String> concepts = new ArrayList<>();
        private boolean hasEditorial;
        private String questionType = "CODING";
        private List<String> options = new ArrayList<>();
        private String correctOption;
        private Set<String> allowedLanguages = new HashSet<>();
        private String imageUrl;
        private Long creatorId;
        private Boolean isPrivate = false;

        public Long getId() { return id; } public void setId(Long id) { this.id = id; }
        public String getTitle() { return title; } public void setTitle(String title) { this.title = title; }
        public String getConcept() { return concept; } public void setConcept(String concept) { this.concept = concept; }
        public List<String> getConcepts() { return concepts; } public void setConcepts(List<String> concepts) { this.concepts = concepts; }
        public String getDifficulty() { return difficulty; } public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
        public String getDescription() { return description; } public void setDescription(String description) { this.description = description; }
        public String getConstraints() { return constraints; } public void setConstraints(String constraints) { this.constraints = constraints; }
        public String getTestCases() { return testCases; } public void setTestCases(String testCases) { this.testCases = testCases; }
        public String getStarterCodeC() { return starterCodeC; } public void setStarterCodeC(String starterCodeC) { this.starterCodeC = starterCodeC; }
        public String getStarterCodePython() { return starterCodePython; } public void setStarterCodePython(String starterCodePython) { this.starterCodePython = starterCodePython; }
        public String getStarterCodeJava() { return starterCodeJava; } public void setStarterCodeJava(String starterCodeJava) { this.starterCodeJava = starterCodeJava; }
        public String getStarterCodeCpp() { return starterCodeCpp; } public void setStarterCodeCpp(String starterCodeCpp) { this.starterCodeCpp = starterCodeCpp; }
        public String getStarterCodeJs() { return starterCodeJs; } public void setStarterCodeJs(String starterCodeJs) { this.starterCodeJs = starterCodeJs; }
        public String getStarterCodeGo() { return starterCodeGo; } public void setStarterCodeGo(String starterCodeGo) { this.starterCodeGo = starterCodeGo; }
        public String getStarterCodeRust() { return starterCodeRust; } public void setStarterCodeRust(String starterCodeRust) { this.starterCodeRust = starterCodeRust; }
        public List<TestCaseDto> getTestCasesList() { return testCasesList; } public void setTestCasesList(List<TestCaseDto> testCasesList) { this.testCasesList = testCasesList; }
        public List<HintDto> getHints() { return hints; } public void setHints(List<HintDto> hints) { this.hints = hints; }
        public boolean isHasEditorial() { return hasEditorial; } public void setHasEditorial(boolean hasEditorial) { this.hasEditorial = hasEditorial; }
        public String getQuestionType() { return questionType != null ? questionType : "CODING"; } public void setQuestionType(String questionType) { this.questionType = questionType; }
        public List<String> getOptions() { return options != null ? options : new ArrayList<>(); } public void setOptions(List<String> options) { this.options = options; }
        public String getCorrectOption() { return correctOption; } public void setCorrectOption(String correctOption) { this.correctOption = correctOption; }
        public Set<String> getAllowedLanguages() { return allowedLanguages != null ? allowedLanguages : new HashSet<>(); } public void setAllowedLanguages(Set<String> allowedLanguages) { this.allowedLanguages = allowedLanguages; }
        public String getImageUrl() { return imageUrl; } public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
        public Long getCreatorId() { return creatorId; } public void setCreatorId(Long creatorId) { this.creatorId = creatorId; }
        public Boolean getIsPrivate() { return isPrivate != null ? isPrivate : false; } public void setIsPrivate(Boolean isPrivate) { this.isPrivate = isPrivate; }
    }

    // Admin-facing problem DTO: Includes starter codes AND reference solutions
    public static class AdminProblemDto extends ProblemDto {
        private String solution;
        private String solutionC;
        private String solutionPython;
        private String solutionJava;
        private String solutionCpp;
        private String solutionJs;
        private String solutionGo;
        private String solutionRust;
        private String editorial;

        public String getSolution() { return solution; } public void setSolution(String solution) { this.solution = solution; }
        public String getSolutionC() { return solutionC; } public void setSolutionC(String solutionC) { this.solutionC = solutionC; }
        public String getSolutionPython() { return solutionPython; } public void setSolutionPython(String solutionPython) { this.solutionPython = solutionPython; }
        public String getSolutionJava() { return solutionJava; } public void setSolutionJava(String solutionJava) { this.solutionJava = solutionJava; }
        public String getSolutionCpp() { return solutionCpp; } public void setSolutionCpp(String solutionCpp) { this.solutionCpp = solutionCpp; }
        public String getSolutionJs() { return solutionJs; } public void setSolutionJs(String solutionJs) { this.solutionJs = solutionJs; }
        public String getSolutionGo() { return solutionGo; } public void setSolutionGo(String solutionGo) { this.solutionGo = solutionGo; }
        public String getSolutionRust() { return solutionRust; } public void setSolutionRust(String solutionRust) { this.solutionRust = solutionRust; }
        public String getEditorial() { return editorial; } public void setEditorial(String editorial) { this.editorial = editorial; }
    }

    public static class SolutionResponseDto {
        private Long problemId;
        private String problemTitle;
        private String solutionC;
        private String solutionPython;
        private String solutionJava;
        private String solutionCpp;
        private String solutionJs;
        private String solutionGo;
        private String solutionRust;
        private boolean hasSolutionC;
        private boolean hasSolutionPython;
        private boolean hasSolutionJava;
        private boolean hasSolutionCpp;
        private boolean hasSolutionJs;
        private boolean hasSolutionGo;
        private boolean hasSolutionRust;

        public SolutionResponseDto() {}

        public Long getProblemId() { return problemId; } public void setProblemId(Long problemId) { this.problemId = problemId; }
        public String getProblemTitle() { return problemTitle; } public void setProblemTitle(String problemTitle) { this.problemTitle = problemTitle; }
        public String getSolutionC() { return solutionC; } public void setSolutionC(String solutionC) { this.solutionC = solutionC; }
        public String getSolutionPython() { return solutionPython; } public void setSolutionPython(String solutionPython) { this.solutionPython = solutionPython; }
        public String getSolutionJava() { return solutionJava; } public void setSolutionJava(String solutionJava) { this.solutionJava = solutionJava; }
        public String getSolutionCpp() { return solutionCpp; } public void setSolutionCpp(String solutionCpp) { this.solutionCpp = solutionCpp; }
        public String getSolutionJs() { return solutionJs; } public void setSolutionJs(String solutionJs) { this.solutionJs = solutionJs; }
        public String getSolutionGo() { return solutionGo; } public void setSolutionGo(String solutionGo) { this.solutionGo = solutionGo; }
        public String getSolutionRust() { return solutionRust; } public void setSolutionRust(String solutionRust) { this.solutionRust = solutionRust; }
        public boolean isHasSolutionC() { return hasSolutionC; } public void setHasSolutionC(boolean hasSolutionC) { this.hasSolutionC = hasSolutionC; }
        public boolean isHasSolutionPython() { return hasSolutionPython; } public void setHasSolutionPython(boolean hasSolutionPython) { this.hasSolutionPython = hasSolutionPython; }
        public boolean isHasSolutionJava() { return hasSolutionJava; } public void setHasSolutionJava(boolean hasSolutionJava) { this.hasSolutionJava = hasSolutionJava; }
        public boolean isHasSolutionCpp() { return hasSolutionCpp; } public void setHasSolutionCpp(boolean hasSolutionCpp) { this.hasSolutionCpp = hasSolutionCpp; }
        public boolean isHasSolutionJs() { return hasSolutionJs; } public void setHasSolutionJs(boolean hasSolutionJs) { this.hasSolutionJs = hasSolutionJs; }
        public boolean isHasSolutionGo() { return hasSolutionGo; } public void setHasSolutionGo(boolean hasSolutionGo) { this.hasSolutionGo = hasSolutionGo; }
        public boolean isHasSolutionRust() { return hasSolutionRust; } public void setHasSolutionRust(boolean hasSolutionRust) { this.hasSolutionRust = hasSolutionRust; }
    }

    public static class SubmissionRequestDto {
        @NotBlank(message = "Language is required")
        private String language;
        @NotBlank(message = "Code content is required")
        private String code;

        public String getLanguage() { return language; }
        public void setLanguage(String language) { this.language = language; }
        public String getCode() { return code; }
        public void setCode(String code) { this.code = code; }
    }

    public static class SubmissionResponseDto {
        private Long submissionId;
        private String status;
        private String message;
        private boolean solved;
        private Double runtime;
        private Double compilationTimeMs;
        private Double averageExecutionTimeMs;
        private Double averageCompilationTimeMs;
        private Integer passedTestCases;
        private Integer totalTestCases;
        private Integer publicPassedCount;
        private Integer publicTotalCount;
        private Integer privatePassedCount;
        private Integer privateTotalCount;
        private Double privateAverageExecutionTimeMs;
        private Double privateAverageCompilationTimeMs;
        private String language;
        private String code;
        private String compilerOutput;
        private LocalDateTime submittedAt;
        private List<TestCaseResultDto> testCaseResults = new ArrayList<>();

        public SubmissionResponseDto() {}
        public SubmissionResponseDto(Long submissionId, String status, String message, boolean solved, LocalDateTime submittedAt) {
            this.submissionId = submissionId;
            this.status = status;
            this.message = message;
            this.solved = solved;
            this.submittedAt = submittedAt;
        }

        public Long getSubmissionId() { return submissionId; } public void setSubmissionId(Long submissionId) { this.submissionId = submissionId; }
        public String getLanguage() { return language; } public void setLanguage(String language) { this.language = language; }
        public String getCode() { return code; } public void setCode(String code) { this.code = code; }
        public String getStatus() { return status; } public void setStatus(String status) { this.status = status; }
        public String getMessage() { return message; } public void setMessage(String message) { this.message = message; }
        public boolean isSolved() { return solved; } public void setSolved(boolean solved) { this.solved = solved; }
        public Double getRuntime() { return runtime; } public void setRuntime(Double runtime) { this.runtime = runtime; }
        public Double getCompilationTimeMs() { return compilationTimeMs; } public void setCompilationTimeMs(Double compilationTimeMs) { this.compilationTimeMs = compilationTimeMs; }
        public Double getAverageExecutionTimeMs() { return averageExecutionTimeMs; } public void setAverageExecutionTimeMs(Double averageExecutionTimeMs) { this.averageExecutionTimeMs = averageExecutionTimeMs; }
        public Double getAverageCompilationTimeMs() { return averageCompilationTimeMs; } public void setAverageCompilationTimeMs(Double averageCompilationTimeMs) { this.averageCompilationTimeMs = averageCompilationTimeMs; }
        public Integer getPassedTestCases() { return passedTestCases; } public void setPassedTestCases(Integer passedTestCases) { this.passedTestCases = passedTestCases; }
        public Integer getTotalTestCases() { return totalTestCases; } public void setTotalTestCases(Integer totalTestCases) { this.totalTestCases = totalTestCases; }
        public Integer getPublicPassedCount() { return publicPassedCount; } public void setPublicPassedCount(Integer publicPassedCount) { this.publicPassedCount = publicPassedCount; }
        public Integer getPublicTotalCount() { return publicTotalCount; } public void setPublicTotalCount(Integer publicTotalCount) { this.publicTotalCount = publicTotalCount; }
        public Integer getPrivatePassedCount() { return privatePassedCount; } public void setPrivatePassedCount(Integer privatePassedCount) { this.privatePassedCount = privatePassedCount; }
        public Integer getPrivateTotalCount() { return privateTotalCount; } public void setPrivateTotalCount(Integer privateTotalCount) { this.privateTotalCount = privateTotalCount; }
        public Double getPrivateAverageExecutionTimeMs() { return privateAverageExecutionTimeMs; } public void setPrivateAverageExecutionTimeMs(Double privateAverageExecutionTimeMs) { this.privateAverageExecutionTimeMs = privateAverageExecutionTimeMs; }
        public Double getPrivateAverageCompilationTimeMs() { return privateAverageCompilationTimeMs; } public void setPrivateAverageCompilationTimeMs(Double privateAverageCompilationTimeMs) { this.privateAverageCompilationTimeMs = privateAverageCompilationTimeMs; }
        public String getCompilerOutput() { return compilerOutput; } public void setCompilerOutput(String compilerOutput) { this.compilerOutput = compilerOutput; }
        public LocalDateTime getSubmittedAt() { return submittedAt; } public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }
        public List<TestCaseResultDto> getTestCaseResults() { return testCaseResults; } public void setTestCaseResults(List<TestCaseResultDto> testCaseResults) { this.testCaseResults = testCaseResults; }
    }

    public static class UserSubmissionDto {
        private Long id;
        private Long userId;
        private String username;
        private String name;
        private Long problemId;
        private String problemTitle;
        private String concept;
        private String difficulty;
        private String language;
        private String code;
        private String status;
        private Double runtime;
        private Integer passedTestCases;
        private Integer totalTestCases;
        private LocalDateTime createdAt;
        private List<TestCaseResultDto> testCaseResults = new ArrayList<>();

        public Long getId() { return id; } public void setId(Long id) { this.id = id; }
        public Long getUserId() { return userId; } public void setUserId(Long userId) { this.userId = userId; }
        public String getUsername() { return username; } public void setUsername(String username) { this.username = username; }
        public String getName() { return name; } public void setName(String name) { this.name = name; }
        public Long getProblemId() { return problemId; } public void setProblemId(Long problemId) { this.problemId = problemId; }
        public String getProblemTitle() { return problemTitle; } public void setProblemTitle(String problemTitle) { this.problemTitle = problemTitle; }
        public String getConcept() { return concept; } public void setConcept(String concept) { this.concept = concept; }
        public String getDifficulty() { return difficulty; } public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
        public String getLanguage() { return language; } public void setLanguage(String language) { this.language = language; }
        public String getCode() { return code; } public void setCode(String code) { this.code = code; }
        public String getStatus() { return status; } public void setStatus(String status) { this.status = status; }
        public Double getRuntime() { return runtime; } public void setRuntime(Double runtime) { this.runtime = runtime; }
        public Integer getPassedTestCases() { return passedTestCases; } public void setPassedTestCases(Integer passedTestCases) { this.passedTestCases = passedTestCases; }
        public Integer getTotalTestCases() { return totalTestCases; } public void setTotalTestCases(Integer totalTestCases) { this.totalTestCases = totalTestCases; }
        public LocalDateTime getCreatedAt() { return createdAt; } public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
        public List<TestCaseResultDto> getTestCaseResults() { return testCaseResults; } public void setTestCaseResults(List<TestCaseResultDto> testCaseResults) { this.testCaseResults = testCaseResults; }
    }

    public static class UserActivityDto {
        private Long id;
        private String action;
        private String description;
        private LocalDateTime createdAt;

        public Long getId() { return id; } public void setId(Long id) { this.id = id; }
        public String getAction() { return action; } public void setAction(String action) { this.action = action; }
        public String getDescription() { return description; } public void setDescription(String description) { this.description = description; }
        public LocalDateTime getCreatedAt() { return createdAt; } public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    }

    public static class LeaderboardEntryDto {
        private int rank;
        private Long userId;
        private String username;
        private String name;
        private int problemsSolved;
        private int score;
        private double acceptanceRate;
        private int totalSubmissions;
        private int acceptedSubmissions;
        private Double fastestAcceptedRuntime;

        public LeaderboardEntryDto() {}

        public LeaderboardEntryDto(int rank, Long userId, String username, String name, int problemsSolved, int score, double acceptanceRate, int totalSubmissions, int acceptedSubmissions) {
            this.rank = rank;
            this.userId = userId;
            this.username = username;
            this.name = name;
            this.problemsSolved = problemsSolved;
            this.score = score;
            this.acceptanceRate = acceptanceRate;
            this.totalSubmissions = totalSubmissions;
            this.acceptedSubmissions = acceptedSubmissions;
        }

        public int getRank() { return rank; }
        public void setRank(int rank) { this.rank = rank; }
        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public int getProblemsSolved() { return problemsSolved; }
        public void setProblemsSolved(int problemsSolved) { this.problemsSolved = problemsSolved; }
        public int getScore() { return score; }
        public void setScore(int score) { this.score = score; }
        public double getAcceptanceRate() { return acceptanceRate; }
        public void setAcceptanceRate(double acceptanceRate) { this.acceptanceRate = acceptanceRate; }
        public int getTotalSubmissions() { return totalSubmissions; }
        public void setTotalSubmissions(int totalSubmissions) { this.totalSubmissions = totalSubmissions; }
        public int getAcceptedSubmissions() { return acceptedSubmissions; }
        public void setAcceptedSubmissions(int acceptedSubmissions) { this.acceptedSubmissions = acceptedSubmissions; }
        public Double getFastestAcceptedRuntime() { return fastestAcceptedRuntime; }
        public void setFastestAcceptedRuntime(Double fastestAcceptedRuntime) { this.fastestAcceptedRuntime = fastestAcceptedRuntime; }
    }

    public static class CertificateStatusDto {
        private boolean unlocked;
        private int solvedCount;
        private int requiredCount;
        private String userName;
        private String userEmail;
        private String issueDate;
        private String certificateId;

        public CertificateStatusDto() {}
        public CertificateStatusDto(boolean unlocked, int solvedCount, int requiredCount, String userName, String userEmail, String issueDate, String certificateId) {
            this.unlocked = unlocked;
            this.solvedCount = solvedCount;
            this.requiredCount = requiredCount;
            this.userName = userName;
            this.userEmail = userEmail;
            this.issueDate = issueDate;
            this.certificateId = certificateId;
        }

        public boolean isUnlocked() { return unlocked; }
        public void setUnlocked(boolean unlocked) { this.unlocked = unlocked; }
        public int getSolvedCount() { return solvedCount; }
        public void setSolvedCount(int solvedCount) { this.solvedCount = solvedCount; }
        public int getRequiredCount() { return requiredCount; }
        public void setRequiredCount(int requiredCount) { this.requiredCount = requiredCount; }
        public String getUserName() { return userName; }
        public void setUserName(String userName) { this.userName = userName; }
        public String getUserEmail() { return userEmail; }
        public void setUserEmail(String userEmail) { this.userEmail = userEmail; }
        public String getIssueDate() { return issueDate; }
        public void setIssueDate(String issueDate) { this.issueDate = issueDate; }
        public String getCertificateId() { return certificateId; }
        public void setCertificateId(String certificateId) { this.certificateId = certificateId; }
    }

    public static class BadgeDto {
        private Long id;
        private String name;
        private String description;
        private String imageUrl;
        private String shape; // CIRCLE, HEXAGON, DIAMOND
        private String metric; // PROBLEMS_SOLVED
        private Integer target;
        private Boolean enabled;
        private LocalDateTime createdAt;
        private boolean earned;
        private LocalDateTime earnedAt;
        private int currentProgress;
        private long earnedCount;

        public BadgeDto() {}

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public String getImageUrl() { return imageUrl; }
        public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
        public String getShape() { return shape; }
        public void setShape(String shape) { this.shape = shape; }
        public String getMetric() { return metric; }
        public void setMetric(String metric) { this.metric = metric; }
        public Integer getTarget() { return target; }
        public void setTarget(Integer target) { this.target = target; }
        public Boolean getEnabled() { return enabled; }
        public void setEnabled(Boolean enabled) { this.enabled = enabled; }
        public LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
        public boolean isEarned() { return earned; }
        public void setEarned(boolean earned) { this.earned = earned; }
        public LocalDateTime getEarnedAt() { return earnedAt; }
        public void setEarnedAt(LocalDateTime earnedAt) { this.earnedAt = earnedAt; }
        public int getCurrentProgress() { return currentProgress; }
        public void setCurrentProgress(int currentProgress) { this.currentProgress = currentProgress; }
        public long getEarnedCount() { return earnedCount; }
        public void setEarnedCount(long earnedCount) { this.earnedCount = earnedCount; }
    }

    public static class BadgeRequestDto {
        @NotBlank(message = "Badge name is required")
        private String name;
        private String description;
        private String imageUrl;
        @NotBlank(message = "Badge shape is required (CIRCLE, HEXAGON, DIAMOND)")
        private String shape;
        private String metric = "PROBLEMS_SOLVED";
        @NotNull(message = "Target value is required")
        @Min(value = 1, message = "Target must be at least 1")
        private Integer target = 1;
        private Boolean enabled = true;

        public BadgeRequestDto() {}

        public String getName() { return name; } public void setName(String name) { this.name = name; }
        public String getDescription() { return description; } public void setDescription(String description) { this.description = description; }
        public String getImageUrl() { return imageUrl; } public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
        public String getShape() { return shape; } public void setShape(String shape) { this.shape = shape; }
        public String getMetric() { return metric; } public void setMetric(String metric) { this.metric = metric; }
        public Integer getTarget() { return target; } public void setTarget(Integer target) { this.target = target; }
        public Boolean getEnabled() { return enabled; } public void setEnabled(Boolean enabled) { this.enabled = enabled; }
    }

    public static class CertificateDto {
        private Long id;
        private String name;
        private String description;
        private String templateStyle = "STANDARD"; // STANDARD, ADVANCED, ELITE, CUSTOM
        private String templateDocument;
        private String achievementType = "PROBLEMS_SOLVED";
        private String category = "GENERAL"; // GENERAL, CONTEST, CODING_MILESTONE, ASSIGNMENT, COURSE, EVENT, CHALLENGE
        private Long contestId;
        private String contestTitle;
        private LocalDateTime contestDate;
        private Integer rank;
        private Integer target;
        private Boolean enabled;
        private LocalDateTime createdAt;
        private boolean unlocked;
        private LocalDateTime unlockedAt;
        private int currentProgress;
        private String certificateId;
        private boolean downloadable;
        private long unlockedCount;

        public CertificateDto() {}

        public String getCategory() { return category != null ? category : "GENERAL"; }
        public void setCategory(String category) { this.category = category; }

        public String getTemplateDocument() { return templateDocument; }
        public void setTemplateDocument(String templateDocument) { this.templateDocument = templateDocument; }

        public Long getContestId() { return contestId; }
        public void setContestId(Long contestId) { this.contestId = contestId; }

        public String getContestTitle() { return contestTitle; }
        public void setContestTitle(String contestTitle) { this.contestTitle = contestTitle; }

        public LocalDateTime getContestDate() { return contestDate; }
        public void setContestDate(LocalDateTime contestDate) { this.contestDate = contestDate; }

        public Integer getRank() { return rank; }
        public void setRank(Integer rank) { this.rank = rank; }

        public Long getId() { return id; } public void setId(Long id) { this.id = id; }
        public String getName() { return name; } public void setName(String name) { this.name = name; }
        public String getDescription() { return description; } public void setDescription(String description) { this.description = description; }
        public String getTemplateStyle() { return templateStyle; } public void setTemplateStyle(String templateStyle) { this.templateStyle = templateStyle; }
        public String getAchievementType() { return achievementType; } public void setAchievementType(String achievementType) { this.achievementType = achievementType; }
        public Integer getTarget() { return target; } public void setTarget(Integer target) { this.target = target; }
        public Boolean getEnabled() { return enabled; } public void setEnabled(Boolean enabled) { this.enabled = enabled; }
        public LocalDateTime getCreatedAt() { return createdAt; } public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
        public boolean isUnlocked() { return unlocked; } public void setUnlocked(boolean unlocked) { this.unlocked = unlocked; }
        public LocalDateTime getUnlockedAt() { return unlockedAt; } public void setUnlockedAt(LocalDateTime unlockedAt) { this.unlockedAt = unlockedAt; }
        public int getCurrentProgress() { return currentProgress; } public void setCurrentProgress(int currentProgress) { this.currentProgress = currentProgress; }
        public String getCertificateId() { return certificateId; } public void setCertificateId(String certificateId) { this.certificateId = certificateId; }
        public boolean isDownloadable() { return downloadable; } public void setDownloadable(boolean downloadable) { this.downloadable = downloadable; }
        public long getUnlockedCount() { return unlockedCount; } public void setUnlockedCount(long unlockedCount) { this.unlockedCount = unlockedCount; }
    }

    public static class CertificateRequestDto {
        @NotBlank(message = "Certificate name is required")
        private String name;
        private String description;
        private String templateStyle = "STANDARD"; // STANDARD, ADVANCED, ELITE, CUSTOM
        private String templateDocument;
        private String achievementType = "PROBLEMS_SOLVED";
        private String category = "GENERAL";
        @NotNull(message = "Target value is required")
        @Min(value = 1, message = "Target must be at least 1")
        private Integer target = 5;
        private Boolean enabled = true;

        public CertificateRequestDto() {}

        public String getCategory() { return category != null ? category : "GENERAL"; }
        public void setCategory(String category) { this.category = category; }

        public String getTemplateDocument() { return templateDocument; }
        public void setTemplateDocument(String templateDocument) { this.templateDocument = templateDocument; }

        public String getName() { return name; } public void setName(String name) { this.name = name; }
        public String getDescription() { return description; } public void setDescription(String description) { this.description = description; }
        public String getTemplateStyle() { return templateStyle; } public void setTemplateStyle(String templateStyle) { this.templateStyle = templateStyle; }
        public String getAchievementType() { return achievementType; } public void setAchievementType(String achievementType) { this.achievementType = achievementType; }
        public Integer getTarget() { return target; } public void setTarget(Integer target) { this.target = target; }
        public Boolean getEnabled() { return enabled; } public void setEnabled(Boolean enabled) { this.enabled = enabled; }
    }

    public static class UserContestStatsDto {
        private int participatedCount;
        private int conductedCount;
        private int winsCount;
        private int currentStreak;
        private int longestStreak;

        public UserContestStatsDto() {}
        public UserContestStatsDto(int participatedCount, int conductedCount, int winsCount, int currentStreak, int longestStreak) {
            this.participatedCount = participatedCount;
            this.conductedCount = conductedCount;
            this.winsCount = winsCount;
            this.currentStreak = currentStreak;
            this.longestStreak = longestStreak;
        }

        public int getParticipatedCount() { return participatedCount; } public void setParticipatedCount(int participatedCount) { this.participatedCount = participatedCount; }
        public int getConductedCount() { return conductedCount; } public void setConductedCount(int conductedCount) { this.conductedCount = conductedCount; }
        public int getWinsCount() { return winsCount; } public void setWinsCount(int winsCount) { this.winsCount = winsCount; }
        public int getCurrentStreak() { return currentStreak; } public void setCurrentStreak(int currentStreak) { this.currentStreak = currentStreak; }
        public int getLongestStreak() { return longestStreak; } public void setLongestStreak(int longestStreak) { this.longestStreak = longestStreak; }
    }

    public static class ContestDto {
        private Long id;
        private String title;
        private String organizationName;
        private String description;
        private Long organizerId;
        private String organizerName;
        private String organizerUsername;
        private String organizerRole;
        private String contestType = "SCHEDULED"; // SCHEDULED, OPEN
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private LocalDateTime registrationStartTime;
        private LocalDateTime registrationDeadline;
        private long durationMinutes;
        private String bannerUrl;
        private Integer maxParticipants;
        private String status;
        private long participantCount;
        private int questionCount;
        private boolean isRegistered;
        private boolean isRegistrationClosed;
        private boolean canRegister;
        private boolean hasStarted;
        private boolean hasEnded;
        private LocalDateTime createdAt;
        private LocalDateTime serverTime;
        private long remainingSeconds;
        private boolean waitingRoom;
        private boolean isArenaUnlocked;
        private Integer reminderMinutes = 10;
        private String scoringMethod = "ACM_ICPC";
        private boolean agreedToRules = false;
        private Integer userRank;
        private String participantStatus;
        private Integer fullscreenViolations;
        private String terminationReason;
        private Boolean cameraPermissionGranted;
        private Boolean micPermissionGranted;
        private String accessMode = "PUBLIC";
        private boolean isInvited = true;

        public ContestDto() {}

        public String getParticipantStatus() { return participantStatus; } public void setParticipantStatus(String participantStatus) { this.participantStatus = participantStatus; }
        public Integer getFullscreenViolations() { return fullscreenViolations; } public void setFullscreenViolations(Integer fullscreenViolations) { this.fullscreenViolations = fullscreenViolations; }
        public String getTerminationReason() { return terminationReason; } public void setTerminationReason(String terminationReason) { this.terminationReason = terminationReason; }
        public Boolean getCameraPermissionGranted() { return cameraPermissionGranted; } public void setCameraPermissionGranted(Boolean cameraPermissionGranted) { this.cameraPermissionGranted = cameraPermissionGranted; }
        public Boolean getMicPermissionGranted() { return micPermissionGranted; } public void setMicPermissionGranted(Boolean micPermissionGranted) { this.micPermissionGranted = micPermissionGranted; }

        public String getAccessMode() { return accessMode != null ? accessMode : "PUBLIC"; }
        public void setAccessMode(String accessMode) { this.accessMode = accessMode != null ? accessMode.toUpperCase() : "PUBLIC"; }

        public Integer getUserRank() { return userRank; } public void setUserRank(Integer userRank) { this.userRank = userRank; }
        public boolean isAgreedToRules() { return agreedToRules; } public void setAgreedToRules(boolean agreedToRules) { this.agreedToRules = agreedToRules; }
        public Integer getReminderMinutes() { return reminderMinutes != null ? reminderMinutes : 10; } public void setReminderMinutes(Integer reminderMinutes) { this.reminderMinutes = reminderMinutes; }
        public String getScoringMethod() { return scoringMethod != null ? scoringMethod : "ACM_ICPC"; } public void setScoringMethod(String scoringMethod) { this.scoringMethod = scoringMethod; }
        public boolean isInvited() { return isInvited; } public void setInvited(boolean isInvited) { this.isInvited = isInvited; }
        public Long getId() { return id; } public void setId(Long id) { this.id = id; }
        public String getTitle() { return title; } public void setTitle(String title) { this.title = title; }
        public String getOrganizationName() { return organizationName; } public void setOrganizationName(String organizationName) { this.organizationName = organizationName; }
        public String getDescription() { return description; } public void setDescription(String description) { this.description = description; }
        public String getContestType() { return contestType != null ? contestType : "SCHEDULED"; } public void setContestType(String contestType) { this.contestType = contestType; }
        public Long getOrganizerId() { return organizerId; } public void setOrganizerId(Long organizerId) { this.organizerId = organizerId; }
        public String getOrganizerName() { return organizerName; } public void setOrganizerName(String organizerName) { this.organizerName = organizerName; }
        public String getOrganizerUsername() { return organizerUsername; } public void setOrganizerUsername(String organizerUsername) { this.organizerUsername = organizerUsername; }
        public String getOrganizerRole() { return organizerRole; } public void setOrganizerRole(String organizerRole) { this.organizerRole = organizerRole; }
        public LocalDateTime getStartTime() { return startTime; } public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }
        public LocalDateTime getEndTime() { return endTime; } public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }
        public LocalDateTime getRegistrationStartTime() { return registrationStartTime; } public void setRegistrationStartTime(LocalDateTime registrationStartTime) { this.registrationStartTime = registrationStartTime; }
        public LocalDateTime getRegistrationDeadline() { return registrationDeadline; } public void setRegistrationDeadline(LocalDateTime registrationDeadline) { this.registrationDeadline = registrationDeadline; }
        public long getDurationMinutes() { return durationMinutes; } public void setDurationMinutes(long durationMinutes) { this.durationMinutes = durationMinutes; }
        public String getBannerUrl() { return bannerUrl; } public void setBannerUrl(String bannerUrl) { this.bannerUrl = bannerUrl; }
        public Integer getMaxParticipants() { return maxParticipants; } public void setMaxParticipants(Integer maxParticipants) { this.maxParticipants = maxParticipants; }
        public String getStatus() { return status; } public void setStatus(String status) { this.status = status; }
        public long getParticipantCount() { return participantCount; } public void setParticipantCount(long participantCount) { this.participantCount = participantCount; }
        public int getQuestionCount() { return questionCount; } public void setQuestionCount(int questionCount) { this.questionCount = questionCount; }
        public boolean isRegistered() { return isRegistered; } public void setRegistered(boolean isRegistered) { this.isRegistered = isRegistered; }
        public boolean isRegistrationClosed() { return isRegistrationClosed; } public void setRegistrationClosed(boolean isRegistrationClosed) { this.isRegistrationClosed = isRegistrationClosed; }
        public boolean isCanRegister() { return canRegister; } public void setCanRegister(boolean canRegister) { this.canRegister = canRegister; }
        public boolean isHasStarted() { return hasStarted; } public void setHasStarted(boolean hasStarted) { this.hasStarted = hasStarted; }
        public boolean isHasEnded() { return hasEnded; } public void setHasEnded(boolean hasEnded) { this.hasEnded = hasEnded; }
        public LocalDateTime getCreatedAt() { return createdAt; } public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
        public LocalDateTime getServerTime() { return serverTime; } public void setServerTime(LocalDateTime serverTime) { this.serverTime = serverTime; }
        public long getRemainingSeconds() { return remainingSeconds; } public void setRemainingSeconds(long remainingSeconds) { this.remainingSeconds = remainingSeconds; }
        public boolean isWaitingRoom() { return waitingRoom; } public void setWaitingRoom(boolean waitingRoom) { this.waitingRoom = waitingRoom; }
        public boolean isArenaUnlocked() { return isArenaUnlocked; } public void setArenaUnlocked(boolean isArenaUnlocked) { this.isArenaUnlocked = isArenaUnlocked; }
    }

    public static class ContestQuestionDto {
        private Long problemId;
        private String title;
        private String difficulty;
        private String concept;
        private Integer points;
        private Integer questionOrder;
        private boolean solved;
        private String description;
        private String constraints;
        private String starterCodeC;
        private String starterCodePython;
        private String starterCodeJava;
        private String starterCodeCpp;
        private String starterCodeJs;
        private String starterCodeGo;
        private String starterCodeRust;
        private Set<String> allowedLanguages = new HashSet<>();
        private List<TestCaseDto> testCasesList = new ArrayList<>();
        private List<HintDto> hints = new ArrayList<>();

        public ContestQuestionDto() {}

        public Long getProblemId() { return problemId; } public void setProblemId(Long problemId) { this.problemId = problemId; }
        public String getTitle() { return title; } public void setTitle(String title) { this.title = title; }
        public String getDifficulty() { return difficulty; } public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
        public String getConcept() { return concept; } public void setConcept(String concept) { this.concept = concept; }
        public Integer getPoints() { return points; } public void setPoints(Integer points) { this.points = points; }
        public Integer getQuestionOrder() { return questionOrder; } public void setQuestionOrder(Integer questionOrder) { this.questionOrder = questionOrder; }
        public boolean isSolved() { return solved; } public void setSolved(boolean solved) { this.solved = solved; }
        public String getDescription() { return description; } public void setDescription(String description) { this.description = description; }
        public String getConstraints() { return constraints; } public void setConstraints(String constraints) { this.constraints = constraints; }
        public String getStarterCodeC() { return starterCodeC; } public void setStarterCodeC(String starterCodeC) { this.starterCodeC = starterCodeC; }
        public String getStarterCodePython() { return starterCodePython; } public void setStarterCodePython(String starterCodePython) { this.starterCodePython = starterCodePython; }
        public String getStarterCodeJava() { return starterCodeJava; } public void setStarterCodeJava(String starterCodeJava) { this.starterCodeJava = starterCodeJava; }
        public String getStarterCodeCpp() { return starterCodeCpp; } public void setStarterCodeCpp(String starterCodeCpp) { this.starterCodeCpp = starterCodeCpp; }
        public String getStarterCodeJs() { return starterCodeJs; } public void setStarterCodeJs(String starterCodeJs) { this.starterCodeJs = starterCodeJs; }
        public String getStarterCodeGo() { return starterCodeGo; } public void setStarterCodeGo(String starterCodeGo) { this.starterCodeGo = starterCodeGo; }
        public String getStarterCodeRust() { return starterCodeRust; } public void setStarterCodeRust(String starterCodeRust) { this.starterCodeRust = starterCodeRust; }
        public Set<String> getAllowedLanguages() { return allowedLanguages; } public void setAllowedLanguages(Set<String> allowedLanguages) { this.allowedLanguages = allowedLanguages; }
        public List<TestCaseDto> getTestCasesList() { return testCasesList; } public void setTestCasesList(List<TestCaseDto> testCasesList) { this.testCasesList = testCasesList; }
        public List<HintDto> getHints() { return hints; } public void setHints(List<HintDto> hints) { this.hints = hints; }
    }

    public static class ContestDetailDto extends ContestDto {
        private List<ContestQuestionDto> questions = new ArrayList<>();
        private int userScore;
        private int userProblemsSolved;

        public List<ContestQuestionDto> getQuestions() { return questions; } public void setQuestions(List<ContestQuestionDto> questions) { this.questions = questions; }
        public int getUserScore() { return userScore; } public void setUserScore(int userScore) { this.userScore = userScore; }
        public int getUserProblemsSolved() { return userProblemsSolved; } public void setUserProblemsSolved(int userProblemsSolved) { this.userProblemsSolved = userProblemsSolved; }
    }

    public static class ContestRequestDto {
        @NotBlank(message = "Contest title is required")
        private String title;
        private String organizationName;
        private String description;
        private String contestType = "SCHEDULED"; // SCHEDULED, OPEN
        @NotNull(message = "Start time is required")
        private LocalDateTime startTime;
        @NotNull(message = "End time is required")
        private LocalDateTime endTime;
        private LocalDateTime registrationStartTime;
        private LocalDateTime registrationDeadline;
        private Integer durationMinutes;
        private String bannerUrl;
        private Integer maxParticipants;
        private String status = "PUBLISHED";
        private String accessMode = "PUBLIC"; // PUBLIC, INVITED, PRIVATE
        private Integer reminderMinutes = 10;
        private String scoringMethod = "ACM_ICPC";
        private List<Long> problemIds = new ArrayList<>();
        private List<Integer> problemPoints = new ArrayList<>();
        private List<Long> invitedUserIds = new ArrayList<>();

        public ContestRequestDto() {}

        public String getAccessMode() { return accessMode != null ? accessMode : "PUBLIC"; }
        public void setAccessMode(String accessMode) { this.accessMode = accessMode != null ? accessMode.toUpperCase() : "PUBLIC"; }

        public Integer getReminderMinutes() { return reminderMinutes != null ? reminderMinutes : 10; } public void setReminderMinutes(Integer reminderMinutes) { this.reminderMinutes = reminderMinutes; }
        public String getScoringMethod() { return scoringMethod != null ? scoringMethod : "ACM_ICPC"; } public void setScoringMethod(String scoringMethod) { this.scoringMethod = scoringMethod; }
        public List<Long> getInvitedUserIds() { return invitedUserIds; } public void setInvitedUserIds(List<Long> invitedUserIds) { this.invitedUserIds = invitedUserIds; }

        public String getTitle() { return title; } public void setTitle(String title) { this.title = title; }
        public String getOrganizationName() { return organizationName; } public void setOrganizationName(String organizationName) { this.organizationName = organizationName; }
        public String getDescription() { return description; } public void setDescription(String description) { this.description = description; }
        public String getContestType() { return contestType != null ? contestType : "SCHEDULED"; } public void setContestType(String contestType) { this.contestType = contestType; }
        public LocalDateTime getStartTime() { return startTime; } public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }
        public LocalDateTime getEndTime() { return endTime; } public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }
        public LocalDateTime getRegistrationStartTime() { return registrationStartTime; } public void setRegistrationStartTime(LocalDateTime registrationStartTime) { this.registrationStartTime = registrationStartTime; }
        public LocalDateTime getRegistrationDeadline() { return registrationDeadline; } public void setRegistrationDeadline(LocalDateTime registrationDeadline) { this.registrationDeadline = registrationDeadline; }
        public Integer getDurationMinutes() { return durationMinutes; } public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }
        public String getBannerUrl() { return bannerUrl; } public void setBannerUrl(String bannerUrl) { this.bannerUrl = bannerUrl; }
        public Integer getMaxParticipants() { return maxParticipants; } public void setMaxParticipants(Integer maxParticipants) { this.maxParticipants = maxParticipants; }
        public String getStatus() { return status; } public void setStatus(String status) { this.status = status; }
        public List<Long> getProblemIds() { return problemIds; } public void setProblemIds(List<Long> problemIds) { this.problemIds = problemIds; }
        public List<Integer> getProblemPoints() { return problemPoints; } public void setProblemPoints(List<Integer> problemPoints) { this.problemPoints = problemPoints; }
    }

    public static class ContestResultDto {
        private Long contestId;
        private String contestTitle;
        private Integer rank;
        private Integer score;
        private Integer totalPossibleScore;
        private Integer solvedCount;
        private Integer totalQuestions;
        private Integer attemptedCount;
        private Integer wrongCount;
        private Integer unansweredCount;
        private Long timeTakenSeconds;
        private String formattedTime;
        private boolean disqualified;
        private String terminationReason;
        private LocalDateTime terminatedAt;
        private int fullscreenViolations;
        private List<ContestProblemResultDto> problemResults = new ArrayList<>();
        private List<ContestLeaderboardEntryDto> finalLeaderboard = new ArrayList<>();

        public ContestResultDto() {}

        public Long getContestId() { return contestId; } public void setContestId(Long contestId) { this.contestId = contestId; }
        public String getContestTitle() { return contestTitle; } public void setContestTitle(String contestTitle) { this.contestTitle = contestTitle; }
        public Integer getRank() { return rank; } public void setRank(Integer rank) { this.rank = rank; }
        public Integer getScore() { return score; } public void setScore(Integer score) { this.score = score; }
        public Integer getTotalPossibleScore() { return totalPossibleScore; } public void setTotalPossibleScore(Integer totalPossibleScore) { this.totalPossibleScore = totalPossibleScore; }
        public Integer getSolvedCount() { return solvedCount; } public void setSolvedCount(Integer solvedCount) { this.solvedCount = solvedCount; }
        public Integer getTotalQuestions() { return totalQuestions; } public void setTotalQuestions(Integer totalQuestions) { this.totalQuestions = totalQuestions; }
        public Integer getAttemptedCount() { return attemptedCount; } public void setAttemptedCount(Integer attemptedCount) { this.attemptedCount = attemptedCount; }
        public Integer getWrongCount() { return wrongCount; } public void setWrongCount(Integer wrongCount) { this.wrongCount = wrongCount; }
        public Integer getUnansweredCount() { return unansweredCount; } public void setUnansweredCount(Integer unansweredCount) { this.unansweredCount = unansweredCount; }
        public Long getTimeTakenSeconds() { return timeTakenSeconds; } public void setTimeTakenSeconds(Long timeTakenSeconds) { this.timeTakenSeconds = timeTakenSeconds; }
        public String getFormattedTime() { return formattedTime; } public void setFormattedTime(String formattedTime) { this.formattedTime = formattedTime; }
        public boolean isDisqualified() { return disqualified; } public void setDisqualified(boolean disqualified) { this.disqualified = disqualified; }
        public String getTerminationReason() { return terminationReason; } public void setTerminationReason(String terminationReason) { this.terminationReason = terminationReason; }
        public LocalDateTime getTerminatedAt() { return terminatedAt; } public void setTerminatedAt(LocalDateTime terminatedAt) { this.terminatedAt = terminatedAt; }
        public int getFullscreenViolations() { return fullscreenViolations; } public void setFullscreenViolations(int fullscreenViolations) { this.fullscreenViolations = fullscreenViolations; }
        public List<ContestProblemResultDto> getProblemResults() { return problemResults; } public void setProblemResults(List<ContestProblemResultDto> problemResults) { this.problemResults = problemResults; }
        public List<ContestLeaderboardEntryDto> getFinalLeaderboard() { return finalLeaderboard; } public void setFinalLeaderboard(List<ContestLeaderboardEntryDto> finalLeaderboard) { this.finalLeaderboard = finalLeaderboard; }
    }

    public static class ContestProblemResultDto {
        private Long problemId;
        private Integer questionOrder;
        private String title;
        private String difficulty;
        private Integer maxPoints;
        private Integer earnedPoints;
        private String status; // ACCEPTED, WRONG_ANSWER, NOT_ATTEMPTED
        private String language;
        private String submittedCode;
        private Double runtime;
        private Integer passedTestCases;
        private Integer totalTestCases;

        public ContestProblemResultDto() {}

        public Long getProblemId() { return problemId; } public void setProblemId(Long problemId) { this.problemId = problemId; }
        public Integer getQuestionOrder() { return questionOrder; } public void setQuestionOrder(Integer questionOrder) { this.questionOrder = questionOrder; }
        public String getTitle() { return title; } public void setTitle(String title) { this.title = title; }
        public String getDifficulty() { return difficulty; } public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
        public Integer getMaxPoints() { return maxPoints; } public void setMaxPoints(Integer maxPoints) { this.maxPoints = maxPoints; }
        public Integer getEarnedPoints() { return earnedPoints; } public void setEarnedPoints(Integer earnedPoints) { this.earnedPoints = earnedPoints; }
        public String getStatus() { return status; } public void setStatus(String status) { this.status = status; }
        public String getLanguage() { return language; } public void setLanguage(String language) { this.language = language; }
        public String getSubmittedCode() { return submittedCode; } public void setSubmittedCode(String submittedCode) { this.submittedCode = submittedCode; }
        public Double getRuntime() { return runtime; } public void setRuntime(Double runtime) { this.runtime = runtime; }
        public Integer getPassedTestCases() { return passedTestCases; } public void setPassedTestCases(Integer passedTestCases) { this.passedTestCases = passedTestCases; }
        public Integer getTotalTestCases() { return totalTestCases; } public void setTotalTestCases(Integer totalTestCases) { this.totalTestCases = totalTestCases; }
    }

    public static class AdminContestParticipantDto {
        private Long userId;
        private String username;
        private String name;
        private String email;
        private LocalDateTime registeredAt;
        private LocalDateTime participatedAt;
        private String status;
        private int problemsSolved;
        private int score;

        public AdminContestParticipantDto() {}

        public Long getUserId() { return userId; } public void setUserId(Long userId) { this.userId = userId; }
        public String getUsername() { return username; } public void setUsername(String username) { this.username = username; }
        public String getName() { return name; } public void setName(String name) { this.name = name; }
        public String getEmail() { return email; } public void setEmail(String email) { this.email = email; }
        public LocalDateTime getRegisteredAt() { return registeredAt; } public void setRegisteredAt(LocalDateTime registeredAt) { this.registeredAt = registeredAt; }
        public LocalDateTime getParticipatedAt() { return participatedAt; } public void setParticipatedAt(LocalDateTime participatedAt) { this.participatedAt = participatedAt; }
        public String getStatus() { return status; } public void setStatus(String status) { this.status = status; }
        public int getProblemsSolved() { return problemsSolved; } public void setProblemsSolved(int problemsSolved) { this.problemsSolved = problemsSolved; }
        public int getScore() { return score; } public void setScore(int score) { this.score = score; }
    }

    public static class ContestLeaderboardEntryDto {
        private int rank;
        private Long userId;
        private String username;
        private String name;
        private int problemsSolved;
        private int score;
        private long totalTimeSeconds;
        private String formattedTime;

        public ContestLeaderboardEntryDto() {}
        public ContestLeaderboardEntryDto(int rank, Long userId, String username, String name, int problemsSolved, int score, long totalTimeSeconds, String formattedTime) {
            this.rank = rank;
            this.userId = userId;
            this.username = username;
            this.name = name;
            this.problemsSolved = problemsSolved;
            this.score = score;
            this.totalTimeSeconds = totalTimeSeconds;
            this.formattedTime = formattedTime;
        }

        public int getRank() { return rank; } public void setRank(int rank) { this.rank = rank; }
        public Long getUserId() { return userId; } public void setUserId(Long userId) { this.userId = userId; }
        public String getUsername() { return username; } public void setUsername(String username) { this.username = username; }
        public String getName() { return name; } public void setName(String name) { this.name = name; }
        public int getProblemsSolved() { return problemsSolved; } public void setProblemsSolved(int problemsSolved) { this.problemsSolved = problemsSolved; }
        public int getScore() { return score; } public void setScore(int score) { this.score = score; }
        public long getTotalTimeSeconds() { return totalTimeSeconds; } public void setTotalTimeSeconds(long totalTimeSeconds) { this.totalTimeSeconds = totalTimeSeconds; }
        public String getFormattedTime() { return formattedTime; } public void setFormattedTime(String formattedTime) { this.formattedTime = formattedTime; }
    }

    // =========================================================
    // ASSIGNMENT DTOs
    // =========================================================

    public static class AssignmentDto {
        private Long id;
        private String title;
        private String description;
        private Long creatorId;
        private String creatorName;
        private String creatorUsername;
        private LocalDateTime startTime;
        private LocalDateTime dueDate;
        private String status; // DRAFT, ACTIVE, COMPLETED, ARCHIVED
        private Boolean secureMode = false;
        private Integer durationMinutes = 60;
        private Integer allowedAttempts = 1;
        private int problemCount;
        private int assignedUserCount;
        private int solvedCount; // For current user
        private double progressPercent; // For current user (0.0 to 100.0)
        private boolean isCompleted; // If current user solved all problems
        private long violationCount;
        private long flaggedAttemptsCount;
        private long completedAttemptsCount;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public AssignmentDto() {}

        public Long getId() { return id; } public void setId(Long id) { this.id = id; }
        public Long getAssignmentId() { return id; } public void setAssignmentId(Long assignmentId) { this.id = assignmentId; }
        public String getTitle() { return title; } public void setTitle(String title) { this.title = title; }
        public String getDescription() { return description; } public void setDescription(String description) { this.description = description; }
        public Long getCreatorId() { return creatorId; } public void setCreatorId(Long creatorId) { this.creatorId = creatorId; }
        public String getCreatorName() { return creatorName; } public void setCreatorName(String creatorName) { this.creatorName = creatorName; }
        public String getCreatorUsername() { return creatorUsername; } public void setCreatorUsername(String creatorUsername) { this.creatorUsername = creatorUsername; }
        public LocalDateTime getStartTime() { return startTime; } public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }
        public LocalDateTime getDueDate() { return dueDate; } public void setDueDate(LocalDateTime dueDate) { this.dueDate = dueDate; }
        public String getStatus() { return status; } public void setStatus(String status) { this.status = status; }
        public Boolean getSecureMode() { return secureMode != null ? secureMode : false; } public void setSecureMode(Boolean secureMode) { this.secureMode = secureMode; }
        public Integer getDurationMinutes() { return durationMinutes != null ? durationMinutes : 60; } public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }
        public Integer getAllowedAttempts() { return allowedAttempts != null ? allowedAttempts : 1; } public void setAllowedAttempts(Integer allowedAttempts) { this.allowedAttempts = allowedAttempts; }
        public int getProblemCount() { return problemCount; } public void setProblemCount(int problemCount) { this.problemCount = problemCount; }
        public int getAssignedUserCount() { return assignedUserCount; } public void setAssignedUserCount(int assignedUserCount) { this.assignedUserCount = assignedUserCount; }
        public int getSolvedCount() { return solvedCount; } public void setSolvedCount(int solvedCount) { this.solvedCount = solvedCount; }
        public double getProgressPercent() { return progressPercent; } public void setProgressPercent(double progressPercent) { this.progressPercent = progressPercent; }
        public boolean isCompleted() { return isCompleted; } public void setCompleted(boolean isCompleted) { this.isCompleted = isCompleted; }
        public long getViolationCount() { return violationCount; } public void setViolationCount(long violationCount) { this.violationCount = violationCount; }
        public long getFlaggedAttemptsCount() { return flaggedAttemptsCount; } public void setFlaggedAttemptsCount(long flaggedAttemptsCount) { this.flaggedAttemptsCount = flaggedAttemptsCount; }
        public long getCompletedAttemptsCount() { return completedAttemptsCount; } public void setCompletedAttemptsCount(long completedAttemptsCount) { this.completedAttemptsCount = completedAttemptsCount; }
        public LocalDateTime getCreatedAt() { return createdAt; } public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
        public LocalDateTime getUpdatedAt() { return updatedAt; } public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    }

    public static class AssignmentProblemDto {
        private Long problemId;
        private String title;
        private String difficulty;
        private String concept;
        private Integer points;
        private Integer problemOrder;
        private boolean solved; // For current user
        private String description;
        private String constraints;
        private String starterCodeC;
        private String starterCodePython;
        private String starterCodeJava;
        private String starterCodeCpp;
        private String starterCodeJs;
        private String starterCodeGo;
        private String starterCodeRust;
        private Set<String> allowedLanguages = new HashSet<>();
        private String questionType = "CODING";
        private String imageUrl;
        private List<String> options = new ArrayList<>();
        private String correctOption;
        private String explanation;
        private List<TestCaseDto> testCasesList = new ArrayList<>();
        private List<HintDto> hints = new ArrayList<>();

        public AssignmentProblemDto() {}

        public Long getProblemId() { return problemId; } public void setProblemId(Long problemId) { this.problemId = problemId; }
        public String getTitle() { return title; } public void setTitle(String title) { this.title = title; }
        public String getDifficulty() { return difficulty; } public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
        public String getConcept() { return concept; } public void setConcept(String concept) { this.concept = concept; }
        public Integer getPoints() { return points; } public void setPoints(Integer points) { this.points = points; }
        public Integer getProblemOrder() { return problemOrder; } public void setProblemOrder(Integer problemOrder) { this.problemOrder = problemOrder; }
        public boolean isSolved() { return solved; } public void setSolved(boolean solved) { this.solved = solved; }
        public String getDescription() { return description; } public void setDescription(String description) { this.description = description; }
        public String getConstraints() { return constraints; } public void setConstraints(String constraints) { this.constraints = constraints; }
        public String getStarterCodeC() { return starterCodeC; } public void setStarterCodeC(String starterCodeC) { this.starterCodeC = starterCodeC; }
        public String getStarterCodePython() { return starterCodePython; } public void setStarterCodePython(String starterCodePython) { this.starterCodePython = starterCodePython; }
        public String getStarterCodeJava() { return starterCodeJava; } public void setStarterCodeJava(String starterCodeJava) { this.starterCodeJava = starterCodeJava; }
        public String getStarterCodeCpp() { return starterCodeCpp; } public void setStarterCodeCpp(String starterCodeCpp) { this.starterCodeCpp = starterCodeCpp; }
        public String getStarterCodeJs() { return starterCodeJs; } public void setStarterCodeJs(String starterCodeJs) { this.starterCodeJs = starterCodeJs; }
        public String getStarterCodeGo() { return starterCodeGo; } public void setStarterCodeGo(String starterCodeGo) { this.starterCodeGo = starterCodeGo; }
        public String getStarterCodeRust() { return starterCodeRust; } public void setStarterCodeRust(String starterCodeRust) { this.starterCodeRust = starterCodeRust; }
        public Set<String> getAllowedLanguages() { return allowedLanguages != null ? allowedLanguages : new HashSet<>(); } public void setAllowedLanguages(Set<String> allowedLanguages) { this.allowedLanguages = allowedLanguages; }
        public String getQuestionType() { return questionType != null ? questionType : "CODING"; } public void setQuestionType(String questionType) { this.questionType = questionType; }
        public String getImageUrl() { return imageUrl; } public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
        public List<String> getOptions() { return options != null ? options : new ArrayList<>(); } public void setOptions(List<String> options) { this.options = options; }
        public String getCorrectOption() { return correctOption; } public void setCorrectOption(String correctOption) { this.correctOption = correctOption; }
        public String getExplanation() { return explanation; } public void setExplanation(String explanation) { this.explanation = explanation; }
        public List<TestCaseDto> getTestCasesList() { return testCasesList; } public void setTestCasesList(List<TestCaseDto> testCasesList) { this.testCasesList = testCasesList; }
        public List<HintDto> getHints() { return hints; } public void setHints(List<HintDto> hints) { this.hints = hints; }
    }

    public static class AssignmentDetailDto extends AssignmentDto {
        private List<AssignmentProblemDto> problems = new ArrayList<>();
        private List<AssignmentParticipantProgressDto> participants = new ArrayList<>();
        @com.fasterxml.jackson.annotation.JsonProperty("isCreator")
        private boolean isCreator;
        private AssignmentAttemptDto currentAttempt;

        public List<AssignmentProblemDto> getProblems() { return problems; } public void setProblems(List<AssignmentProblemDto> problems) { this.problems = problems; }
        public List<AssignmentParticipantProgressDto> getParticipants() { return participants; } public void setParticipants(List<AssignmentParticipantProgressDto> participants) { this.participants = participants; }
        @com.fasterxml.jackson.annotation.JsonProperty("isCreator")
        public boolean isCreator() { return isCreator; }
        @com.fasterxml.jackson.annotation.JsonProperty("creator")
        public boolean getIsCreator() { return isCreator; }
        public void setCreator(boolean isCreator) { this.isCreator = isCreator; }
        public AssignmentAttemptDto getCurrentAttempt() { return currentAttempt; } public void setCurrentAttempt(AssignmentAttemptDto currentAttempt) { this.currentAttempt = currentAttempt; }
    }

    public static class AssignmentParticipantProgressDto {
        private Long userId;
        private String username;
        private String name;
        private String email;
        private String status; // PENDING, IN_PROGRESS, COMPLETED
        private int solvedCount;
        private int totalCount;
        private double progressPercent;
        private int score;
        private int integrityViolationCount;
        private boolean flaggedForReview;
        private Long attemptId;
        private String accessCode;
        private String gender;
        private String examStatus;
        private LocalDateTime assignedAt;
        private LocalDateTime completedAt;

        public AssignmentParticipantProgressDto() {}

        public Long getUserId() { return userId; } public void setUserId(Long userId) { this.userId = userId; }
        public String getUsername() { return username; } public void setUsername(String username) { this.username = username; }
        public String getName() { return name; } public void setName(String name) { this.name = name; }
        public String getEmail() { return email; } public void setEmail(String email) { this.email = email; }
        public String getStatus() { return status; } public void setStatus(String status) { this.status = status; }
        public int getSolvedCount() { return solvedCount; } public void setSolvedCount(int solvedCount) { this.solvedCount = solvedCount; }
        public int getTotalCount() { return totalCount; } public void setTotalCount(int totalCount) { this.totalCount = totalCount; }
        public double getProgressPercent() { return progressPercent; } public void setProgressPercent(double progressPercent) { this.progressPercent = progressPercent; }
        public int getScore() { return score; } public void setScore(int score) { this.score = score; }
        public int getIntegrityViolationCount() { return integrityViolationCount; } public void setIntegrityViolationCount(int integrityViolationCount) { this.integrityViolationCount = integrityViolationCount; }
        public boolean isFlaggedForReview() { return flaggedForReview; } public void setFlaggedForReview(boolean flaggedForReview) { this.flaggedForReview = flaggedForReview; }
        public Long getAttemptId() { return attemptId; } public void setAttemptId(Long attemptId) { this.attemptId = attemptId; }
        public String getAccessCode() { return accessCode; } public void setAccessCode(String accessCode) { this.accessCode = accessCode; }
        public String getGender() { return gender; } public void setGender(String gender) { this.gender = gender; }
        public String getExamStatus() { return examStatus; } public void setExamStatus(String examStatus) { this.examStatus = examStatus; }
        public LocalDateTime getAssignedAt() { return assignedAt; } public void setAssignedAt(LocalDateTime assignedAt) { this.assignedAt = assignedAt; }
        public LocalDateTime getCompletedAt() { return completedAt; } public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
    }


    public static class AssignmentRequestDto {
        @NotBlank(message = "Assignment title is required")
        private String title;
        private String description;
        private LocalDateTime startTime;
        private LocalDateTime dueDate;
        private String status = "ACTIVE";
        private Boolean secureMode = false;
        private Integer durationMinutes = 60;
        private Integer allowedAttempts = 1;
        @NotEmpty(message = "At least one problem must be selected")
        private List<Long> problemIds = new ArrayList<>();
        private List<Integer> problemPoints = new ArrayList<>();
        @NotEmpty(message = "At least one user must be assigned")
        private List<Long> userIds = new ArrayList<>();

        public AssignmentRequestDto() {}

        public String getTitle() { return title; } public void setTitle(String title) { this.title = title; }
        public String getDescription() { return description; } public void setDescription(String description) { this.description = description; }
        public LocalDateTime getStartTime() { return startTime; } public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }
        public LocalDateTime getDueDate() { return dueDate; } public void setDueDate(LocalDateTime dueDate) { this.dueDate = dueDate; }
        public String getStatus() { return status; } public void setStatus(String status) { this.status = status; }
        public Boolean getSecureMode() { return secureMode != null ? secureMode : false; } public void setSecureMode(Boolean secureMode) { this.secureMode = secureMode; }
        public Integer getDurationMinutes() { return durationMinutes != null ? durationMinutes : 60; } public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }
        public Integer getAllowedAttempts() { return allowedAttempts != null ? allowedAttempts : 1; } public void setAllowedAttempts(Integer allowedAttempts) { this.allowedAttempts = allowedAttempts; }
        public List<Long> getProblemIds() { return problemIds; } public void setProblemIds(List<Long> problemIds) { this.problemIds = problemIds; }
        public List<Integer> getProblemPoints() { return problemPoints; } public void setProblemPoints(List<Integer> problemPoints) { this.problemPoints = problemPoints; }
        public List<Long> getUserIds() { return userIds; } public void setUserIds(List<Long> userIds) { this.userIds = userIds; }
    }

    public static class AssignmentAttemptDto {
        private Long id;
        private Long assignmentId;
        private String assignmentTitle;
        private Long userId;
        private String username;
        private String userName;
        private LocalDateTime startedAt;
        private LocalDateTime expiresAt;
        private LocalDateTime submittedAt;
        private long remainingSeconds;
        private String status; // IN_PROGRESS, COMPLETED, TIME_EXPIRED, FLAGGED
        private Integer score;
        private Integer completedQuestions;
        private Integer totalQuestions;
        private Integer integrityViolationCount;
        private Boolean flaggedForReview;
        private Boolean secureMode;
        private List<AssignmentProblemDto> problems = new ArrayList<>();

        public AssignmentAttemptDto() {}

        public Long getId() { return id; } public void setId(Long id) { this.id = id; }
        public Long getAssignmentId() { return assignmentId; } public void setAssignmentId(Long assignmentId) { this.assignmentId = assignmentId; }
        public String getAssignmentTitle() { return assignmentTitle; } public void setAssignmentTitle(String assignmentTitle) { this.assignmentTitle = assignmentTitle; }
        public Long getUserId() { return userId; } public void setUserId(Long userId) { this.userId = userId; }
        public String getUsername() { return username; } public void setUsername(String username) { this.username = username; }
        public String getUserName() { return userName; } public void setUserName(String userName) { this.userName = userName; }
        public LocalDateTime getStartedAt() { return startedAt; } public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }
        public LocalDateTime getExpiresAt() { return expiresAt; } public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }
        public LocalDateTime getSubmittedAt() { return submittedAt; } public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }
        public long getRemainingSeconds() { return remainingSeconds; } public void setRemainingSeconds(long remainingSeconds) { this.remainingSeconds = remainingSeconds; }
        public String getStatus() { return status; } public void setStatus(String status) { this.status = status; }
        public Integer getScore() { return score; } public void setScore(Integer score) { this.score = score; }
        public Integer getCompletedQuestions() { return completedQuestions; } public void setCompletedQuestions(Integer completedQuestions) { this.completedQuestions = completedQuestions; }
        public Integer getTotalQuestions() { return totalQuestions; } public void setTotalQuestions(Integer totalQuestions) { this.totalQuestions = totalQuestions; }
        public Integer getIntegrityViolationCount() { return integrityViolationCount; } public void setIntegrityViolationCount(Integer integrityViolationCount) { this.integrityViolationCount = integrityViolationCount; }
        public Boolean getFlaggedForReview() { return flaggedForReview; } public void setFlaggedForReview(Boolean flaggedForReview) { this.flaggedForReview = flaggedForReview; }
        public boolean isFlaggedForReview() { return Boolean.TRUE.equals(flaggedForReview); }
        public Boolean getSecureMode() { return secureMode; } public void setSecureMode(Boolean secureMode) { this.secureMode = secureMode; }
        public List<AssignmentProblemDto> getProblems() { return problems; } public void setProblems(List<AssignmentProblemDto> problems) { this.problems = problems; }
    }

    public static class IntegrityEventDto {
        private Long id;
        private Long attemptId;
        private Long userId;
        private String username;
        private Long assignmentId;
        private String eventType; // FULLSCREEN_EXIT, TAB_SWITCH, WINDOW_BLUR, PASTE_ATTEMPT, COPY_ATTEMPT, CUT_ATTEMPT, CONTEXT_MENU_ATTEMPT
        private LocalDateTime timestamp;
        private String metadata;
        private String severity; // INFO, WARNING, CRITICAL

        public IntegrityEventDto() {}

        public IntegrityEventDto(String eventType, String severity, String metadata) {
            this.eventType = eventType;
            this.severity = severity;
            this.metadata = metadata;
        }

        public Long getId() { return id; } public void setId(Long id) { this.id = id; }
        public Long getAttemptId() { return attemptId; } public void setAttemptId(Long attemptId) { this.attemptId = attemptId; }
        public Long getUserId() { return userId; } public void setUserId(Long userId) { this.userId = userId; }
        public String getUsername() { return username; } public void setUsername(String username) { this.username = username; }
        public Long getAssignmentId() { return assignmentId; } public void setAssignmentId(Long assignmentId) { this.assignmentId = assignmentId; }
        public String getEventType() { return eventType; } public void setEventType(String eventType) { this.eventType = eventType; }
        public LocalDateTime getTimestamp() { return timestamp; } public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
        public String getMetadata() { return metadata; } public void setMetadata(String metadata) { this.metadata = metadata; }
        public String getSeverity() { return severity; } public void setSeverity(String severity) { this.severity = severity; }
    }

    public static class IntegrityReportDto {
        private Long attemptId;
        private Long assignmentId;
        private String assignmentTitle;
        private Long userId;
        private String username;
        private String name;
        private LocalDateTime startedAt;
        private LocalDateTime submittedAt;
        private String attemptStatus;
        private int score;
        private int fullscreenExits;
        private int tabSwitches;
        private int windowBlurs;
        private int pasteAttempts;
        private int copyAttempts;
        private int otherViolations;
        private int totalViolations;
        private boolean flaggedForReview;
        private List<IntegrityEventDto> timeline = new ArrayList<>();

        public IntegrityReportDto() {}

        public Long getAttemptId() { return attemptId; } public void setAttemptId(Long attemptId) { this.attemptId = attemptId; }
        public Long getAssignmentId() { return assignmentId; } public void setAssignmentId(Long assignmentId) { this.assignmentId = assignmentId; }
        public String getAssignmentTitle() { return assignmentTitle; } public void setAssignmentTitle(String assignmentTitle) { this.assignmentTitle = assignmentTitle; }
        public Long getUserId() { return userId; } public void setUserId(Long userId) { this.userId = userId; }
        public String getUsername() { return username; } public void setUsername(String username) { this.username = username; }
        public String getName() { return name; } public void setName(String name) { this.name = name; }
        public LocalDateTime getStartedAt() { return startedAt; } public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }
        public LocalDateTime getSubmittedAt() { return submittedAt; } public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }
        public String getAttemptStatus() { return attemptStatus; } public void setAttemptStatus(String attemptStatus) { this.attemptStatus = attemptStatus; }
        public int getScore() { return score; } public void setScore(int score) { this.score = score; }
        public int getFullscreenExits() { return fullscreenExits; } public void setFullscreenExits(int fullscreenExits) { this.fullscreenExits = fullscreenExits; }
        public int getTabSwitches() { return tabSwitches; } public void setTabSwitches(int tabSwitches) { this.tabSwitches = tabSwitches; }
        public int getWindowBlurs() { return windowBlurs; } public void setWindowBlurs(int windowBlurs) { this.windowBlurs = windowBlurs; }
        public int getPasteAttempts() { return pasteAttempts; } public void setPasteAttempts(int pasteAttempts) { this.pasteAttempts = pasteAttempts; }
        public int getCopyAttempts() { return copyAttempts; } public void setCopyAttempts(int copyAttempts) { this.copyAttempts = copyAttempts; }
        public int getOtherViolations() { return otherViolations; } public void setOtherViolations(int otherViolations) { this.otherViolations = otherViolations; }
        public int getTotalViolations() { return totalViolations; } public void setTotalViolations(int totalViolations) { this.totalViolations = totalViolations; }
        public boolean isFlaggedForReview() { return flaggedForReview; } public void setFlaggedForReview(boolean flaggedForReview) { this.flaggedForReview = flaggedForReview; }
        public List<IntegrityEventDto> getTimeline() { return timeline; } public void setTimeline(List<IntegrityEventDto> timeline) { this.timeline = timeline; }
    }


    public static class HeatmapItemDto {
        private String date; // YYYY-MM-DD
        private int count;
        private int intensity; // 0 to 4

        public HeatmapItemDto() {}
        public HeatmapItemDto(String date, int count, int intensity) {
            this.date = date;
            this.count = count;
            this.intensity = intensity;
        }

        public String getDate() { return date; } public void setDate(String date) { this.date = date; }
        public int getCount() { return count; } public void setCount(int count) { this.count = count; }
        public int getIntensity() { return intensity; } public void setIntensity(int intensity) { this.intensity = intensity; }
    }

    public static class WhatsNewDto {
        private List<ContestDto> newContests = new ArrayList<>();
        private List<CertificateDto> newCertificates = new ArrayList<>();
        private List<BadgeDto> newBadges = new ArrayList<>();

        public WhatsNewDto() {}

        public List<ContestDto> getNewContests() { return newContests; } public void setNewContests(List<ContestDto> newContests) { this.newContests = newContests; }
        public List<CertificateDto> getNewCertificates() { return newCertificates; } public void setNewCertificates(List<CertificateDto> newCertificates) { this.newCertificates = newCertificates; }
        public List<BadgeDto> getNewBadges() { return newBadges; } public void setNewBadges(List<BadgeDto> newBadges) { this.newBadges = newBadges; }
    }

    public static class ChatContextDto {
        private String page;
        private Long problemId;
        private String language;
        private String currentCode;
        private String lastError;

        public ChatContextDto() {}
        public String getPage() { return page; } public void setPage(String page) { this.page = page; }
        public Long getProblemId() { return problemId; } public void setProblemId(Long problemId) { this.problemId = problemId; }
        public String getLanguage() { return language; } public void setLanguage(String language) { this.language = language; }
        public String getCurrentCode() { return currentCode; } public void setCurrentCode(String currentCode) { this.currentCode = currentCode; }
        public String getLastError() { return lastError; } public void setLastError(String lastError) { this.lastError = lastError; }
    }

    public static class ChatRequestDto {
        @NotBlank(message = "Message cannot be blank")
        private String message;
        private ChatContextDto context;

        public ChatRequestDto() {}
        public ChatRequestDto(String message) { this.message = message; }
        public String getMessage() { return message; } public void setMessage(String message) { this.message = message; }
        public ChatContextDto getContext() { return context; } public void setContext(ChatContextDto context) { this.context = context; }
    }

    public static class ChatResponseDto {
        private String reply;
        private String mode; // "PUBLIC", "PERSONALIZED", "DISABLED"
        private boolean disabled;
        private List<String> suggestions = new ArrayList<>();

        public ChatResponseDto() {}
        public ChatResponseDto(String reply, String mode, boolean disabled, List<String> suggestions) {
            this.reply = reply;
            this.mode = mode;
            this.disabled = disabled;
            this.suggestions = suggestions != null ? suggestions : new ArrayList<>();
        }

        public String getReply() { return reply; } public void setReply(String reply) { this.reply = reply; }
        public String getMode() { return mode; } public void setMode(String mode) { this.mode = mode; }
        public boolean isDisabled() { return disabled; } public void setDisabled(boolean disabled) { this.disabled = disabled; }
        public List<String> getSuggestions() { return suggestions; } public void setSuggestions(List<String> suggestions) { this.suggestions = suggestions; }
    }

    public static class AssignmentCreatorVerificationDto {
        private Long id;
        private Long userId;
        private String username;
        private String fullName;
        private String contactEmail;
        private String phoneNumber;
        private String organizationName;
        private String organizationId;
        private String organizationWebsite;
        private String maskedPan;
        private String maskedAadhaar;
        private String pan;
        private String aadhaar;
        private String governmentId1FileReference;
        private String governmentId2FileReference;
        private String memberProofFileReference;
        private boolean hasGovernmentId1;
        private boolean hasGovernmentId2;
        private boolean hasMemberProof;
        private String status = "NOT_VERIFIED"; // NOT_VERIFIED, PENDING, OTP_PENDING, REJECTED, HOST_VERIFIED
        private boolean isApproved;
        private boolean isHostVerified;
        private boolean otpPending;
        private LocalDateTime otpLastSentAt;
        private LocalDateTime submittedAt;
        private LocalDateTime reviewedAt;
        private String reviewedBy;
        private String adminComment;

        public AssignmentCreatorVerificationDto() {}

        public Long getId() { return id; } public void setId(Long id) { this.id = id; }
        public Long getUserId() { return userId; } public void setUserId(Long userId) { this.userId = userId; }
        public String getUsername() { return username; } public void setUsername(String username) { this.username = username; }
        public String getFullName() { return fullName; } public void setFullName(String fullName) { this.fullName = fullName; }
        public String getContactEmail() { return contactEmail; } public void setContactEmail(String contactEmail) { this.contactEmail = contactEmail; }
        public String getPhoneNumber() { return phoneNumber; } public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
        public String getOrganizationName() { return organizationName; } public void setOrganizationName(String organizationName) { this.organizationName = organizationName; }
        public String getOrganizationId() { return organizationId; } public void setOrganizationId(String organizationId) { this.organizationId = organizationId; }
        public String getOrganizationWebsite() { return organizationWebsite; } public void setOrganizationWebsite(String organizationWebsite) { this.organizationWebsite = organizationWebsite; }
        public String getMaskedPan() { return maskedPan; } public void setMaskedPan(String maskedPan) { this.maskedPan = maskedPan; }
        public String getMaskedAadhaar() { return maskedAadhaar; } public void setMaskedAadhaar(String maskedAadhaar) { this.maskedAadhaar = maskedAadhaar; }
        public String getPan() { return pan; } public void setPan(String pan) { this.pan = pan; }
        public String getAadhaar() { return aadhaar; } public void setAadhaar(String aadhaar) { this.aadhaar = aadhaar; }
        public String getGovernmentId1FileReference() { return governmentId1FileReference; } public void setGovernmentId1FileReference(String governmentId1FileReference) { this.governmentId1FileReference = governmentId1FileReference; this.hasGovernmentId1 = (governmentId1FileReference != null && !governmentId1FileReference.isBlank()); }
        public String getGovernmentId2FileReference() { return governmentId2FileReference; } public void setGovernmentId2FileReference(String governmentId2FileReference) { this.governmentId2FileReference = governmentId2FileReference; this.hasGovernmentId2 = (governmentId2FileReference != null && !governmentId2FileReference.isBlank()); }
        public String getMemberProofFileReference() { return memberProofFileReference; } public void setMemberProofFileReference(String memberProofFileReference) { this.memberProofFileReference = memberProofFileReference; this.hasMemberProof = (memberProofFileReference != null && !memberProofFileReference.isBlank()); }
        public boolean isHasGovernmentId1() { return hasGovernmentId1 || (governmentId1FileReference != null && !governmentId1FileReference.isBlank()); } public void setHasGovernmentId1(boolean hasGovernmentId1) { this.hasGovernmentId1 = hasGovernmentId1; }
        public boolean isHasGovernmentId2() { return hasGovernmentId2 || (governmentId2FileReference != null && !governmentId2FileReference.isBlank()); } public void setHasGovernmentId2(boolean hasGovernmentId2) { this.hasGovernmentId2 = hasGovernmentId2; }
        public boolean isHasMemberProof() { return hasMemberProof || (memberProofFileReference != null && !memberProofFileReference.isBlank()); } public void setHasMemberProof(boolean hasMemberProof) { this.hasMemberProof = hasMemberProof; }
        public String getStatus() { return status; } public void setStatus(String status) { this.status = status; }
        public boolean isApproved() { return isApproved; } public void setApproved(boolean approved) { isApproved = approved; this.isHostVerified = approved; }
        public boolean isHostVerified() { return isHostVerified || isApproved; } public void setHostVerified(boolean hostVerified) { isHostVerified = hostVerified; this.isApproved = hostVerified; }
        public boolean isOtpPending() { return otpPending || "OTP_PENDING".equalsIgnoreCase(status) || "ADMIN_APPROVED".equalsIgnoreCase(status); } public void setOtpPending(boolean otpPending) { this.otpPending = otpPending; }
        public LocalDateTime getOtpLastSentAt() { return otpLastSentAt; } public void setOtpLastSentAt(LocalDateTime otpLastSentAt) { this.otpLastSentAt = otpLastSentAt; }
        public LocalDateTime getSubmittedAt() { return submittedAt; } public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }
        public LocalDateTime getReviewedAt() { return reviewedAt; } public void setReviewedAt(LocalDateTime reviewedAt) { this.reviewedAt = reviewedAt; }
        public String getReviewedBy() { return reviewedBy; } public void setReviewedBy(String reviewedBy) { this.reviewedBy = reviewedBy; }
        public String getAdminComment() { return adminComment; } public void setAdminComment(String adminComment) { this.adminComment = adminComment; }
    }

    public static class HostVerificationOtpRequestDto {
        @NotBlank(message = "OTP code is required")
        @Pattern(regexp = "^[0-9]{6}$", message = "OTP must be exactly 6 digits")
        private String otpCode;

        public HostVerificationOtpRequestDto() {}
        public HostVerificationOtpRequestDto(String otpCode) { this.otpCode = otpCode; }

        public String getOtpCode() { return otpCode; }
        public void setOtpCode(String otpCode) { this.otpCode = otpCode; }
    }

    public static class ContestSecurityCheckDto {
        private Boolean cameraGranted = false;
        private Boolean micGranted = false;
        private Boolean fullscreenReady = false;

        public ContestSecurityCheckDto() {}
        public ContestSecurityCheckDto(Boolean cameraGranted, Boolean micGranted, Boolean fullscreenReady) {
            this.cameraGranted = cameraGranted != null ? cameraGranted : false;
            this.micGranted = micGranted != null ? micGranted : false;
            this.fullscreenReady = fullscreenReady != null ? fullscreenReady : false;
        }

        public Boolean getCameraGranted() { return cameraGranted; }
        public void setCameraGranted(Boolean cameraGranted) { this.cameraGranted = cameraGranted; }
        public Boolean getMicGranted() { return micGranted; }
        public void setMicGranted(Boolean micGranted) { this.micGranted = micGranted; }
        public Boolean getFullscreenReady() { return fullscreenReady; }
        public void setFullscreenReady(Boolean fullscreenReady) { this.fullscreenReady = fullscreenReady; }
    }

    public static class ContestSecurityEventDto {
        @NotBlank(message = "Event type is required")
        private String eventType;
        private String details;

        public ContestSecurityEventDto() {}
        public ContestSecurityEventDto(String eventType, String details) {
            this.eventType = eventType;
            this.details = details;
        }

        public String getEventType() { return eventType; }
        public void setEventType(String eventType) { this.eventType = eventType; }
        public String getDetails() { return details; }
        public void setDetails(String details) { this.details = details; }
    }

    public static class ContestSecurityStatusDto {
        private boolean terminated;
        private int violations;
        private int maxAllowed;
        private String warning;
        private String reason;
        private Boolean cameraGranted;
        private Boolean micGranted;

        public ContestSecurityStatusDto() {}
        public ContestSecurityStatusDto(boolean terminated, int violations, int maxAllowed, String warning, String reason) {
            this.terminated = terminated;
            this.violations = violations;
            this.maxAllowed = maxAllowed;
            this.warning = warning;
            this.reason = reason;
        }

        public boolean isTerminated() { return terminated; }
        public void setTerminated(boolean terminated) { this.terminated = terminated; }
        public int getViolations() { return violations; }
        public void setViolations(int violations) { this.violations = violations; }
        public int getMaxAllowed() { return maxAllowed; }
        public void setMaxAllowed(int maxAllowed) { this.maxAllowed = maxAllowed; }
        public String getWarning() { return warning; }
        public void setWarning(String warning) { this.warning = warning; }
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
        public Boolean getCameraGranted() { return cameraGranted; }
        public void setCameraGranted(Boolean cameraGranted) { this.cameraGranted = cameraGranted; }
        public Boolean getMicGranted() { return micGranted; }
        public void setMicGranted(Boolean micGranted) { this.micGranted = micGranted; }
    }

    public static class ExamCodeVerificationRequestDto {
        private String code;
        private String accessCode;

        public ExamCodeVerificationRequestDto() {}
        public ExamCodeVerificationRequestDto(String code) { this.code = code; }

        public String getCode() {
            if (code != null && !code.isBlank()) return code;
            return accessCode;
        }
        public void setCode(String code) { this.code = code; }

        public String getAccessCode() { return getCode(); }
        public void setAccessCode(String accessCode) { this.accessCode = accessCode; }
    }

    public static class ExamCodeVerificationResponseDto {
        private boolean valid;
        private String message;
        private Long assignmentId;
        private String assignmentTitle;
        private String organizationName;
        private String username;
        private String email;

        public ExamCodeVerificationResponseDto() {}
        public ExamCodeVerificationResponseDto(boolean valid, String message, Long assignmentId, String assignmentTitle, String organizationName, String username, String email) {
            this.valid = valid;
            this.message = message;
            this.assignmentId = assignmentId;
            this.assignmentTitle = assignmentTitle;
            this.organizationName = organizationName;
            this.username = username;
            this.email = email;
        }

        public boolean isValid() { return valid; } public void setValid(boolean valid) { this.valid = valid; }
        public String getMessage() { return message; } public void setMessage(String message) { this.message = message; }
        public Long getAssignmentId() { return assignmentId; } public void setAssignmentId(Long assignmentId) { this.assignmentId = assignmentId; }
        public String getAssignmentTitle() { return assignmentTitle; } public void setAssignmentTitle(String assignmentTitle) { this.assignmentTitle = assignmentTitle; }
        public String getOrganizationName() { return organizationName; } public void setOrganizationName(String organizationName) { this.organizationName = organizationName; }
        public String getUsername() { return username; } public void setUsername(String username) { this.username = username; }
        public String getEmail() { return email; } public void setEmail(String email) { this.email = email; }
    }

    public static class ParticipantIdentityVerificationRequestDto {
        @NotBlank(message = "Username is required")
        private String username;
        @NotBlank(message = "Email is required")
        private String email;
        private String gender; // Female, Male, Prefer not to say

        public ParticipantIdentityVerificationRequestDto() {}
        public ParticipantIdentityVerificationRequestDto(String username, String email, String gender) {
            this.username = username;
            this.email = email;
            this.gender = gender;
        }

        public String getUsername() { return username; } public void setUsername(String username) { this.username = username; }
        public String getEmail() { return email; } public void setEmail(String email) { this.email = email; }
        public String getGender() { return gender; } public void setGender(String gender) { this.gender = gender; }
    }

    public static class ParticipantIdentityVerificationResponseDto {
        private boolean verified;
        private String message;
        private Long attemptId;

        public ParticipantIdentityVerificationResponseDto() {}
        public ParticipantIdentityVerificationResponseDto(boolean verified, String message, Long attemptId) {
            this.verified = verified;
            this.message = message;
            this.attemptId = attemptId;
        }

        public boolean isVerified() { return verified; } public void setVerified(boolean verified) { this.verified = verified; }
        public String getMessage() { return message; } public void setMessage(String message) { this.message = message; }
        public Long getAttemptId() { return attemptId; } public void setAttemptId(Long attemptId) { this.attemptId = attemptId; }
    }

    public static class ExamRecordingDto {
        private Long id;
        private Long attemptId;
        private Long participantId;
        private String participantUsername;
        private String participantName;
        private Long assignmentId;
        private String type; // VIDEO, AUDIO, SCREEN
        private String storageReference;
        private Long fileSizeBytes;
        private String contentType;
        private LocalDateTime startedAt;
        private LocalDateTime endedAt;
        private String status;
        private LocalDateTime createdAt;

        public ExamRecordingDto() {}

        public Long getId() { return id; } public void setId(Long id) { this.id = id; }
        public Long getAttemptId() { return attemptId; } public void setAttemptId(Long attemptId) { this.attemptId = attemptId; }
        public Long getParticipantId() { return participantId; } public void setParticipantId(Long participantId) { this.participantId = participantId; }
        public String getParticipantUsername() { return participantUsername; } public void setParticipantUsername(String participantUsername) { this.participantUsername = participantUsername; }
        public String getParticipantName() { return participantName; } public void setParticipantName(String participantName) { this.participantName = participantName; }
        public Long getAssignmentId() { return assignmentId; } public void setAssignmentId(Long assignmentId) { this.assignmentId = assignmentId; }
        public String getType() { return type; } public void setType(String type) { this.type = type; }
        public String getStorageReference() { return storageReference; } public void setStorageReference(String storageReference) { this.storageReference = storageReference; }
        public Long getFileSizeBytes() { return fileSizeBytes; } public void setFileSizeBytes(Long fileSizeBytes) { this.fileSizeBytes = fileSizeBytes; }
        public String getContentType() { return contentType; } public void setContentType(String contentType) { this.contentType = contentType; }
        public LocalDateTime getStartedAt() { return startedAt; } public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }
        public LocalDateTime getEndedAt() { return endedAt; } public void setEndedAt(LocalDateTime endedAt) { this.endedAt = endedAt; }
        public String getStatus() { return status; } public void setStatus(String status) { this.status = status; }
        public LocalDateTime getCreatedAt() { return createdAt; } public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    }

    // ==========================================
    // ASSIGNMENT REPORTING & ANALYTICS DTOs
    // ==========================================

    public static class AssignmentReportDto {
        private Long assignmentId;
        private String title;
        private String description;
        private Long creatorId;
        private String creatorName;
        private String creatorUsername;
        private LocalDateTime createdAt;
        private LocalDateTime startTime;
        private LocalDateTime dueDate;
        private String status;
        private Boolean secureMode;
        private Integer durationMinutes;
        private Integer totalQuestions;
        private Integer totalPoints;

        // Aggregate stats
        private int totalInvited;
        private int openedCount;
        private int attemptedCount;
        private int submittedCount;
        private int notAttemptedCount;
        private double completionPercentage;
        private double averageScore;
        private double averageAccuracy;

        private List<QuestionPerformanceDto> questionPerformance = new ArrayList<>();
        private List<ParticipantReportDto> participants = new ArrayList<>();

        public AssignmentReportDto() {}

        public Long getAssignmentId() { return assignmentId; } public void setAssignmentId(Long assignmentId) { this.assignmentId = assignmentId; }
        public String getTitle() { return title; } public void setTitle(String title) { this.title = title; }
        public String getDescription() { return description; } public void setDescription(String description) { this.description = description; }
        public Long getCreatorId() { return creatorId; } public void setCreatorId(Long creatorId) { this.creatorId = creatorId; }
        public String getCreatorName() { return creatorName; } public void setCreatorName(String creatorName) { this.creatorName = creatorName; }
        public String getCreatorUsername() { return creatorUsername; } public void setCreatorUsername(String creatorUsername) { this.creatorUsername = creatorUsername; }
        public LocalDateTime getCreatedAt() { return createdAt; } public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
        public LocalDateTime getStartTime() { return startTime; } public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }
        public LocalDateTime getDueDate() { return dueDate; } public void setDueDate(LocalDateTime dueDate) { this.dueDate = dueDate; }
        public String getStatus() { return status; } public void setStatus(String status) { this.status = status; }
        public Boolean getSecureMode() { return secureMode; } public void setSecureMode(Boolean secureMode) { this.secureMode = secureMode; }
        public Integer getDurationMinutes() { return durationMinutes; } public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }
        public Integer getTotalQuestions() { return totalQuestions; } public void setTotalQuestions(Integer totalQuestions) { this.totalQuestions = totalQuestions; }
        public Integer getTotalPoints() { return totalPoints; } public void setTotalPoints(Integer totalPoints) { this.totalPoints = totalPoints; }

        public int getTotalInvited() { return totalInvited; } public void setTotalInvited(int totalInvited) { this.totalInvited = totalInvited; }
        public int getOpenedCount() { return openedCount; } public void setOpenedCount(int openedCount) { this.openedCount = openedCount; }
        public int getAttemptedCount() { return attemptedCount; } public void setAttemptedCount(int attemptedCount) { this.attemptedCount = attemptedCount; }
        public int getSubmittedCount() { return submittedCount; } public void setSubmittedCount(int submittedCount) { this.submittedCount = submittedCount; }
        public int getNotAttemptedCount() { return notAttemptedCount; } public void setNotAttemptedCount(int notAttemptedCount) { this.notAttemptedCount = notAttemptedCount; }
        public double getCompletionPercentage() { return completionPercentage; } public void setCompletionPercentage(double completionPercentage) { this.completionPercentage = completionPercentage; }
        public double getAverageScore() { return averageScore; } public void setAverageScore(double averageScore) { this.averageScore = averageScore; }
        public double getAverageAccuracy() { return averageAccuracy; } public void setAverageAccuracy(double averageAccuracy) { this.averageAccuracy = averageAccuracy; }

        public List<QuestionPerformanceDto> getQuestionPerformance() { return questionPerformance; } public void setQuestionPerformance(List<QuestionPerformanceDto> questionPerformance) { this.questionPerformance = questionPerformance; }
        public List<ParticipantReportDto> getParticipants() { return participants; } public void setParticipants(List<ParticipantReportDto> participants) { this.participants = participants; }
    }

    public static class QuestionPerformanceDto {
        private Long problemId;
        private Integer questionOrder;
        private String title;
        private String difficulty;
        private Integer points;
        private int attemptedCount;
        private int correctCount;
        private int wrongCount;
        private int notAttemptedCount;
        private double accuracyPercentage;

        public QuestionPerformanceDto() {}

        public Long getProblemId() { return problemId; } public void setProblemId(Long problemId) { this.problemId = problemId; }
        public Integer getQuestionOrder() { return questionOrder; } public void setQuestionOrder(Integer questionOrder) { this.questionOrder = questionOrder; }
        public String getTitle() { return title; } public void setTitle(String title) { this.title = title; }
        public String getDifficulty() { return difficulty; } public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
        public Integer getPoints() { return points; } public void setPoints(Integer points) { this.points = points; }
        public int getAttemptedCount() { return attemptedCount; } public void setAttemptedCount(int attemptedCount) { this.attemptedCount = attemptedCount; }
        public int getCorrectCount() { return correctCount; } public void setCorrectCount(int correctCount) { this.correctCount = correctCount; }
        public int getWrongCount() { return wrongCount; } public void setWrongCount(int wrongCount) { this.wrongCount = wrongCount; }
        public int getNotAttemptedCount() { return notAttemptedCount; } public void setNotAttemptedCount(int notAttemptedCount) { this.notAttemptedCount = notAttemptedCount; }
        public double getAccuracyPercentage() { return accuracyPercentage; } public void setAccuracyPercentage(double accuracyPercentage) { this.accuracyPercentage = accuracyPercentage; }
    }

    public static class CandidateQuestionResultDto {
        private Long problemId;
        private Integer questionOrder;
        private String title;
        private String description;
        private String constraints;
        private String difficulty;
        private Integer points;
        private Integer earnedPoints;
        private String status; // CORRECT, WRONG, NOT_ATTEMPTED
        private String questionType = "CODING";
        private List<String> options = new ArrayList<>();
        private String userResponse;
        private String correctOption;
        private String language;
        private String submittedCode;
        private Double runtime;
        private Double executionTime;
        private String memoryUsage;
        private String compilerOutput;
        private String explanation;
        private String correctCode;
        private String imageUrl;
        private Integer passedTestCases;
        private Integer totalTestCases;
        private LocalDateTime solvedAt;

        public CandidateQuestionResultDto() {}

        public Long getProblemId() { return problemId; } public void setProblemId(Long problemId) { this.problemId = problemId; }
        public Integer getQuestionOrder() { return questionOrder; } public void setQuestionOrder(Integer questionOrder) { this.questionOrder = questionOrder; }
        public String getTitle() { return title; } public void setTitle(String title) { this.title = title; }
        public String getDescription() { return description; } public void setDescription(String description) { this.description = description; }
        public String getConstraints() { return constraints; } public void setConstraints(String constraints) { this.constraints = constraints; }
        public String getDifficulty() { return difficulty; } public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
        public Integer getPoints() { return points; } public void setPoints(Integer points) { this.points = points; }
        public Integer getEarnedPoints() { return earnedPoints; } public void setEarnedPoints(Integer earnedPoints) { this.earnedPoints = earnedPoints; }
        public String getStatus() { return status; } public void setStatus(String status) { this.status = status; }
        public String getQuestionType() { return questionType != null ? questionType : "CODING"; } public void setQuestionType(String questionType) { this.questionType = questionType; }
        public List<String> getOptions() { return options != null ? options : new ArrayList<>(); } public void setOptions(List<String> options) { this.options = options; }
        public String getUserResponse() { return userResponse; } public void setUserResponse(String userResponse) { this.userResponse = userResponse; }
        public String getCorrectOption() { return correctOption; } public void setCorrectOption(String correctOption) { this.correctOption = correctOption; }
        public String getLanguage() { return language; } public void setLanguage(String language) { this.language = language; }
        public String getSubmittedCode() { return submittedCode; } public void setSubmittedCode(String submittedCode) { this.submittedCode = submittedCode; }
        public Double getRuntime() { return runtime; } public void setRuntime(Double runtime) { this.runtime = runtime; }
        public Double getExecutionTime() { return executionTime != null ? executionTime : runtime; } public void setExecutionTime(Double executionTime) { this.executionTime = executionTime; }
        public String getMemoryUsage() { return memoryUsage; } public void setMemoryUsage(String memoryUsage) { this.memoryUsage = memoryUsage; }
        public String getCompilerOutput() { return compilerOutput; } public void setCompilerOutput(String compilerOutput) { this.compilerOutput = compilerOutput; }
        public String getExplanation() { return explanation; } public void setExplanation(String explanation) { this.explanation = explanation; }
        public String getCorrectCode() { return correctCode; } public void setCorrectCode(String correctCode) { this.correctCode = correctCode; }
        public String getImageUrl() { return imageUrl; } public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
        public Integer getPassedTestCases() { return passedTestCases; } public void setPassedTestCases(Integer passedTestCases) { this.passedTestCases = passedTestCases; }
        public Integer getTotalTestCases() { return totalTestCases; } public void setTotalTestCases(Integer totalTestCases) { this.totalTestCases = totalTestCases; }
        public LocalDateTime getSolvedAt() { return solvedAt; } public void setSolvedAt(LocalDateTime solvedAt) { this.solvedAt = solvedAt; }
    }

    public static class CreateCustomQuestionDto {
        private String questionType = "CODING"; // "CODING" or "MCQ"
        @NotBlank(message = "Question title is required")
        private String title;
        private String concept = "General";
        private String difficulty = "Medium";
        @NotBlank(message = "Question description is required")
        private String description;
        private String constraints;
        private Integer points = 100;
        private String imageUrl;
        
        // MCQ specific
        private List<String> options = new ArrayList<>();
        private String correctOption;
        private String explanation;

        // Programming specific
        private String starterCodeC;
        private String starterCodePython;
        private String starterCodeJava;
        private String starterCodeCpp;
        private String starterCodeJs;
        private String starterCodeGo;
        private String starterCodeRust;
        private String solutionC;
        private String solutionPython;
        private String solutionJava;
        private String solutionCpp;
        private String solutionJs;
        private String solutionGo;
        private String solutionRust;
        private String solution;
        private String editorial;
        private Set<String> allowedLanguages = new HashSet<>();
        private List<TestCaseDto> testCasesList = new ArrayList<>();
        private List<HintDto> hints = new ArrayList<>();

        public CreateCustomQuestionDto() {}

        public String getQuestionType() { return questionType != null ? questionType : "CODING"; } public void setQuestionType(String questionType) { this.questionType = questionType; }
        public String getTitle() { return title; } public void setTitle(String title) { this.title = title; }
        public String getConcept() { return concept; } public void setConcept(String concept) { this.concept = concept; }
        public String getDifficulty() { return difficulty; } public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
        public String getDescription() { return description; } public void setDescription(String description) { this.description = description; }
        public String getConstraints() { return constraints; } public void setConstraints(String constraints) { this.constraints = constraints; }
        public Integer getPoints() { return points != null ? points : 100; } public void setPoints(Integer points) { this.points = points; }
        public String getImageUrl() { return imageUrl; } public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
        public List<String> getOptions() { return options != null ? options : new ArrayList<>(); } public void setOptions(List<String> options) { this.options = options; }
        public String getCorrectOption() { return correctOption; } public void setCorrectOption(String correctOption) { this.correctOption = correctOption; }
        public String getExplanation() { return explanation; } public void setExplanation(String explanation) { this.explanation = explanation; }
        public String getStarterCodeC() { return starterCodeC; } public void setStarterCodeC(String starterCodeC) { this.starterCodeC = starterCodeC; }
        public String getStarterCodePython() { return starterCodePython; } public void setStarterCodePython(String starterCodePython) { this.starterCodePython = starterCodePython; }
        public String getStarterCodeJava() { return starterCodeJava; } public void setStarterCodeJava(String starterCodeJava) { this.starterCodeJava = starterCodeJava; }
        public String getStarterCodeCpp() { return starterCodeCpp; } public void setStarterCodeCpp(String starterCodeCpp) { this.starterCodeCpp = starterCodeCpp; }
        public String getStarterCodeJs() { return starterCodeJs; } public void setStarterCodeJs(String starterCodeJs) { this.starterCodeJs = starterCodeJs; }
        public String getStarterCodeGo() { return starterCodeGo; } public void setStarterCodeGo(String starterCodeGo) { this.starterCodeGo = starterCodeGo; }
        public String getStarterCodeRust() { return starterCodeRust; } public void setStarterCodeRust(String starterCodeRust) { this.starterCodeRust = starterCodeRust; }
        public String getSolutionC() { return solutionC; } public void setSolutionC(String solutionC) { this.solutionC = solutionC; }
        public String getSolutionPython() { return solutionPython; } public void setSolutionPython(String solutionPython) { this.solutionPython = solutionPython; }
        public String getSolutionJava() { return solutionJava; } public void setSolutionJava(String solutionJava) { this.solutionJava = solutionJava; }
        public String getSolutionCpp() { return solutionCpp; } public void setSolutionCpp(String solutionCpp) { this.solutionCpp = solutionCpp; }
        public String getSolutionJs() { return solutionJs; } public void setSolutionJs(String solutionJs) { this.solutionJs = solutionJs; }
        public String getSolutionGo() { return solutionGo; } public void setSolutionGo(String solutionGo) { this.solutionGo = solutionGo; }
        public String getSolutionRust() { return solutionRust; } public void setSolutionRust(String solutionRust) { this.solutionRust = solutionRust; }
        public String getSolution() { return solution; } public void setSolution(String solution) { this.solution = solution; }
        public String getEditorial() { return editorial; } public void setEditorial(String editorial) { this.editorial = editorial; }
        public Set<String> getAllowedLanguages() { return allowedLanguages != null ? allowedLanguages : new HashSet<>(); } public void setAllowedLanguages(Set<String> allowedLanguages) { this.allowedLanguages = allowedLanguages; }
        public List<TestCaseDto> getTestCasesList() { return testCasesList; } public void setTestCasesList(List<TestCaseDto> testCasesList) { this.testCasesList = testCasesList; }
        public List<HintDto> getHints() { return hints; } public void setHints(List<HintDto> hints) { this.hints = hints; }
    }

    public static class AssignmentParticipantReviewDto {
        private Long assignmentId;
        private String assignmentTitle;
        private String assignmentDescription;
        private Long attemptId;
        private Long userId;
        private String username;
        private String name;
        private String email;
        private Integer score;
        private Double percentage;
        private Integer totalPoints;
        private Integer questionsAttempted;
        private Integer correctCount;
        private Integer wrongCount;
        private Integer unansweredCount;
        private Long timeTakenSeconds;
        private String formattedTime;
        private LocalDateTime startedAt;
        private LocalDateTime submittedAt;
        private String status;
        private String cameraStatus;
        private Boolean cameraPermissionGranted;
        private Integer integrityViolationCount = 0;
        private Boolean flaggedForReview = false;
        private List<CandidateQuestionResultDto> questions = new ArrayList<>();
        private List<ExamRecordingDto> recordings = new ArrayList<>();
        private IntegrityReportDto integrityReport;

        public AssignmentParticipantReviewDto() {}

        public Long getAssignmentId() { return assignmentId; } public void setAssignmentId(Long assignmentId) { this.assignmentId = assignmentId; }
        public String getAssignmentTitle() { return assignmentTitle; } public void setAssignmentTitle(String assignmentTitle) { this.assignmentTitle = assignmentTitle; }
        public String getAssignmentDescription() { return assignmentDescription; } public void setAssignmentDescription(String assignmentDescription) { this.assignmentDescription = assignmentDescription; }
        public Long getAttemptId() { return attemptId; } public void setAttemptId(Long attemptId) { this.attemptId = attemptId; }
        public Long getUserId() { return userId; } public void setUserId(Long userId) { this.userId = userId; }
        public String getUsername() { return username; } public void setUsername(String username) { this.username = username; }
        public String getName() { return name; } public void setName(String name) { this.name = name; }
        public String getEmail() { return email; } public void setEmail(String email) { this.email = email; }
        public Integer getScore() { return score; } public void setScore(Integer score) { this.score = score; }
        public Double getPercentage() { return percentage; } public void setPercentage(Double percentage) { this.percentage = percentage; }
        public Integer getTotalPoints() { return totalPoints; } public void setTotalPoints(Integer totalPoints) { this.totalPoints = totalPoints; }
        public Integer getQuestionsAttempted() { return questionsAttempted; } public void setQuestionsAttempted(Integer questionsAttempted) { this.questionsAttempted = questionsAttempted; }
        public Integer getCorrectCount() { return correctCount; } public void setCorrectCount(Integer correctCount) { this.correctCount = correctCount; }
        public Integer getWrongCount() { return wrongCount; } public void setWrongCount(Integer wrongCount) { this.wrongCount = wrongCount; }
        public Integer getUnansweredCount() { return unansweredCount; } public void setUnansweredCount(Integer unansweredCount) { this.unansweredCount = unansweredCount; }
        public Long getTimeTakenSeconds() { return timeTakenSeconds; } public void setTimeTakenSeconds(Long timeTakenSeconds) { this.timeTakenSeconds = timeTakenSeconds; }
        public String getFormattedTime() { return formattedTime; } public void setFormattedTime(String formattedTime) { this.formattedTime = formattedTime; }
        public LocalDateTime getStartedAt() { return startedAt; } public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }
        public LocalDateTime getSubmittedAt() { return submittedAt; } public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }
        public String getStatus() { return status; } public void setStatus(String status) { this.status = status; }
        public String getCameraStatus() { return cameraStatus; } public void setCameraStatus(String cameraStatus) { this.cameraStatus = cameraStatus; }
        public Boolean getCameraPermissionGranted() { return cameraPermissionGranted; } public void setCameraPermissionGranted(Boolean cameraPermissionGranted) { this.cameraPermissionGranted = cameraPermissionGranted; }
        public Integer getIntegrityViolationCount() { return integrityViolationCount; } public void setIntegrityViolationCount(Integer integrityViolationCount) { this.integrityViolationCount = integrityViolationCount; }
        public Boolean getFlaggedForReview() { return flaggedForReview; } public void setFlaggedForReview(Boolean flaggedForReview) { this.flaggedForReview = flaggedForReview; }
        public List<CandidateQuestionResultDto> getQuestions() { return questions; } public void setQuestions(List<CandidateQuestionResultDto> questions) { this.questions = questions; }
        public List<CandidateQuestionResultDto> getQuestionResults() { return questions; } public void setQuestionResults(List<CandidateQuestionResultDto> questionResults) { this.questions = questionResults; }
        public Integer getTotalPossibleScore() { return totalPoints; } public void setTotalPossibleScore(Integer totalPossibleScore) { this.totalPoints = totalPossibleScore; }
        public List<ExamRecordingDto> getRecordings() { return recordings; } public void setRecordings(List<ExamRecordingDto> recordings) { this.recordings = recordings; }
        public IntegrityReportDto getIntegrityReport() { return integrityReport; } public void setIntegrityReport(IntegrityReportDto integrityReport) { this.integrityReport = integrityReport; }
    }

    public static class TimeSeriesPointDto {
        private String date;
        private Long count;

        public TimeSeriesPointDto() {}
        public TimeSeriesPointDto(String date, Long count) {
            this.date = date;
            this.count = count;
        }

        public String getDate() { return date; } public void setDate(String date) { this.date = date; }
        public Long getCount() { return count; } public void setCount(Long count) { this.count = count; }
    }

    public static class AdminAnalyticsDto {
        // Summary KPIs
        private long totalUsers;
        private long totalProblems;
        private long totalAssignments;
        private long totalContests;
        private long totalSubmissions;
        private long openComplaintsCount;

        // Registration Analytics
        private List<TimeSeriesPointDto> registrationTimeline = new ArrayList<>();

        // Assignment Analytics
        private long assignmentRegistered;
        private long assignmentAttended;
        private long assignmentCompleted;
        private long assignmentAbsent;
        private double assignmentAverageScore;
        private double assignmentCompletionRate;
        private double assignmentAverageTimeMinutes;

        // Contest Analytics
        private long contestRegistrations;
        private long contestParticipants;
        private long contestSubmissions;
        private long contestAcceptedSubmissions;
        private double contestAverageScore;
        private double contestAverageCompletionTimeMinutes;

        // Submission Verdict Analytics
        private long verdictAccepted;
        private long verdictWrongAnswer;
        private long verdictCompilationError;
        private long verdictRuntimeError;
        private long verdictTimeLimitExceeded;

        // Performance / Score Distribution
        private long scoreBucket0To20;
        private long scoreBucket21To40;
        private long scoreBucket41To60;
        private long scoreBucket61To80;
        private long scoreBucket81To100;
        private double overallAverageScore;
        private double overallHighestScore;
        private double overallCompletionRate;
        private double overallAttemptRate;

        // Support / Complaint Analytics
        private long complaintTotal;
        private long complaintOpen;
        private long complaintWaitingForAdmin;
        private long complaintWaitingForUser;
        private long complaintResolved;
        private double complaintAverageResolutionHours;
        private List<TimeSeriesPointDto> complaintTrend = new ArrayList<>();

        // User Activity
        private long activeUsersCount;
        private long problemSubmissionsCount;
        private long assignmentParticipationCount;
        private long contestParticipationCount;

        public AdminAnalyticsDto() {}

        public long getTotalUsers() { return totalUsers; } public void setTotalUsers(long totalUsers) { this.totalUsers = totalUsers; }
        public long getTotalProblems() { return totalProblems; } public void setTotalProblems(long totalProblems) { this.totalProblems = totalProblems; }
        public long getTotalAssignments() { return totalAssignments; } public void setTotalAssignments(long totalAssignments) { this.totalAssignments = totalAssignments; }
        public long getTotalContests() { return totalContests; } public void setTotalContests(long totalContests) { this.totalContests = totalContests; }
        public long getTotalSubmissions() { return totalSubmissions; } public void setTotalSubmissions(long totalSubmissions) { this.totalSubmissions = totalSubmissions; }
        public long getOpenComplaintsCount() { return openComplaintsCount; } public void setOpenComplaintsCount(long openComplaintsCount) { this.openComplaintsCount = openComplaintsCount; }

        public List<TimeSeriesPointDto> getRegistrationTimeline() { return registrationTimeline; } public void setRegistrationTimeline(List<TimeSeriesPointDto> registrationTimeline) { this.registrationTimeline = registrationTimeline; }

        public long getAssignmentRegistered() { return assignmentRegistered; } public void setAssignmentRegistered(long assignmentRegistered) { this.assignmentRegistered = assignmentRegistered; }
        public long getAssignmentAttended() { return assignmentAttended; } public void setAssignmentAttended(long assignmentAttended) { this.assignmentAttended = assignmentAttended; }
        public long getAssignmentCompleted() { return assignmentCompleted; } public void setAssignmentCompleted(long assignmentCompleted) { this.assignmentCompleted = assignmentCompleted; }
        public long getAssignmentAbsent() { return assignmentAbsent; } public void setAssignmentAbsent(long assignmentAbsent) { this.assignmentAbsent = assignmentAbsent; }
        public double getAssignmentAverageScore() { return assignmentAverageScore; } public void setAssignmentAverageScore(double assignmentAverageScore) { this.assignmentAverageScore = assignmentAverageScore; }
        public double getAssignmentCompletionRate() { return assignmentCompletionRate; } public void setAssignmentCompletionRate(double assignmentCompletionRate) { this.assignmentCompletionRate = assignmentCompletionRate; }
        public double getAssignmentAverageTimeMinutes() { return assignmentAverageTimeMinutes; } public void setAssignmentAverageTimeMinutes(double assignmentAverageTimeMinutes) { this.assignmentAverageTimeMinutes = assignmentAverageTimeMinutes; }

        public long getContestRegistrations() { return contestRegistrations; } public void setContestRegistrations(long contestRegistrations) { this.contestRegistrations = contestRegistrations; }
        public long getContestParticipants() { return contestParticipants; } public void setContestParticipants(long contestParticipants) { this.contestParticipants = contestParticipants; }
        public long getContestSubmissions() { return contestSubmissions; } public void setContestSubmissions(long contestSubmissions) { this.contestSubmissions = contestSubmissions; }
        public long getContestAcceptedSubmissions() { return contestAcceptedSubmissions; } public void setContestAcceptedSubmissions(long contestAcceptedSubmissions) { this.contestAcceptedSubmissions = contestAcceptedSubmissions; }
        public double getContestAverageScore() { return contestAverageScore; } public void setContestAverageScore(double contestAverageScore) { this.contestAverageScore = contestAverageScore; }
        public double getContestAverageCompletionTimeMinutes() { return contestAverageCompletionTimeMinutes; } public void setContestAverageCompletionTimeMinutes(double contestAverageCompletionTimeMinutes) { this.contestAverageCompletionTimeMinutes = contestAverageCompletionTimeMinutes; }

        public long getVerdictAccepted() { return verdictAccepted; } public void setVerdictAccepted(long verdictAccepted) { this.verdictAccepted = verdictAccepted; }
        public long getVerdictWrongAnswer() { return verdictWrongAnswer; } public void setVerdictWrongAnswer(long verdictWrongAnswer) { this.verdictWrongAnswer = verdictWrongAnswer; }
        public long getVerdictCompilationError() { return verdictCompilationError; } public void setVerdictCompilationError(long verdictCompilationError) { this.verdictCompilationError = verdictCompilationError; }
        public long getVerdictRuntimeError() { return verdictRuntimeError; } public void setVerdictRuntimeError(long verdictRuntimeError) { this.verdictRuntimeError = verdictRuntimeError; }
        public long getVerdictTimeLimitExceeded() { return verdictTimeLimitExceeded; } public void setVerdictTimeLimitExceeded(long verdictTimeLimitExceeded) { this.verdictTimeLimitExceeded = verdictTimeLimitExceeded; }

        public long getScoreBucket0To20() { return scoreBucket0To20; } public void setScoreBucket0To20(long scoreBucket0To20) { this.scoreBucket0To20 = scoreBucket0To20; }
        public long getScoreBucket21To40() { return scoreBucket21To40; } public void setScoreBucket21To40(long scoreBucket21To40) { this.scoreBucket21To40 = scoreBucket21To40; }
        public long getScoreBucket41To60() { return scoreBucket41To60; } public void setScoreBucket41To60(long scoreBucket41To60) { this.scoreBucket41To60 = scoreBucket41To60; }
        public long getScoreBucket61To80() { return scoreBucket61To80; } public void setScoreBucket61To80(long scoreBucket61To80) { this.scoreBucket61To80 = scoreBucket61To80; }
        public long getScoreBucket81To100() { return scoreBucket81To100; } public void setScoreBucket81To100(long scoreBucket81To100) { this.scoreBucket81To100 = scoreBucket81To100; }
        public double getOverallAverageScore() { return overallAverageScore; } public void setOverallAverageScore(double overallAverageScore) { this.overallAverageScore = overallAverageScore; }
        public double getOverallHighestScore() { return overallHighestScore; } public void setOverallHighestScore(double overallHighestScore) { this.overallHighestScore = overallHighestScore; }
        public double getOverallCompletionRate() { return overallCompletionRate; } public void setOverallCompletionRate(double overallCompletionRate) { this.overallCompletionRate = overallCompletionRate; }
        public double getOverallAttemptRate() { return overallAttemptRate; } public void setOverallAttemptRate(double overallAttemptRate) { this.overallAttemptRate = overallAttemptRate; }

        public long getComplaintTotal() { return complaintTotal; } public void setComplaintTotal(long complaintTotal) { this.complaintTotal = complaintTotal; }
        public long getComplaintOpen() { return complaintOpen; } public void setComplaintOpen(long complaintOpen) { this.complaintOpen = complaintOpen; }
        public long getComplaintWaitingForAdmin() { return complaintWaitingForAdmin; } public void setComplaintWaitingForAdmin(long complaintWaitingForAdmin) { this.complaintWaitingForAdmin = complaintWaitingForAdmin; }
        public long getComplaintWaitingForUser() { return complaintWaitingForUser; } public void setComplaintWaitingForUser(long complaintWaitingForUser) { this.complaintWaitingForUser = complaintWaitingForUser; }
        public long getComplaintResolved() { return complaintResolved; } public void setComplaintResolved(long complaintResolved) { this.complaintResolved = complaintResolved; }
        public double getComplaintAverageResolutionHours() { return complaintAverageResolutionHours; } public void setComplaintAverageResolutionHours(double complaintAverageResolutionHours) { this.complaintAverageResolutionHours = complaintAverageResolutionHours; }
        public List<TimeSeriesPointDto> getComplaintTrend() { return complaintTrend; } public void setComplaintTrend(List<TimeSeriesPointDto> complaintTrend) { this.complaintTrend = complaintTrend; }

        public long getActiveUsersCount() { return activeUsersCount; } public void setActiveUsersCount(long activeUsersCount) { this.activeUsersCount = activeUsersCount; }
        public long getProblemSubmissionsCount() { return problemSubmissionsCount; } public void setProblemSubmissionsCount(long problemSubmissionsCount) { this.problemSubmissionsCount = problemSubmissionsCount; }
        public long getAssignmentParticipationCount() { return assignmentParticipationCount; } public void setAssignmentParticipationCount(long assignmentParticipationCount) { this.assignmentParticipationCount = assignmentParticipationCount; }
        public long getContestParticipationCount() { return contestParticipationCount; } public void setContestParticipationCount(long contestParticipationCount) { this.contestParticipationCount = contestParticipationCount; }
    }

    public static class ParticipantReportDto {
        private Long userId;
        private String name;
        private String username;
        private String email;
        private String status; // INVITED, IN_PROGRESS, SUBMITTED, NOT_ATTEMPTED
        private LocalDateTime startedAt;
        private LocalDateTime submittedAt;
        private int questionsAttempted;
        private int questionsNotAttempted;
        private int totalQuestions;
        private int score;
        private int totalPossibleScore;
        private double percentage;
        private String completionStatus; // COMPLETED, IN_PROGRESS, PENDING, EXPIRED

        // Camera & Integrity Info
        private String cameraStatus;
        private Boolean cameraPermissionGranted;
        private LocalDateTime cameraInitializedAt;
        private int integrityViolationCount;
        private boolean flaggedForReview;

        private List<CandidateQuestionResultDto> questionResults = new ArrayList<>();

        public ParticipantReportDto() {}

        public Long getUserId() { return userId; } public void setUserId(Long userId) { this.userId = userId; }
        public String getName() { return name; } public void setName(String name) { this.name = name; }
        public String getUsername() { return username; } public void setUsername(String username) { this.username = username; }
        public String getEmail() { return email; } public void setEmail(String email) { this.email = email; }
        public String getStatus() { return status; } public void setStatus(String status) { this.status = status; }
        public LocalDateTime getStartedAt() { return startedAt; } public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }
        public LocalDateTime getSubmittedAt() { return submittedAt; } public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }
        public int getQuestionsAttempted() { return questionsAttempted; } public void setQuestionsAttempted(int questionsAttempted) { this.questionsAttempted = questionsAttempted; }
        public int getQuestionsNotAttempted() { return questionsNotAttempted; } public void setQuestionsNotAttempted(int questionsNotAttempted) { this.questionsNotAttempted = questionsNotAttempted; }
        public int getTotalQuestions() { return totalQuestions; } public void setTotalQuestions(int totalQuestions) { this.totalQuestions = totalQuestions; }
        public int getScore() { return score; } public void setScore(int score) { this.score = score; }
        public int getTotalPossibleScore() { return totalPossibleScore; } public void setTotalPossibleScore(int totalPossibleScore) { this.totalPossibleScore = totalPossibleScore; }
        public double getPercentage() { return percentage; } public void setPercentage(double percentage) { this.percentage = percentage; }
        public String getCompletionStatus() { return completionStatus; } public void setCompletionStatus(String completionStatus) { this.completionStatus = completionStatus; }

        public String getCameraStatus() { return cameraStatus; } public void setCameraStatus(String cameraStatus) { this.cameraStatus = cameraStatus; }
        public Boolean getCameraPermissionGranted() { return cameraPermissionGranted; } public void setCameraPermissionGranted(Boolean cameraPermissionGranted) { this.cameraPermissionGranted = cameraPermissionGranted; }
        public LocalDateTime getCameraInitializedAt() { return cameraInitializedAt; } public void setCameraInitializedAt(LocalDateTime cameraInitializedAt) { this.cameraInitializedAt = cameraInitializedAt; }
        public int getIntegrityViolationCount() { return integrityViolationCount; } public void setIntegrityViolationCount(int integrityViolationCount) { this.integrityViolationCount = integrityViolationCount; }
        public boolean isFlaggedForReview() { return flaggedForReview; } public void setFlaggedForReview(boolean flaggedForReview) { this.flaggedForReview = flaggedForReview; }

        public List<CandidateQuestionResultDto> getQuestionResults() { return questionResults; } public void setQuestionResults(List<CandidateQuestionResultDto> questionResults) { this.questionResults = questionResults; }
        public List<CandidateQuestionResultDto> getQuestions() { return questionResults; } public void setQuestions(List<CandidateQuestionResultDto> questions) { this.questionResults = questions; }
        public Integer getTotalPoints() { return totalPossibleScore; } public void setTotalPoints(Integer totalPoints) { this.totalPossibleScore = totalPoints != null ? totalPoints : 0; }
    }

    public static class InviteAllResponseDto {
        private int totalUsers;
        private int alreadyInvited;
        private int newInvitations;
        private String message;

        public InviteAllResponseDto() {}
        public InviteAllResponseDto(int totalUsers, int alreadyInvited, int newInvitations, String message) {
            this.totalUsers = totalUsers;
            this.alreadyInvited = alreadyInvited;
            this.newInvitations = newInvitations;
            this.message = message;
        }

        public int getTotalUsers() { return totalUsers; } public void setTotalUsers(int totalUsers) { this.totalUsers = totalUsers; }
        public int getAlreadyInvited() { return alreadyInvited; } public void setAlreadyInvited(int alreadyInvited) { this.alreadyInvited = alreadyInvited; }
        public int getNewInvitations() { return newInvitations; } public void setNewInvitations(int newInvitations) { this.newInvitations = newInvitations; }
        public String getMessage() { return message; } public void setMessage(String message) { this.message = message; }
    }

    // ==========================================
    // SUPPORT & TICKET DTOs
    // ==========================================

    public static class SupportTicketRequestDto {
        @NotBlank(message = "Subject is required")
        private String subject;
        @NotBlank(message = "Category is required")
        private String category; // QUERY, TECHNICAL_ISSUE, FEEDBACK, ASSIGNMENT_ISSUE, ACCOUNT_ISSUE, OTHER
        private String priority = "MEDIUM"; // HIGH, MEDIUM, LOW
        @NotBlank(message = "Description is required")
        private String description;
        private Integer rating; // 1-5

        public SupportTicketRequestDto() {}

        public String getSubject() { return subject; } public void setSubject(String subject) { this.subject = subject; }
        public String getCategory() { return category; } public void setCategory(String category) { this.category = category; }
        public String getPriority() { return priority; } public void setPriority(String priority) { this.priority = priority; }
        public String getDescription() { return description; } public void setDescription(String description) { this.description = description; }
        public Integer getRating() { return rating; } public void setRating(Integer rating) { this.rating = rating; }
    }

    public static class SupportTicketMessageDto {
        private Long id;
        private Long ticketId;
        private Long senderId;
        private String senderName;
        private String senderUsername;
        private String senderRole; // USER, ADMIN
        private String message;
        private LocalDateTime createdAt;

        public SupportTicketMessageDto() {}

        public Long getId() { return id; } public void setId(Long id) { this.id = id; }
        public Long getTicketId() { return ticketId; } public void setTicketId(Long ticketId) { this.ticketId = ticketId; }
        public Long getSenderId() { return senderId; } public void setSenderId(Long senderId) { this.senderId = senderId; }
        public String getSenderName() { return senderName; } public void setSenderName(String senderName) { this.senderName = senderName; }
        public String getSenderUsername() { return senderUsername; } public void setSenderUsername(String senderUsername) { this.senderUsername = senderUsername; }
        public String getSenderRole() { return senderRole; } public void setSenderRole(String senderRole) { this.senderRole = senderRole; }
        public String getMessage() { return message; } public void setMessage(String message) { this.message = message; }
        public LocalDateTime getCreatedAt() { return createdAt; } public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    }

    public static class SupportTicketDto {
        private Long id;
        private String ticketNumber;
        private Long userId;
        private String userName;
        private String userUsername;
        private String userEmail;
        private String subject;
        private String category;
        private String priority;
        private String description;
        private Integer rating;
        private String status;
        private Long assignedAdminId;
        private String assignedAdminName;
        private LocalDateTime createdAt;
        private LocalDateTime viewedAt;
        private LocalDateTime startedAt;
        private LocalDateTime resolvedAt;
        private LocalDateTime updatedAt;
        private List<SupportTicketMessageDto> messages = new ArrayList<>();

        public SupportTicketDto() {}

        public Long getId() { return id; } public void setId(Long id) { this.id = id; }
        public String getTicketNumber() { return ticketNumber; } public void setTicketNumber(String ticketNumber) { this.ticketNumber = ticketNumber; }
        public Long getUserId() { return userId; } public void setUserId(Long userId) { this.userId = userId; }
        public String getUserName() { return userName; } public void setUserName(String userName) { this.userName = userName; }
        public String getUserUsername() { return userUsername; } public void setUserUsername(String userUsername) { this.userUsername = userUsername; }
        public String getUserEmail() { return userEmail; } public void setUserEmail(String userEmail) { this.userEmail = userEmail; }
        public String getSubject() { return subject; } public void setSubject(String subject) { this.subject = subject; }
        public String getCategory() { return category; } public void setCategory(String category) { this.category = category; }
        public String getPriority() { return priority; } public void setPriority(String priority) { this.priority = priority; }
        public String getDescription() { return description; } public void setDescription(String description) { this.description = description; }
        public Integer getRating() { return rating; } public void setRating(Integer rating) { this.rating = rating; }
        public String getStatus() { return status; } public void setStatus(String status) { this.status = status; }
        public Long getAssignedAdminId() { return assignedAdminId; } public void setAssignedAdminId(Long assignedAdminId) { this.assignedAdminId = assignedAdminId; }
        public String getAssignedAdminName() { return assignedAdminName; } public void setAssignedAdminName(String assignedAdminName) { this.assignedAdminName = assignedAdminName; }
        public LocalDateTime getCreatedAt() { return createdAt; } public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
        public LocalDateTime getViewedAt() { return viewedAt; } public void setViewedAt(LocalDateTime viewedAt) { this.viewedAt = viewedAt; }
        public LocalDateTime getStartedAt() { return startedAt; } public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }
        public LocalDateTime getResolvedAt() { return resolvedAt; } public void setResolvedAt(LocalDateTime resolvedAt) { this.resolvedAt = resolvedAt; }
        public LocalDateTime getUpdatedAt() { return updatedAt; } public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
        public List<SupportTicketMessageDto> getMessages() { return messages; } public void setMessages(List<SupportTicketMessageDto> messages) { this.messages = messages; }
    }

    public static class SupportTicketActionDto {
        private String action; // VIEW, START_WORKING, REPLY, RESOLVE, CLOSE
        private String message;

        public SupportTicketActionDto() {}

        public String getAction() { return action; } public void setAction(String action) { this.action = action; }
        public String getMessage() { return message; } public void setMessage(String message) { this.message = message; }
    }

    // ==========================================
    // NOTIFICATION DTOs
    // ==========================================

    public static class UserNotificationDto {
        private Long id;
        private String title;
        private String message;
        private String type;
        private String link;
        private Boolean isRead;
        private LocalDateTime createdAt;

        public UserNotificationDto() {}

        public Long getId() { return id; } public void setId(Long id) { this.id = id; }
        public String getTitle() { return title; } public void setTitle(String title) { this.title = title; }
        public String getMessage() { return message; } public void setMessage(String message) { this.message = message; }
        public String getType() { return type; } public void setType(String type) { this.type = type; }
        public String getLink() { return link; } public void setLink(String link) { this.link = link; }
        public Boolean getIsRead() { return isRead; } public void setIsRead(Boolean isRead) { this.isRead = isRead; }
        public LocalDateTime getCreatedAt() { return createdAt; } public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    }
}


