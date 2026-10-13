package infosys.onlinecodeplate.repository;
import infosys.onlinecodeplate.entity.Problem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ProblemRepository extends JpaRepository<Problem, Long> {
    @Query("SELECT p FROM Problem p WHERE p.isPrivate IS NULL OR p.isPrivate = false")
    List<Problem> findPublicProblems();

    List<Problem> findByCreatorId(Long creatorId);

    @Query("SELECT p FROM Problem p WHERE p.isPrivate IS NULL OR p.isPrivate = false OR p.creatorId = :creatorId")
    List<Problem> findPublicAndHostProblems(@Param("creatorId") Long creatorId);
}
