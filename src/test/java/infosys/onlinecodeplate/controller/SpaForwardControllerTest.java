package infosys.onlinecodeplate.controller;

import infosys.onlinecodeplate.config.SpaForwardController;
import infosys.onlinecodeplate.service.EmailService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class SpaForwardControllerTest {

    @Test
    @DisplayName("SpaForwardController forwards all SPA routes to /index.html")
    void testSpaForwardControllerReturnsForwardToIndex() {
        SpaForwardController controller = new SpaForwardController();
        String forwardResult = controller.forwardSpaRoutes();
        assertEquals("forward:/index.html", forwardResult);
    }

    @Test
    @DisplayName("EmailService generates correct SPA deep link for assignment invitation")
    void testEmailServiceGeneratesSpaDeepLink() {
        EmailService emailService = new EmailService(null, null);
        emailService.setAppBaseUrl("http://localhost:8080");

        boolean sent = emailService.sendAssignmentInvitationEmail(
                10L,
                "candidate@kodify.dev",
                "Vijay Kumar",
                "Advanced Algorithms Midterm",
                "KODIFY University",
                LocalDateTime.now(),
                LocalDateTime.now().plusDays(2),
                90,
                "948372",
                "Webcam required, fullscreen mode monitored.",
                105L
        );

        assertTrue(sent);
    }
}
