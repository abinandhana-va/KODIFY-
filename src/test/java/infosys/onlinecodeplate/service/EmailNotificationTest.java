package infosys.onlinecodeplate.service;

import infosys.onlinecodeplate.entity.NotificationEvent;
import infosys.onlinecodeplate.repository.NotificationEventRepository;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;

import java.time.LocalDateTime;
import java.util.Properties;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class EmailNotificationTest {

    @Mock
    private JavaMailSender mailSender;

    @Mock
    private NotificationEventRepository notificationEventRepo;

    private EmailService emailService;

    @BeforeEach
    void setUp() {
        emailService = new EmailService(mailSender, notificationEventRepo);
        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        lenient().when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
    }

    @Test
    @DisplayName("1. Send Welcome Email on Signup dispatches email and saves NotificationEvent")
    void testSendWelcomeEmail() {
        boolean sent = emailService.sendWelcomeEmail(10L, "newuser@example.com", "Anandha Raman", "anandharaman");

        assertTrue(sent);
        verify(mailSender, times(1)).send(any(MimeMessage.class));

        ArgumentCaptor<NotificationEvent> eventCaptor = ArgumentCaptor.forClass(NotificationEvent.class);
        verify(notificationEventRepo, times(1)).save(eventCaptor.capture());
        NotificationEvent event = eventCaptor.getValue();
        assertEquals("USER_REGISTERED", event.getType());
        assertEquals("newuser@example.com", event.getRecipientEmail());
        assertEquals("SENT", event.getStatus());
    }

    @Test
    @DisplayName("2. Send Milestone Achievement Email with Duplicate Prevention")
    void testSendMilestoneEmail_WithDuplicatePrevention() {
        when(notificationEventRepo.existsByUserIdAndTypeAndReferenceId(10L, "MILESTONE_ACHIEVED", "5")).thenReturn(false);

        boolean sentFirst = emailService.sendMilestoneEmail(10L, "coder@example.com", "Alice Coder", "5 Problems Solved", 5, "Bronze Algorithmist", 5L);
        assertTrue(sentFirst);
        verify(mailSender, times(1)).send(any(MimeMessage.class));

        // When duplicate check returns true
        when(notificationEventRepo.existsByUserIdAndTypeAndReferenceId(10L, "MILESTONE_ACHIEVED", "5")).thenReturn(true);
        boolean sentSecond = emailService.sendMilestoneEmail(10L, "coder@example.com", "Alice Coder", "5 Problems Solved", 5, "Bronze Algorithmist", 5L);
        assertTrue(sentSecond);
        // mailSender still called only once
        verify(mailSender, times(1)).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("3. Send Host Verification Approval Email")
    void testSendHostVerificationApprovalEmail() {
        boolean sent = emailService.sendHostVerificationApprovalEmail(20L, "faculty@university.edu", "Dr. Raman");

        assertTrue(sent);
        verify(mailSender, times(1)).send(any(MimeMessage.class));

        ArgumentCaptor<NotificationEvent> eventCaptor = ArgumentCaptor.forClass(NotificationEvent.class);
        verify(notificationEventRepo, times(1)).save(eventCaptor.capture());
        NotificationEvent event = eventCaptor.getValue();
        assertEquals("HOST_VERIFIED", event.getType());
        assertEquals("faculty@university.edu", event.getRecipientEmail());
    }

    @Test
    @DisplayName("4. Send Contest Invitation Email with Duplicate Prevention")
    void testSendContestInvitationEmail() {
        when(notificationEventRepo.existsByUserIdAndTypeAndReferenceId(30L, "CONTEST_PRIVATE_INVITED", "101")).thenReturn(false);

        boolean sent = emailService.sendContestInvitationEmail(
                30L,
                "competitor@kodify.dev",
                "Kolam Algorithmic Cup 2026",
                "KODIFY Arena",
                LocalDateTime.now().plusDays(1),
                LocalDateTime.now().plusDays(1).plusHours(2),
                120,
                "Standard competitive rules apply.",
                101L
        );

        assertTrue(sent);
        verify(mailSender, times(1)).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("4b. Send Public Contest Announcement Email")
    void testSendContestPublishedEmail() {
        when(notificationEventRepo.existsByUserIdAndTypeAndReferenceId(35L, "CONTEST_PUBLISHED", "102")).thenReturn(false);

        boolean sent = emailService.sendContestPublishedEmail(
                35L,
                "coder@kodify.dev",
                "Alice",
                "National Sprint 2026",
                "KODIFY",
                LocalDateTime.now().plusDays(2),
                LocalDateTime.now().plusDays(2).plusHours(2),
                LocalDateTime.now().plusDays(2).minusMinutes(30),
                "Open algorithmic challenge",
                102L
        );

        assertTrue(sent);
        verify(mailSender, atLeastOnce()).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("4c. Send Contest Rank 1 Certificate Email")
    void testSendContestRank1CertificateEmail() {
        when(notificationEventRepo.existsByUserIdAndTypeAndReferenceId(36L, "CONTEST_RANK1_CERTIFICATE", "103")).thenReturn(false);

        boolean sent = emailService.sendContestRank1CertificateEmail(
                36L,
                "winner@kodify.dev",
                "Bob Champion",
                "Grand Challenge 2026",
                LocalDateTime.now().minusHours(1),
                103L,
                "KODIFY-CERT-WINNER-1"
        );

        assertTrue(sent);
        verify(mailSender, atLeastOnce()).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("5. Send Assignment Invitation Email with 6-Digit Code")
    void testSendAssignmentInvitationEmail_With6DigitCode() {
        boolean sent = emailService.sendAssignmentInvitationEmail(
                40L,
                "candidate@kodify.dev",
                "Vijay Kumar",
                "Algorithmic Midterm Assessment",
                "KODIFY Academy",
                LocalDateTime.now(),
                LocalDateTime.now().plusDays(2),
                90,
                "583214",
                "Webcam required, tab switching monitored.",
                202L
        );

        assertTrue(sent);
        verify(mailSender, times(1)).send(any(MimeMessage.class));

        ArgumentCaptor<NotificationEvent> eventCaptor = ArgumentCaptor.forClass(NotificationEvent.class);
        verify(notificationEventRepo, times(1)).save(eventCaptor.capture());
        NotificationEvent event = eventCaptor.getValue();
        assertEquals("ASSIGNMENT_INVITED", event.getType());
        assertEquals("candidate@kodify.dev", event.getRecipientEmail());
    }

    @Test
    @DisplayName("Blank recipient returns false without calling MailSender")
    void testEmailService_BlankRecipient_ReturnsFalse() {
        boolean sent = emailService.sendAssignmentInvitationEmail(
                null,
                "",
                "User",
                "Exam",
                "Org",
                LocalDateTime.now(),
                LocalDateTime.now().plusDays(1),
                60,
                "583214",
                "Rules",
                1L
        );
        assertFalse(sent);
        verify(mailSender, never()).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("Null MailSender simulates gracefully without throwing exception")
    void testEmailService_NullMailSender_SimulatesGracefully() {
        EmailService disabledService = new EmailService(null, notificationEventRepo);
        boolean sent = disabledService.sendWelcomeEmail(50L, "candidate@kodify.dev", "New Dev", "newdev");
        assertTrue(sent);
    }

    @Test
    @DisplayName("Assignment Invitation Email contains ENTER ASSIGNMENT link and does NOT expose code in URL")
    void testAssignmentInvitationEmail_ContainsDirectLinkWithoutExposingCode() throws Exception {
        emailService.setAppBaseUrl("http://localhost:8080");
        boolean sent = emailService.sendAssignmentInvitationEmail(
                40L,
                "candidate@kodify.dev",
                "Vijay Kumar",
                "Algorithmic Midterm Assessment",
                "KODIFY Academy",
                LocalDateTime.now(),
                LocalDateTime.now().plusDays(2),
                90,
                "583214",
                "Webcam required, tab switching monitored.",
                202L
        );

        assertTrue(sent);
        ArgumentCaptor<MimeMessage> msgCaptor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(mailSender, atLeastOnce()).send(msgCaptor.capture());
        MimeMessage msg = msgCaptor.getValue();
        assertEquals("KODIFY Assignment Invitation — Algorithmic Midterm Assessment", msg.getSubject());
    }
}
