package infosys.onlinecodeplate.repository;

import infosys.onlinecodeplate.entity.ContestParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContestParticipantRepository extends JpaRepository<ContestParticipant, Long> {
    List<ContestParticipant> findByContestId(Long contestId);
    List<ContestParticipant> findByUserId(Long userId);
    Optional<ContestParticipant> findByContestIdAndUserId(Long contestId, Long userId);
    boolean existsByContestIdAndUserId(Long contestId, Long userId);
    long countByContestId(Long contestId);

    @Query("SELECT COUNT(DISTINCT cp.contest.id) FROM ContestParticipant cp WHERE cp.user.id = :userId AND cp.participatedAt IS NOT NULL")
    long countParticipatedContestsByUserId(@Param("userId") Long userId);

    @Query("SELECT cp FROM ContestParticipant cp WHERE cp.user.id = :userId AND cp.participatedAt IS NOT NULL")
    List<ContestParticipant> findActualParticipationsByUserId(@Param("userId") Long userId);

    void deleteByContestId(Long contestId);
}

