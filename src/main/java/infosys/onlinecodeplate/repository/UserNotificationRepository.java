package infosys.onlinecodeplate.repository;

import infosys.onlinecodeplate.entity.UserNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserNotificationRepository extends JpaRepository<UserNotification, Long> {

    List<UserNotification> findByUserIdOrderByCreatedAtDesc(Long userId);

    long countByUserIdAndIsReadFalse(Long userId);

    List<UserNotification> findTop20ByUserIdOrderByCreatedAtDesc(Long userId);
}
