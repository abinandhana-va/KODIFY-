package infosys.onlinecodeplate.repository;

import infosys.onlinecodeplate.entity.UserBadge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface UserBadgeRepository extends JpaRepository<UserBadge, Long> {
    List<UserBadge> findByUserId(Long userId);
    List<UserBadge> findByUserIdOrderByEarnedAtDesc(Long userId);
    boolean existsByUserIdAndBadgeId(Long userId, Long badgeId);
    long countByBadgeId(Long badgeId);
    void deleteByBadgeId(Long badgeId);

    @Query("SELECT ub.badge.id FROM UserBadge ub WHERE ub.user.id = :userId")
    List<Long> findEarnedBadgeIdsByUserId(@Param("userId") Long userId);
}
