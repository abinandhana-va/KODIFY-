package infosys.onlinecodeplate.repository;

import infosys.onlinecodeplate.entity.ContestSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContestSubmissionRepository extends JpaRepository<ContestSubmission, Long> {
    List<ContestSubmission> findByContestIdOrderByCreatedAtDesc(Long contestId);
    List<ContestSubmission> findByContestIdAndUserIdOrderByCreatedAtDesc(Long contestId, Long userId);
    List<ContestSubmission> findByUserIdOrderByCreatedAtDesc(Long userId);

    @Query("SELECT COUNT(DISTINCT cs.contest.id) FROM ContestSubmission cs WHERE cs.user.id = :userId")
    long countContestsWithSubmissionsByUserId(@Param("userId") Long userId);

    @Query("SELECT DISTINCT cs.problem.id FROM ContestSubmission cs WHERE cs.contest.id = :contestId AND cs.user.id = :userId AND cs.status = :status")
    List<Long> findSolvedProblemIdsInContest(@Param("contestId") Long contestId, @Param("userId") Long userId, @Param("status") String status);

    @Query("SELECT COUNT(cs) FROM ContestSubmission cs WHERE cs.contest.id = :contestId")
    long countByContestId(@Param("contestId") Long contestId);

    void deleteByContestId(Long contestId);
}

