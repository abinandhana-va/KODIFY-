package infosys.onlinecodeplate.repository;
import infosys.onlinecodeplate.entity.Role;
import infosys.onlinecodeplate.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);
    Optional<User> findByEmailOrUsername(String email, String username);
    Optional<User> findByGoogleId(String googleId);
    List<User> findByRole(Role role);
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByGoogleId(String googleId);
}

