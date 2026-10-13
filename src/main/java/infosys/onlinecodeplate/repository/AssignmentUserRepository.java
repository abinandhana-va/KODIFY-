package infosys.onlinecodeplate.repository;

import infosys.onlinecodeplate.entity.AssignmentUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssignmentUserRepository extends JpaRepository<AssignmentUser, Long> {

    List<AssignmentUser> findByAssignmentId(Long assignmentId);

    List<AssignmentUser> findByUserId(Long userId);

    Optional<AssignmentUser> findByAssignmentIdAndUserId(Long assignmentId, Long userId);

    Optional<AssignmentUser> findByAssignmentIdAndAccessCode(Long assignmentId, String accessCode);

    boolean existsByAssignmentIdAndUserId(Long assignmentId, Long userId);

    void deleteByAssignmentId(Long assignmentId);

    void deleteByAssignmentIdAndUserId(Long assignmentId, Long userId);

    long countByAssignmentId(Long assignmentId);
}
