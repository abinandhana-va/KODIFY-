package infosys.onlinecodeplate.repository;

import infosys.onlinecodeplate.entity.ContestProblem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContestProblemRepository extends JpaRepository<ContestProblem, Long> {
    List<ContestProblem> findByContestIdOrderByQuestionOrderAsc(Long contestId);
    Optional<ContestProblem> findByContestIdAndProblemId(Long contestId, Long problemId);
    boolean existsByContestIdAndProblemId(Long contestId, Long problemId);
    void deleteByContestId(Long contestId);
}
