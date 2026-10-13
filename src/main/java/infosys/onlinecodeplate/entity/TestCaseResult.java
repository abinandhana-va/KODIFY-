package infosys.onlinecodeplate.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "test_case_results")
public class TestCaseResult {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submission_id", nullable = false)
    @JsonIgnore
    private UserSubmission submission;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_case_id", nullable = false)
    private TestCase testCase;

    private boolean passed;

    @Column(columnDefinition = "LONGTEXT")
    private String actualOutput;

    private Double runtime; // Execution time in ms

    private String status; // PASSED, FAILED, TIMEOUT, RUNTIME_ERROR

    public TestCaseResult() {}

    public TestCaseResult(UserSubmission submission, TestCase testCase, boolean passed, String actualOutput, Double runtime, String status) {
        this.submission = submission;
        this.testCase = testCase;
        this.passed = passed;
        this.actualOutput = actualOutput;
        this.runtime = runtime;
        this.status = status;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public UserSubmission getSubmission() { return submission; }
    public void setSubmission(UserSubmission submission) { this.submission = submission; }

    public TestCase getTestCase() { return testCase; }
    public void setTestCase(TestCase testCase) { this.testCase = testCase; }

    public boolean isPassed() { return passed; }
    public void setPassed(boolean passed) { this.passed = passed; }

    public String getActualOutput() { return actualOutput; }
    public void setActualOutput(String actualOutput) { this.actualOutput = actualOutput; }

    public Double getRuntime() { return runtime; }
    public void setRuntime(Double runtime) { this.runtime = runtime; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
