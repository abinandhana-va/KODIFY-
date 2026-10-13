package infosys.onlinecodeplate.repository;

import infosys.onlinecodeplate.entity.Assignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssignmentRepository extends JpaRepository<Assignment, Long> {

    List<Assignment> findByCreatorIdOrderByCreatedAtDesc(Long creatorId);

    @Query("SELECT a FROM Assignment a JOIN a.assignedUsers au WHERE au.user.id = :userId ORDER BY a.createdAt DESC")
    List<Assignment> findAssignedToUserId(@Param("userId") Long userId);

    List<Assignment> findAllByOrderByCreatedAtDesc();

    @Query("SELECT COUNT(a) FROM Assignment a WHERE a.creator.id = :userId")
    long countCreatedByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(au) FROM AssignmentUser au WHERE au.user.id = :userId")
    long countAssignedToUserId(@Param("userId") Long userId);
}
