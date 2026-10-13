package infosys.onlinecodeplate.repository;

import infosys.onlinecodeplate.entity.AssignmentCreatorVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssignmentCreatorVerificationRepository extends JpaRepository<AssignmentCreatorVerification, Long> {

    List<AssignmentCreatorVerification> findByUserIdOrderBySubmittedAtDesc(Long userId);

    @Query("SELECT v FROM AssignmentCreatorVerification v WHERE v.user.id = :userId ORDER BY v.submittedAt DESC")
    List<AssignmentCreatorVerification> findLatestByUserId(@Param("userId") Long userId);

    Optional<AssignmentCreatorVerification> findTopByUserIdOrderBySubmittedAtDesc(Long userId);

    List<AssignmentCreatorVerification> findAllByOrderBySubmittedAtDesc();

    List<AssignmentCreatorVerification> findByStatusOrderBySubmittedAtDesc(String status);

    boolean existsByUserIdAndStatus(Long userId, String status);
}
