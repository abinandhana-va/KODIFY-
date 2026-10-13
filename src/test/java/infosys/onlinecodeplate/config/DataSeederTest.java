package infosys.onlinecodeplate.config;

import infosys.onlinecodeplate.entity.Role;
import infosys.onlinecodeplate.entity.User;
import infosys.onlinecodeplate.repository.BadgeRepository;
import infosys.onlinecodeplate.repository.CertificateRepository;
import infosys.onlinecodeplate.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class DataSeederTest {

    private UserRepository userRepository;
    private PasswordEncoder passwordEncoder;
    private BadgeRepository badgeRepository;
    private CertificateRepository certificateRepository;
    private DataSeeder dataSeeder;

    @BeforeEach
    public void setUp() {
        userRepository = mock(UserRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        badgeRepository = mock(BadgeRepository.class);
        certificateRepository = mock(CertificateRepository.class);

        when(passwordEncoder.encode(any())).thenReturn("hashed_password");
        when(badgeRepository.count()).thenReturn(10L);
        when(certificateRepository.count()).thenReturn(5L);

        dataSeeder = new DataSeeder(userRepository, passwordEncoder, badgeRepository, certificateRepository);
    }

    @Test
    @DisplayName("Seeds new ADMIN account with kodifyofficial@gmail.com when no admin exists")
    public void testSeedAdminWhenNoneExists() {
        when(userRepository.findByRole(Role.ADMIN)).thenReturn(Collections.emptyList());
        when(userRepository.findByEmail("kodifyofficial@gmail.com")).thenReturn(Optional.empty());
        when(userRepository.existsByUsername("admin@123")).thenReturn(false);

        dataSeeder.run();

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());

        User created = userCaptor.getValue();
        assertEquals("kodifyofficial@gmail.com", created.getEmail());
        assertEquals("admin@123", created.getUsername());
        assertEquals(Role.ADMIN, created.getRole());
        assertEquals("ACTIVE", created.getStatus());
        assertEquals("HOST_VERIFIED", created.getHostVerificationStatus());
    }

    @Test
    @DisplayName("Idempotent when ADMIN account already exists with kodifyofficial@gmail.com")
    public void testIdempotentWhenAdminAlreadyExistsWithCorrectEmail() {
        User existingAdmin = new User();
        existingAdmin.setId(1L);
        existingAdmin.setUsername("admin@123");
        existingAdmin.setEmail("kodifyofficial@gmail.com");
        existingAdmin.setPassword("existing_custom_hash");
        existingAdmin.setRole(Role.ADMIN);

        when(userRepository.findByRole(Role.ADMIN)).thenReturn(List.of(existingAdmin));

        dataSeeder.run();

        // Should not create or save again
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Updates existing ADMIN account email to kodifyofficial@gmail.com while preserving password")
    public void testUpdatesExistingAdminEmailPreservingPassword() {
        User existingAdmin = new User();
        existingAdmin.setId(1L);
        existingAdmin.setUsername("admin@123");
        existingAdmin.setEmail("old_admin@kodify.dev");
        existingAdmin.setPassword("existing_custom_hash");
        existingAdmin.setRole(Role.ADMIN);

        when(userRepository.findByRole(Role.ADMIN)).thenReturn(List.of(existingAdmin));
        when(userRepository.findByEmail("kodifyofficial@gmail.com")).thenReturn(Optional.empty());

        dataSeeder.run();

        verify(userRepository).save(existingAdmin);
        assertEquals("kodifyofficial@gmail.com", existingAdmin.getEmail());
        assertEquals("existing_custom_hash", existingAdmin.getPassword());
        assertEquals("admin@123", existingAdmin.getUsername());
        assertEquals(Role.ADMIN, existingAdmin.getRole());
    }

    @Test
    @DisplayName("Does not convert regular USER account to ADMIN if email belongs to user")
    public void testDoesNotConvertUserToAdmin() {
        User regularUser = new User();
        regularUser.setId(5L);
        regularUser.setUsername("regular_dev");
        regularUser.setEmail("kodifyofficial@gmail.com");
        regularUser.setRole(Role.USER);

        when(userRepository.findByRole(Role.ADMIN)).thenReturn(Collections.emptyList());
        when(userRepository.findByEmail("kodifyofficial@gmail.com")).thenReturn(Optional.of(regularUser));

        dataSeeder.run();

        verify(userRepository, never()).save(any(User.class));
        assertEquals(Role.USER, regularUser.getRole());
    }

    @Test
    @DisplayName("Verify BCrypt password encoding for admin default password")
    public void testAdminPasswordEncoding() {
        org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder encoder = new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder();
        String encoded = encoder.encode("apass@123");
        assertTrue(encoder.matches("apass@123", encoded));
    }
}
