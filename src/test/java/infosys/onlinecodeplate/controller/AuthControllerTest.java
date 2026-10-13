package infosys.onlinecodeplate.controller;

import infosys.onlinecodeplate.dto.Dtos;
import infosys.onlinecodeplate.dto.Dtos.AuthResponse;
import infosys.onlinecodeplate.dto.Dtos.LoginRequest;
import infosys.onlinecodeplate.dto.Dtos.GoogleAuthRequest;
import infosys.onlinecodeplate.entity.Role;
import infosys.onlinecodeplate.entity.User;
import infosys.onlinecodeplate.repository.UserActivityRepository;
import infosys.onlinecodeplate.repository.UserRepository;
import infosys.onlinecodeplate.security.JwtUtil;
import infosys.onlinecodeplate.service.ActivityService;
import infosys.onlinecodeplate.service.AuthService;
import infosys.onlinecodeplate.service.CustomUserDetailsService;
import infosys.onlinecodeplate.service.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

public class AuthControllerTest {

    private UserRepository userRepository;
    private PasswordEncoder passwordEncoder;
    private JwtUtil jwtUtil;
    private AuthenticationManager authenticationManager;
    private CustomUserDetailsService userDetailsService;
    private ActivityService activityService;
    private AuthService authService;
    private AuthController authController;

    private User adminUser;
    private User normalUser;

    @BeforeEach
    public void setUp() {
        userRepository = Mockito.mock(UserRepository.class);
        passwordEncoder = Mockito.mock(PasswordEncoder.class);
        jwtUtil = new JwtUtil();
        authenticationManager = Mockito.mock(AuthenticationManager.class);
        userDetailsService = new CustomUserDetailsService(userRepository);
        UserActivityRepository activityRepo = Mockito.mock(UserActivityRepository.class);
        activityService = new ActivityService(activityRepo);
        EmailService emailService = Mockito.mock(EmailService.class);

        authService = new AuthService(userRepository, passwordEncoder, jwtUtil, authenticationManager, userDetailsService, activityService, emailService);
        authController = new AuthController(authService);

        adminUser = new User();
        adminUser.setId(1L);
        adminUser.setName("Admin User");
        adminUser.setUsername("admin@123");
        adminUser.setEmail("kodifyofficial@gmail.com");
        adminUser.setPassword("encoded_admin_pass");
        adminUser.setRole(Role.ADMIN);

        normalUser = new User();
        normalUser.setId(2L);
        normalUser.setName("Student User");
        normalUser.setUsername("student1");
        normalUser.setEmail("student1@example.com");
        normalUser.setPassword("encoded_student_pass");
        normalUser.setRole(Role.USER);
    }

    @Test
    @DisplayName("Admin Login succeeds for valid credentials and ADMIN role with admin email")
    public void testAdminLoginSuccess() {
        LoginRequest req = new LoginRequest();
        req.setEmail("kodifyofficial@gmail.com");
        req.setPassword("admin123");

        when(userRepository.findByEmailOrUsername("kodifyofficial@gmail.com", "kodifyofficial@gmail.com")).thenReturn(Optional.of(adminUser));

        ResponseEntity<?> response = authController.adminLogin(req);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody() instanceof AuthResponse);
        AuthResponse authResp = (AuthResponse) response.getBody();
        assertNotNull(authResp.getToken());
        assertEquals("ADMIN", authResp.getUser().getRole());
        assertEquals("kodifyofficial@gmail.com", authResp.getUser().getEmail());
    }

    @Test
    @DisplayName("Admin Login succeeds with admin username")
    public void testAdminLoginWithUsernameSuccess() {
        LoginRequest req = new LoginRequest();
        req.setEmail("admin@123");
        req.setPassword("admin123");

        when(userRepository.findByEmailOrUsername("admin@123", "admin@123")).thenReturn(Optional.of(adminUser));
        when(userRepository.findByEmailOrUsername("kodifyofficial@gmail.com", "kodifyofficial@gmail.com")).thenReturn(Optional.of(adminUser));

        ResponseEntity<?> response = authController.adminLogin(req);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody() instanceof AuthResponse);
        AuthResponse authResp = (AuthResponse) response.getBody();
        assertNotNull(authResp.getToken());
        assertEquals("ADMIN", authResp.getUser().getRole());
        assertEquals("kodifyofficial@gmail.com", authResp.getUser().getEmail());
    }

    @Test
    @DisplayName("Admin Login fails with 401 when non-admin user attempts admin login")
    public void testAdminLoginFailsForNonAdminUser() {
        LoginRequest req = new LoginRequest();
        req.setEmail("student1@example.com");
        req.setPassword("password123");

        when(userRepository.findByEmailOrUsername("student1@example.com", "student1@example.com")).thenReturn(Optional.of(normalUser));

        ResponseEntity<?> response = authController.adminLogin(req);
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertTrue(response.getBody() instanceof Map);
        Map<?, ?> err = (Map<?, ?>) response.getBody();
        assertTrue(err.get("message").toString().contains("Access denied: Account is not an administrator"));
    }

    @Test
    @DisplayName("Admin Login fails with 401 when authentication manager throws bad credentials")
    public void testAdminLoginFailsInvalidPassword() {
        LoginRequest req = new LoginRequest();
        req.setEmail("kodifyofficial@gmail.com");
        req.setPassword("wrongpassword");

        when(authenticationManager.authenticate(any())).thenThrow(new BadCredentialsException("Bad credentials"));

        ResponseEntity<?> response = authController.adminLogin(req);
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }

    @Test
    @DisplayName("Login fails with 403 Forbidden when user is blocked")
    public void testBlockedUserLoginRejected() {
        normalUser.setStatus("BLOCKED");
        LoginRequest req = new LoginRequest();
        req.setEmail("student1@example.com");
        req.setPassword("password123");

        when(userRepository.findByEmailOrUsername("student1@example.com", "student1@example.com")).thenReturn(Optional.of(normalUser));

        ResponseEntity<?> response = authController.login(req);
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertTrue(response.getBody() instanceof Map);
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertEquals("Your KODIFY account has been blocked. Please contact the administrator.", body.get("message"));
    }

    @Test
    @DisplayName("Google Login succeeds and links existing account")
    public void testGoogleLoginLinksExistingUser() {
        String mockHeader = java.util.Base64.getUrlEncoder().encodeToString("{\"alg\":\"HS256\",\"typ\":\"JWT\"}".getBytes()).replace("=", "");
        String mockPayload = java.util.Base64.getUrlEncoder().encodeToString("{\"sub\":\"google_98765\",\"email\":\"student1@example.com\",\"name\":\"Student User\"}".getBytes()).replace("=", "");
        String testToken = mockHeader + "." + mockPayload + ".signature";

        when(userRepository.findByGoogleId("google_98765")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("student1@example.com")).thenReturn(Optional.of(normalUser));
        when(userRepository.findByEmailOrUsername("student1@example.com", "student1@example.com")).thenReturn(Optional.of(normalUser));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        Dtos.GoogleAuthRequest req = new Dtos.GoogleAuthRequest(testToken);
        ResponseEntity<?> response = authController.loginWithGoogle(req);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody() instanceof AuthResponse);
        AuthResponse authResp = (AuthResponse) response.getBody();
        assertEquals("student1@example.com", authResp.getUser().getEmail());
        assertEquals("google_98765", normalUser.getGoogleId());
    }

    @Test
    @DisplayName("Google Login fails with 403 when local account is blocked")
    public void testBlockedGoogleUserRejected() {
        normalUser.setStatus("BLOCKED");
        String mockHeader = java.util.Base64.getUrlEncoder().encodeToString("{\"alg\":\"HS256\",\"typ\":\"JWT\"}".getBytes()).replace("=", "");
        String mockPayload = java.util.Base64.getUrlEncoder().encodeToString("{\"sub\":\"google_98765\",\"email\":\"student1@example.com\",\"name\":\"Student User\"}".getBytes()).replace("=", "");
        String testToken = mockHeader + "." + mockPayload + ".signature";

        when(userRepository.findByGoogleId("google_98765")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("student1@example.com")).thenReturn(Optional.of(normalUser));

        Dtos.GoogleAuthRequest req = new Dtos.GoogleAuthRequest(testToken);
        ResponseEntity<?> response = authController.loginWithGoogle(req);

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertTrue(response.getBody() instanceof Map);
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertEquals("Your KODIFY account has been blocked. Please contact the administrator.", body.get("message"));
    }

    @Test
    @DisplayName("GET /api/auth/config returns safe OAuth configuration without exposing secrets")
    public void testGetAuthConfigReturnsSafeConfiguration() {
        ResponseEntity<Map<String, Object>> response = authController.getAuthConfig();
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().containsKey("googleOAuthEnabled"));
        assertTrue(response.getBody().containsKey("googleClientId"));
        assertTrue(response.getBody().containsKey("googleClientIdSuffix"));
    }
}
