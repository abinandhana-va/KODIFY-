package infosys.onlinecodeplate.repository;

import infosys.onlinecodeplate.entity.IntegrityEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IntegrityEventRepository extends JpaRepository<IntegrityEvent, Long> {
    List<IntegrityEvent> findByAttemptIdOrderByTimestampAsc(Long attemptId);
    List<IntegrityEvent> findByAssignmentIdOrderByTimestampDesc(Long assignmentId);
    List<IntegrityEvent> findByUserIdOrderByTimestampDesc(Long userId);

    long countByAttemptId(Long attemptId);

    @Query("SELECT COUNT(e) FROM IntegrityEvent e WHERE e.attempt.id = :attemptId AND e.severity = 'CRITICAL'")
    long countCriticalEventsByAttemptId(@Param("attemptId") Long attemptId);

    void deleteByAssignmentId(Long assignmentId);
    void deleteByAttemptId(Long attemptId);
}
