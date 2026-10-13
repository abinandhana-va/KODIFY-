package infosys.onlinecodeplate.repository;

import infosys.onlinecodeplate.entity.Contest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ContestRepository extends JpaRepository<Contest, Long> {
    List<Contest> findAllByOrderByStartTimeDesc();
    List<Contest> findByStatusOrderByStartTimeDesc(String status);
    List<Contest> findByOrganizerIdOrderByStartTimeDesc(Long organizerId);

    @Query("SELECT c FROM Contest c WHERE c.status != 'DRAFT' ORDER BY c.startTime ASC")
    List<Contest> findPublicContests();

    @Query("SELECT COUNT(c) FROM Contest c WHERE c.organizer.id = :organizerId AND c.status != 'DRAFT' AND c.status != 'CANCELLED'")
    long countConductedContestsByUserId(@Param("organizerId") Long organizerId);

    @Query("SELECT c FROM Contest c WHERE c.status != 'DRAFT' AND c.status != 'CANCELLED' ORDER BY c.createdAt DESC")
    List<Contest> findLatestPublishedContests();
}
