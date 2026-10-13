package infosys.onlinecodeplate.repository;

import infosys.onlinecodeplate.entity.Certificate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CertificateRepository extends JpaRepository<Certificate, Long> {
    List<Certificate> findByEnabledTrue();
    List<Certificate> findByEnabledTrueOrderByTargetAsc();
    List<Certificate> findAllByOrderByTargetAsc();
    Optional<Certificate> findByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCase(String name);
    Optional<Certificate> findByContestId(Long contestId);
    boolean existsByContestId(Long contestId);
    List<Certificate> findByCategory(String category);
}
