package infosys.onlinecodeplate.repository;
import infosys.onlinecodeplate.entity.UserActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface UserActivityRepository extends JpaRepository<UserActivity, Long> {
    List<UserActivity> findByUserIdOrderByCreatedAtDesc(Long userId);
    long countByUserId(Long userId);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(DISTINCT a.user.id) FROM UserActivity a WHERE a.createdAt >= :cutoff")
    long countDistinctUsersSince(@org.springframework.data.repository.query.Param("cutoff") java.time.LocalDateTime cutoff);
}
