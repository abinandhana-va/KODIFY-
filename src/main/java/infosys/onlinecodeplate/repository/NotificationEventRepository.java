package infosys.onlinecodeplate.repository;

import infosys.onlinecodeplate.entity.NotificationEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationEventRepository extends JpaRepository<NotificationEvent, Long> {

    boolean existsByUserIdAndTypeAndReferenceId(Long userId, String type, String referenceId);

    boolean existsByRecipientEmailAndTypeAndReferenceId(String recipientEmail, String type, String referenceId);

    boolean existsByUserIdAndType(Long userId, String type);

    List<NotificationEvent> findByUserIdOrderBySentAtDesc(Long userId);
}
