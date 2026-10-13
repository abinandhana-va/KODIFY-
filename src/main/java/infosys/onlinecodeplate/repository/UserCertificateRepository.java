package infosys.onlinecodeplate.repository;

import infosys.onlinecodeplate.entity.UserCertificate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserCertificateRepository extends JpaRepository<UserCertificate, Long> {
    List<UserCertificate> findByUserId(Long userId);
    List<UserCertificate> findByUserIdOrderByUnlockedAtDesc(Long userId);
    Optional<UserCertificate> findByUserIdAndCertificateId(Long userId, Long certificateId);
    boolean existsByUserIdAndCertificateId(Long userId, Long certificateId);
    Optional<UserCertificate> findByUserIdAndContestId(Long userId, Long contestId);
    boolean existsByUserIdAndContestId(Long userId, Long contestId);
    List<UserCertificate> findByUserIdAndCategory(Long userId, String category);
    Optional<UserCertificate> findByCertificateCode(String certificateCode);
    long countByCertificateId(Long certificateId);
    void deleteByCertificateId(Long certificateId);
}
