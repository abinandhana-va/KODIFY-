package infosys.onlinecodeplate.repository;

import infosys.onlinecodeplate.entity.SupportTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SupportTicketRepository extends JpaRepository<SupportTicket, Long> {

    Optional<SupportTicket> findByTicketNumber(String ticketNumber);

    List<SupportTicket> findByUserIdOrderByCreatedAtDesc(Long userId);

    @Query("SELECT t FROM SupportTicket t ORDER BY " +
           "CASE t.priority WHEN 'HIGH' THEN 1 WHEN 'MEDIUM' THEN 2 WHEN 'LOW' THEN 3 ELSE 4 END ASC, " +
           "t.createdAt DESC")
    List<SupportTicket> findAllOrderByPriorityAndCreatedAt();

    long countByStatus(String status);
}
