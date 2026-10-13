package infosys.onlinecodeplate.repository;

import infosys.onlinecodeplate.entity.TestCaseResult;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TestCaseResultRepository extends JpaRepository<TestCaseResult, Long> {
    List<TestCaseResult> findBySubmissionId(Long submissionId);
}
