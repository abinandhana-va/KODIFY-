package infosys.onlinecodeplate.repository;

import infosys.onlinecodeplate.entity.AssignmentAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssignmentAttemptRepository extends JpaRepository<AssignmentAttempt, Long> {
    Optional<AssignmentAttempt> findByAssignmentIdAndUserId(Long assignmentId, Long userId);
    List<AssignmentAttempt> findByAssignmentId(Long assignmentId);
    List<AssignmentAttempt> findByAssignmentIdOrderByStartedAtDesc(Long assignmentId);
    List<AssignmentAttempt> findByUserIdOrderByStartedAtDesc(Long userId);

    @Query("SELECT COUNT(a) FROM AssignmentAttempt a WHERE a.assignment.id = :assignmentId AND a.status = 'COMPLETED'")
    long countCompletedAttemptsByAssignmentId(@Param("assignmentId") Long assignmentId);

    @Query("SELECT COUNT(a) FROM AssignmentAttempt a WHERE a.assignment.id = :assignmentId AND a.flaggedForReview = true")
    long countFlaggedAttemptsByAssignmentId(@Param("assignmentId") Long assignmentId);

    @Query("SELECT SUM(a.integrityViolationCount) FROM AssignmentAttempt a WHERE a.assignment.id = :assignmentId")
    Long sumViolationsByAssignmentId(@Param("assignmentId") Long assignmentId);

    void deleteByAssignmentId(Long assignmentId);
}
