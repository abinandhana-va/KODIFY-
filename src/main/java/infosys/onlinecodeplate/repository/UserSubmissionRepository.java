package infosys.onlinecodeplate.repository;

import infosys.onlinecodeplate.entity.UserSubmission;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface UserSubmissionRepository extends JpaRepository<UserSubmission, Long> {
    List<UserSubmission> findByUserId(Long userId);
    List<UserSubmission> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<UserSubmission> findByUserIdAndStatus(Long userId, String status);

    boolean existsByUserIdAndProblemId(Long userId, Long problemId);
    List<UserSubmission> findByUserIdAndProblemIdOrderByCreatedAtDesc(Long userId, Long problemId);

    List<UserSubmission> findAllByOrderByCreatedAtDesc();
    Page<UserSubmission> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT DISTINCT s.problem.id FROM UserSubmission s WHERE s.user.id = :userId AND s.status = :status")
    List<Long> findSolvedProblemIdsByUserId(@Param("userId") Long userId, @Param("status") String status);

    @Query("SELECT COUNT(DISTINCT s.problem.id) FROM UserSubmission s WHERE s.user.id = :userId AND s.status = :status")
    long countSolvedProblemsByUserId(@Param("userId") Long userId, @Param("status") String status);

    @Query("SELECT COUNT(DISTINCT s.problem.id) FROM UserSubmission s WHERE s.user.id = :userId AND s.status = :status AND UPPER(s.problem.difficulty) = :difficulty")
    long countSolvedProblemsByUserIdAndDifficulty(@Param("userId") Long userId, @Param("status") String status, @Param("difficulty") String difficulty);
}
