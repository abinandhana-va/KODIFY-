package infosys.onlinecodeplate.config;

import infosys.onlinecodeplate.entity.Badge;
import infosys.onlinecodeplate.entity.Certificate;
import infosys.onlinecodeplate.entity.Role;
import infosys.onlinecodeplate.entity.User;
import infosys.onlinecodeplate.repository.BadgeRepository;
import infosys.onlinecodeplate.repository.CertificateRepository;
import infosys.onlinecodeplate.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
public class DataSeeder implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final BadgeRepository badgeRepository;
    private final CertificateRepository certificateRepository;

    public DataSeeder(UserRepository userRepository,
                      PasswordEncoder passwordEncoder,
                      BadgeRepository badgeRepository,
                      CertificateRepository certificateRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.badgeRepository = badgeRepository;
        this.certificateRepository = certificateRepository;
    }

    @Override
    public void run(String... args) {
        String adminEmail = "kodifyofficial@gmail.com";
        List<User> existingAdmins = userRepository.findByRole(Role.ADMIN);

        if (!existingAdmins.isEmpty()) {
            User primaryAdmin = existingAdmins.get(0);
            if (!adminEmail.equalsIgnoreCase(primaryAdmin.getEmail())) {
                Optional<User> userWithEmail = userRepository.findByEmail(adminEmail);
                if (userWithEmail.isPresent() && !userWithEmail.get().getId().equals(primaryAdmin.getId())) {
                    log.warn("Cannot update admin email to {} because that email is already registered to user ID {}",
                            adminEmail, userWithEmail.get().getId());
                } else {
                    primaryAdmin.setEmail(adminEmail);
                    userRepository.save(primaryAdmin);
                    log.info("Updated existing admin (ID: {}) email to {}", primaryAdmin.getId(), adminEmail);
                }
            }
        } else {
            Optional<User> userWithEmail = userRepository.findByEmail(adminEmail);
            if (userWithEmail.isPresent()) {
                log.warn("Cannot create default ADMIN with {} because that email belongs to an existing non-admin user (ID: {})",
                        adminEmail, userWithEmail.get().getId());
            } else {
                User admin = new User();
                admin.setName("Admin");
                String username = "admin@123";
                if (userRepository.existsByUsername(username)) {
                    username = "admin_official";
                }
                admin.setUsername(username);
                admin.setEmail(adminEmail);
                admin.setPassword(passwordEncoder.encode("apass@123"));
                admin.setRole(Role.ADMIN);
                admin.setStatus("ACTIVE");
                admin.setHostVerificationStatus("HOST_VERIFIED");
                userRepository.save(admin);
                log.info("Initialized default KODIFY ADMIN account with email: {}", adminEmail);
            }
        }

        // Seed initial certificates if certificate repository is empty
        if (certificateRepository.count() == 0) {
            certificateRepository.save(new Certificate(
                    "Beginner Coder",
                    "Complete 5 unique coding problems on Kodify",
                    "PROBLEMS_SOLVED",
                    5,
                    true
            ));
            certificateRepository.save(new Certificate(
                    "Problem Solver",
                    "Complete 10 unique coding problems on Kodify",
                    "PROBLEMS_SOLVED",
                    10,
                    true
            ));
            certificateRepository.save(new Certificate(
                    "Coding Champion",
                    "Complete 25 unique coding problems on Kodify",
                    "PROBLEMS_SOLVED",
                    25,
                    true
            ));
            certificateRepository.save(new Certificate(
                    "Contest Master",
                    "Participate in 5 coding contests on Kodify",
                    "CONTESTS_PARTICIPATED",
                    5,
                    true
            ));
        }

        // Seed initial badges if badge repository is empty
        if (badgeRepository.count() == 0) {
            badgeRepository.save(new Badge(
                    "Novice Coder",
                    "Solve your first coding challenge on Kodify",
                    "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=120&auto=format&fit=crop&q=80",
                    "CIRCLE",
                    "PROBLEMS_SOLVED",
                    1,
                    true
            ));
            badgeRepository.save(new Badge(
                    "Problem Solver",
                    "Solve 10 unique coding challenges",
                    "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=120&auto=format&fit=crop&q=80",
                    "CIRCLE",
                    "PROBLEMS_SOLVED",
                    10,
                    true
            ));
            badgeRepository.save(new Badge(
                    "Contest Explorer",
                    "Participate in 3 Kodify coding contests",
                    "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=120&auto=format&fit=crop&q=80",
                    "HEXAGON",
                    "CONTESTS_PARTICIPATED",
                    3,
                    true
            ));
            badgeRepository.save(new Badge(
                    "Contest Creator",
                    "Conduct at least 1 public coding contest",
                    "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=120&auto=format&fit=crop&q=80",
                    "HEXAGON",
                    "CONTESTS_CONDUCTED",
                    1,
                    true
            ));
            badgeRepository.save(new Badge(
                    "Master of Code",
                    "Solve 50 unique coding challenges",
                    "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=120&auto=format&fit=crop&q=80",
                    "DIAMOND",
                    "PROBLEMS_SOLVED",
                    50,
                    true
            ));
        }
    }
}
