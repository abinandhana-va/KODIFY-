package infosys.onlinecodeplate.controller;

import infosys.onlinecodeplate.dto.Dtos.*;
import infosys.onlinecodeplate.service.AuthService;
import jakarta.annotation.PostConstruct;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final AuthService authService;

    @Value("${app.google.client-id:}")
    private String googleClientId;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostConstruct
    public void logSafeOAuthDiagnostic() {
        boolean configured = googleClientId != null && !googleClientId.isBlank();
        String suffix = (configured && googleClientId.trim().length() > 4)
                ? "****" + googleClientId.trim().substring(googleClientId.trim().length() - 4)
                : "****";
        log.info("Google OAuth client configured: {}", configured ? "yes" : "no");
        if (configured) {
            log.info("Google OAuth client ID suffix: {}", suffix);
        }
    }

    @GetMapping("/config")
    public ResponseEntity<Map<String, Object>> getAuthConfig() {
        Map<String, Object> config = new HashMap<>();
        boolean configured = googleClientId != null && !googleClientId.isBlank();
        config.put("googleOAuthEnabled", configured);
        config.put("googleClientId", configured ? googleClientId.trim() : "");
        String suffix = (configured && googleClientId.trim().length() > 4)
                ? "****" + googleClientId.trim().substring(googleClientId.trim().length() - 4)
                : "****";
        config.put("googleClientIdSuffix", suffix);
        return ResponseEntity.ok(config);
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            return ResponseEntity.ok(authService.register(request));
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            return ResponseEntity.ok(authService.login(request));
        } catch (org.springframework.security.authentication.DisabledException | org.springframework.security.authentication.LockedException e) {
            Map<String, String> err = new HashMap<>();
            err.put("message", "Your KODIFY account has been blocked. Please contact the administrator.");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(err);
        } catch (Exception e) {
            String msg = e.getMessage() != null ? e.getMessage() : "Invalid credentials";
            if (msg.toLowerCase().contains("blocked") || msg.toLowerCase().contains("disabled")) {
                Map<String, String> err = new HashMap<>();
                err.put("message", "Your KODIFY account has been blocked. Please contact the administrator.");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(err);
            }
            Map<String, String> err = new HashMap<>();
            err.put("message", "Invalid credentials");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(err);
        }
    }

    @PostMapping("/google")
    public ResponseEntity<?> loginWithGoogle(@Valid @RequestBody GoogleAuthRequest request) {
        try {
            return ResponseEntity.ok(authService.loginWithGoogle(request));
        } catch (Exception e) {
            String msg = e.getMessage() != null ? e.getMessage() : "Google authentication failed";
            Map<String, String> err = new HashMap<>();
            err.put("message", msg);
            if (msg.toLowerCase().contains("blocked") || msg.toLowerCase().contains("disabled")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(err);
            }
            return ResponseEntity.badRequest().body(err);
        }
    }

    @PostMapping("/admin-login")
    public ResponseEntity<?> adminLogin(@Valid @RequestBody LoginRequest request) {
        try {
            return ResponseEntity.ok(authService.adminLogin(request));
        } catch (org.springframework.security.authentication.DisabledException | org.springframework.security.authentication.LockedException e) {
            Map<String, String> err = new HashMap<>();
            err.put("message", "Your KODIFY account has been blocked. Please contact the administrator.");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(err);
        } catch (Exception e) {
            String msg = e.getMessage() != null ? e.getMessage() : "Invalid admin credentials";
            Map<String, String> err = new HashMap<>();
            err.put("message", msg);
            if (msg.toLowerCase().contains("blocked") || msg.toLowerCase().contains("disabled")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(err);
            }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(err);
        }
    }
}
