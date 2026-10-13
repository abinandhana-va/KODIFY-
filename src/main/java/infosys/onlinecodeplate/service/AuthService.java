package infosys.onlinecodeplate.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import infosys.onlinecodeplate.dto.Dtos.*;
import infosys.onlinecodeplate.entity.Role;
import infosys.onlinecodeplate.entity.User;
import infosys.onlinecodeplate.repository.UserRepository;
import infosys.onlinecodeplate.security.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Base64;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {
    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final CustomUserDetailsService userDetailsService;
    private final ActivityService activityService;
    private final EmailService emailService;
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil,
                       AuthenticationManager authenticationManager,
                       CustomUserDetailsService userDetailsService,
                       ActivityService activityService,
                       EmailService emailService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
        this.activityService = activityService;
        this.emailService = emailService;
    }

    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByUsername(req.getUsername())) {
            throw new RuntimeException("Username is already taken.");
        }
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new RuntimeException("Email is already registered");
        }
        if (!req.getPassword().equals(req.getRepeatPassword())) {
            throw new RuntimeException("Passwords do not match");
        }
        User user = new User();
        user.setName(req.getName().trim());
        user.setUsername(req.getUsername().trim());
        user.setEmail(req.getEmail().trim().toLowerCase());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setRole(Role.USER);
        user = userRepository.save(user);
        
        activityService.logActivity(user, "Account Created", "Welcome to Kodify!");

        // Dispatch Welcome Email (Non-blocking)
        try {
            if (emailService != null) {
                emailService.sendWelcomeEmail(user.getId(), user.getEmail(), user.getName(), user.getUsername());
            }
        } catch (Exception e) {
            // Log & ignore so email failure never fails user registration
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtUtil.generateToken(userDetails, user.getRole().name(), user.getId());
        return new AuthResponse(token, mapToDto(user));
    }

    public AuthResponse login(LoginRequest req) {
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword()));
        User user = userRepository.findByEmailOrUsername(req.getEmail(), req.getEmail()).orElseThrow();
        
        if (!user.isEnabled() || "BLOCKED".equalsIgnoreCase(user.getStatus())) {
            throw new RuntimeException("Your KODIFY account has been blocked. Please contact the administrator.");
        }

        activityService.logActivity(user, "Logged In", "User logged into the platform");

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtUtil.generateToken(userDetails, user.getRole().name(), user.getId());
        return new AuthResponse(token, mapToDto(user));
    }

    public AuthResponse loginWithGoogle(GoogleAuthRequest req) {
        String credentialToken = req.getCredential();
        if (credentialToken == null || credentialToken.isBlank()) {
            throw new RuntimeException("Google credential token is required.");
        }

        String[] parts = credentialToken.split("\\.");
        if (parts.length < 2) {
            throw new RuntimeException("Malformed Google ID token format.");
        }

        try {
            byte[] payloadBytes = Base64.getUrlDecoder().decode(parts[1]);
            JsonNode payload = objectMapper.readTree(payloadBytes);

            String email = payload.has("email") ? payload.get("email").asText() : null;
            String name = payload.has("name") ? payload.get("name").asText() : null;
            String sub = payload.has("sub") ? payload.get("sub").asText() : null;

            if (email == null || email.isBlank()) {
                throw new RuntimeException("Google ID token missing verified email address.");
            }

            String cleanEmail = email.trim().toLowerCase();
            Optional<User> optUser = Optional.empty();

            if (sub != null && !sub.isBlank()) {
                optUser = userRepository.findByGoogleId(sub);
            }
            if (optUser.isEmpty()) {
                optUser = userRepository.findByEmail(cleanEmail);
            }

            User user;
            boolean isNewUser = false;
            if (optUser.isPresent()) {
                user = optUser.get();
                if (!user.isEnabled() || "BLOCKED".equalsIgnoreCase(user.getStatus())) {
                    throw new RuntimeException("Your KODIFY account has been blocked. Please contact the administrator.");
                }

                // Link Google Identity Subject ID if not previously linked
                if (sub != null && !sub.isBlank() && (user.getGoogleId() == null || !user.getGoogleId().equals(sub))) {
                    user.setGoogleId(sub);
                    user = userRepository.save(user);
                }
            } else {
                user = new User();
                user.setName((name != null && !name.isBlank()) ? name.trim() : cleanEmail.split("@")[0]);

                String baseUsername = cleanEmail.split("@")[0].replaceAll("[^a-zA-Z0-9_]", "");
                if (baseUsername.isBlank()) baseUsername = "dev";
                String candidateUsername = baseUsername;
                int counter = 1;
                while (userRepository.existsByUsername(candidateUsername)) {
                    candidateUsername = baseUsername + counter++;
                }
                user.setUsername(candidateUsername);
                user.setEmail(cleanEmail);
                user.setGoogleId(sub);
                user.setStatus("ACTIVE");
                user.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
                user.setRole(Role.USER); // Never create ADMIN from Google OAuth
                user = userRepository.save(user);
                isNewUser = true;

                activityService.logActivity(user, "Account Created", "Joined KODIFY via verified Google authentication.");

                // Dispatch Welcome Email for newly registered Google user
                try {
                    if (emailService != null) {
                        emailService.sendWelcomeEmail(user.getId(), user.getEmail(), user.getName(), user.getUsername());
                    }
                } catch (Exception e) {
                    // Log & ignore so email failure never fails user registration
                }
            }

            activityService.logActivity(user, "Google Login", "User authenticated with Google OAuth.");

            UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
            String token = jwtUtil.generateToken(userDetails, user.getRole().name(), user.getId());
            return new AuthResponse(token, mapToDto(user));
        } catch (RuntimeException re) {
            throw re;
        } catch (Exception e) {
            throw new RuntimeException("Failed to process Google authentication: " + e.getMessage(), e);
        }
    }

    public AuthResponse adminLogin(LoginRequest req) {
        String identifier = req.getEmail() != null ? req.getEmail().trim() : "";
        if (identifier.isBlank()) {
            log.warn("Admin login failed: Identifier (email/username) was blank.");
            throw new RuntimeException("Email or username is required.");
        }

        try {
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(identifier, req.getPassword()));
        } catch (org.springframework.security.authentication.BadCredentialsException bce) {
            log.warn("Admin login failed: Password authentication failed for identifier: {}", identifier);
            throw new RuntimeException("Invalid admin credentials");
        } catch (org.springframework.security.core.AuthenticationException ae) {
            log.warn("Admin login failed: Authentication error for identifier: {} - {}", identifier, ae.getMessage());
            throw new RuntimeException("Invalid admin credentials");
        }

        User user = userRepository.findByEmailOrUsername(identifier, identifier)
                .orElseThrow(() -> {
                    log.warn("Admin login failed: User record not found for identifier: {}", identifier);
                    return new RuntimeException("Invalid admin credentials");
                });

        if (user.getRole() != Role.ADMIN) {
            log.warn("Admin login failed: User (ID: {}) does not have ADMIN role (actual: {})", user.getId(), user.getRole());
            throw new RuntimeException("Access denied: Account is not an administrator.");
        }
        if (!user.isEnabled() || "BLOCKED".equalsIgnoreCase(user.getStatus())) {
            log.warn("Admin login failed: Account is disabled or blocked for user ID {}", user.getId());
            throw new RuntimeException("Your KODIFY account has been blocked. Please contact the administrator.");
        }

        activityService.logActivity(user, "Admin Logged In", "Admin accessed the platform");
        log.info("Admin login successful for user ID: {} (email: {})", user.getId(), user.getEmail());

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtUtil.generateToken(userDetails, user.getRole().name(), user.getId());
        return new AuthResponse(token, mapToDto(user));
    }
    
    public UserDto mapToDto(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole().name());
        dto.setStatus(user.getStatus());
        dto.setBio(user.getBio());
        dto.setContact(user.getContact());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());
        return dto;
    }
}
