package infosys.onlinecodeplate.repository;

import infosys.onlinecodeplate.entity.Badge;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface BadgeRepository extends JpaRepository<Badge, Long> {
    List<Badge> findByEnabledTrue();
    List<Badge> findByEnabledTrueOrderByTargetAsc();
    List<Badge> findAllByOrderByTargetAsc();
    Optional<Badge> findByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCase(String name);
}
