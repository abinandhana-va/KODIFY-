package infosys.onlinecodeplate.repository;

import infosys.onlinecodeplate.entity.AssignmentProblem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssignmentProblemRepository extends JpaRepository<AssignmentProblem, Long> {

    List<AssignmentProblem> findByAssignmentIdOrderByProblemOrderAsc(Long assignmentId);

    void deleteByAssignmentId(Long assignmentId);
}
