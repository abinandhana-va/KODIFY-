package infosys.onlinecodeplate.service;

import infosys.onlinecodeplate.entity.NotificationEvent;
import infosys.onlinecodeplate.entity.User;
import infosys.onlinecodeplate.repository.NotificationEventRepository;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final NotificationEventRepository notificationEventRepo;

    @Value("${app.mail.from:kodifyofficial@gmail.com}")
    private String fromAddress;

    @Value("${app.base-url:http://localhost:8080}")
    private String appBaseUrl;

    public void setAppBaseUrl(String appBaseUrl) {
        this.appBaseUrl = appBaseUrl;
    }

    @Autowired
    public EmailService(@Autowired(required = false) JavaMailSender mailSender,
                        @Autowired(required = false) NotificationEventRepository notificationEventRepo) {
        this.mailSender = mailSender;
        this.notificationEventRepo = notificationEventRepo;
    }

    // Overload for testing
    public EmailService(JavaMailSender mailSender) {
        this(mailSender, null);
    }

    /**
     * 1. Platform Signup Welcome Email
     */
    public boolean sendWelcomeEmail(Long userId, String toEmail, String fullName, String username) {
        if (toEmail == null || toEmail.isBlank()) return false;

        String safeName = (fullName != null && !fullName.isBlank()) ? fullName : "Developer";
        String safeUsername = (username != null && !username.isBlank()) ? username : "user";
        String subject = "Welcome to KODIFY";

        String content = """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <div style="background: linear-gradient(135deg, #0081A7 0%%, #00AFB9 100%%); padding: 20px; border-radius: 6px 6px 0 0; text-align: center; color: white;">
                        <h1 style="margin: 0; font-size: 24px; letter-spacing: 1px;">KODIFY</h1>
                        <p style="margin: 5px 0 0 0; font-size: 13px; opacity: 0.9;">Algorithmic Sandbox & Assessment Platform</p>
                    </div>
                    <div style="padding: 24px; background: #ffffff; color: #1e293b;">
                        <h2 style="font-size: 18px; color: #0081A7; margin-top: 0;">Welcome to KODIFY, %s!</h2>
                        <p style="font-size: 14px; line-height: 1.6;">Your account has been successfully created with username: <strong>@%s</strong>.</p>
                        
                        <div style="background: #f8fafc; border-left: 4px solid #0081A7; padding: 14px; margin: 18px 0; font-size: 13px; line-height: 1.6; color: #334155;">
                            <strong>Getting Started:</strong><br/>
                            • <strong>Practice Problems:</strong> Master data structures & algorithmic paradigms.<br/>
                            • <strong>Live Contests:</strong> Compete in scheduled contests and climb the leaderboard.<br/>
                            • <strong>Credentials:</strong> Earn authenticated PDF certificates and sticker badges.<br/>
                            • <strong>Assessments:</strong> Take proctored coding assessments with real-time integrity.
                        </div>

                        <p style="font-size: 13px; color: #64748b;">We are excited to have you in the KODIFY developer collective. Happy coding!</p>
                    </div>
                    <div style="text-align: center; font-size: 12px; color: #94a3b8; padding-top: 15px; border-top: 1px solid #e2e8f0;">
                        &copy; %d KODIFY Platform &bull; Edition 2026
                    </div>
                </div>
                """.formatted(safeName, safeUsername, LocalDateTime.now().getYear());

        return dispatchEmail(userId, "USER_REGISTERED", null, toEmail, subject, content);
    }

    /**
     * 2. Milestone Achievement Email
     */
    public boolean sendMilestoneEmail(Long userId, String toEmail, String fullName, String milestoneName,
                                      long problemsSolvedCount, String certificateName, Long milestoneId) {
        if (toEmail == null || toEmail.isBlank()) return false;

        String refId = milestoneId != null ? String.valueOf(milestoneId) : milestoneName;
        if (userId != null && notificationEventRepo != null) {
            if (notificationEventRepo.existsByUserIdAndTypeAndReferenceId(userId, "MILESTONE_ACHIEVED", refId)) {
                log.info("Milestone email already dispatched for user {} and milestone {}. Skipping duplicate.", userId, refId);
                return true;
            }
        }

        String safeName = (fullName != null && !fullName.isBlank()) ? fullName : "Achiever";
        String safeMilestone = (milestoneName != null && !milestoneName.isBlank()) ? milestoneName : "Algorithmic Milestone";
        String safeCert = (certificateName != null && !certificateName.isBlank()) ? certificateName : safeMilestone;
        String dateStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("MMMM dd, yyyy"));
        String subject = "KODIFY Milestone Achieved";

        String content = """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <div style="background: #059669; padding: 20px; border-radius: 6px 6px 0 0; text-align: center; color: white;">
                        <h2 style="margin: 0; font-size: 22px;">🏆 KODIFY Milestone Achieved!</h2>
                    </div>
                    <div style="padding: 24px; background: #ffffff; color: #1e293b;">
                        <p style="font-size: 15px;">Hello <strong>%s</strong>,</p>
                        <p style="font-size: 14px; line-height: 1.6;">Congratulations on reaching a major algorithmic milestone on the KODIFY platform!</p>
                        
                        <table style="width: 100%%; border-collapse: collapse; margin: 16px 0; background: #f0fdf4; border-radius: 6px; border: 1px solid #bbf7d0;">
                            <tr><td style="padding: 10px 14px; color: #166534; font-weight: bold;">Milestone Achieved:</td><td style="padding: 10px 14px; font-weight: bold; color: #15803d;">%s</td></tr>
                            <tr><td style="padding: 10px 14px; color: #166534; font-weight: bold;">Accepted Problems:</td><td style="padding: 10px 14px; font-weight: bold;">%d unique challenges</td></tr>
                            <tr><td style="padding: 10px 14px; color: #166534; font-weight: bold;">Certificate Unlocked:</td><td style="padding: 10px 14px; font-weight: bold;">%s</td></tr>
                            <tr><td style="padding: 10px 14px; color: #166534; font-weight: bold;">Date:</td><td style="padding: 10px 14px;">%s</td></tr>
                        </table>

                        <p style="font-size: 13px; color: #475569; line-height: 1.5;">You can now view and download your verified PDF achievement certificate directly from your KODIFY Profile / Certificates section.</p>
                    </div>
                    <div style="text-align: center; font-size: 12px; color: #94a3b8; padding-top: 15px; border-top: 1px solid #e2e8f0;">
                        &copy; %d KODIFY Achievements System
                    </div>
                </div>
                """.formatted(safeName, safeMilestone, problemsSolvedCount, safeCert, dateStr, LocalDateTime.now().getYear());

        return dispatchEmail(userId, "MILESTONE_ACHIEVED", refId, toEmail, subject, content);
    }

    /**
     * 3a. Host Verification OTP Email (Sent upon Admin Approval)
     */
    public boolean sendHostVerificationOtpEmail(Long userId, String toEmail, String fullName, String organizationName, String otpCode) {
        if (toEmail == null || toEmail.isBlank()) return false;

        String safeName = (fullName != null && !fullName.isBlank()) ? fullName : "Educator / Host";
        String safeOrg = (organizationName != null && !organizationName.isBlank()) ? organizationName : "Your Organization";
        String subject = "KODIFY Host Verification Approved — Enter OTP: " + otpCode;

        String baseUrl = (appBaseUrl != null && !appBaseUrl.isBlank()) ? appBaseUrl.replaceAll("/+$", "") : "http://localhost:8080";
        String verifyUrl = baseUrl + "/host-verification";

        String content = """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <div style="background: linear-gradient(135deg, #0081A7 0%%, #00AFB9 100%%); padding: 24px; border-radius: 6px 6px 0 0; text-align: center; color: white;">
                        <h2 style="margin: 0; font-size: 22px;">Organization Verification Approved ✓</h2>
                        <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.95;">Host Assessment & Proctoring Privileges</p>
                    </div>
                    <div style="padding: 24px; background: #ffffff; color: #1e293b;">
                        <p style="font-size: 15px;">Hello <strong>%s</strong>,</p>
                        <p style="font-size: 14px; line-height: 1.6;">
                            Your organization verification documents for <strong>%s</strong> have been reviewed and approved by the KODIFY Administrator.
                        </p>
                        
                        <div style="background: #f0fdf4; border: 1.5px solid #86efac; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                            <div style="font-size: 12px; color: #166534; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">Your 6-Digit Verification OTP</div>
                            <div style="font-size: 32px; font-weight: 900; color: #0081A7; letter-spacing: 6px; font-family: monospace; margin: 10px 0;">%s</div>
                            <div style="font-size: 12px; color: #64748b;">This OTP is valid for 15 minutes and can only be used once.</div>
                        </div>

                        <p style="font-size: 14px; line-height: 1.6;">
                            To complete your verification and unlock the ability to create and host proctored coding assessments, enter this 6-digit OTP in your KODIFY portal.
                        </p>

                        <div style="text-align: center; margin: 24px 0 16px 0;">
                            <a href="%s" style="background: linear-gradient(135deg, #0081A7 0%%, #00AFB9 100%%); color: #ffffff; text-decoration: none; padding: 12px 30px; font-size: 14px; font-weight: 700; border-radius: 6px; display: inline-block;">
                                VERIFY OTP & ACTIVATE HOST &rarr;
                            </a>
                        </div>
                    </div>
                    <div style="text-align: center; font-size: 12px; color: #94a3b8; padding-top: 15px; border-top: 1px solid #e2e8f0;">
                        &copy; %d KODIFY Assessment Administration
                    </div>
                </div>
                """.formatted(safeName, safeOrg, otpCode, verifyUrl, LocalDateTime.now().getYear());

        return dispatchEmail(userId, "HOST_OTP_DISPATCHED", otpCode, toEmail, subject, content);
    }

    /**
     * 3b. Host Verification Approval Email (Post-OTP completion)
     */
    public boolean sendHostVerificationApprovalEmail(Long userId, String toEmail, String fullName) {
        if (toEmail == null || toEmail.isBlank()) return false;

        String safeName = (fullName != null && !fullName.isBlank()) ? fullName : "Host";
        String subject = "KODIFY Host Verification Confirmed — Privileges Active";

        String content = """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <div style="background: #0081A7; padding: 20px; border-radius: 6px 6px 0 0; text-align: center; color: white;">
                        <h2 style="margin: 0; font-size: 22px;">KODIFY Host Verification Confirmed</h2>
                    </div>
                    <div style="padding: 24px; background: #ffffff; color: #1e293b;">
                        <p style="font-size: 15px;">Hello <strong>%s</strong>,</p>
                        <p style="font-size: 14px; line-height: 1.6;">Your 6-digit OTP has been verified successfully. Your account is now a <strong>VERIFIED HOST</strong>.</p>
                        
                        <div style="background: #f0fdf4; border: 1px solid #86efac; padding: 16px; border-radius: 6px; text-align: center; margin: 20px 0;">
                            <div style="font-size: 12px; color: #166534; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">Your Current Status</div>
                            <div style="font-size: 20px; font-weight: 800; color: #15803d; margin-top: 4px;">✓ HOST VERIFIED</div>
                        </div>

                        <p style="font-size: 14px; line-height: 1.6;">You can now create, configure, and host proctored coding assessments and assignments on KODIFY.</p>
                    </div>
                    <div style="text-align: center; font-size: 12px; color: #94a3b8; padding-top: 15px; border-top: 1px solid #e2e8f0;">
                        &copy; %d KODIFY Assessment Administration
                    </div>
                </div>
                """.formatted(safeName, LocalDateTime.now().getYear());

        return dispatchEmail(userId, "HOST_VERIFIED", "APPROVED", toEmail, subject, content);
    }

    /**
     * 3c. Creator Verification Decision Email (Approval with OTP or Rejection)
     */
    public boolean sendCreatorVerificationDecisionEmail(String toEmail, String fullName, boolean approved, String reason) {
        if (toEmail == null || toEmail.isBlank()) return false;

        String safeName = (fullName != null && !fullName.isBlank()) ? fullName : "Educator";
        String subject = approved ? "KODIFY Host Verification Approved" : "KODIFY Host Verification Update";
        String headerBg = approved ? "#0081A7" : "#dc2626";

        String content = """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <div style="background: %s; padding: 20px; border-radius: 6px 6px 0 0; text-align: center; color: white;">
                        <h2 style="margin: 0; font-size: 22px;">%s</h2>
                    </div>
                    <div style="padding: 24px; background: #ffffff; color: #1e293b;">
                        <p style="font-size: 15px;">Hello <strong>%s</strong>,</p>
                        <p style="font-size: 14px; line-height: 1.6;">
                            %s
                        </p>
                        <div style="background: #f8fafc; border-left: 4px solid %s; padding: 12px; margin: 15px 0; font-size: 13px; color: #475569;">
                            <strong>Note:</strong> %s
                        </div>
                    </div>
                    <div style="text-align: center; font-size: 12px; color: #94a3b8; padding-top: 15px; border-top: 1px solid #e2e8f0;">
                        &copy; %d KODIFY Assessment Administration
                    </div>
                </div>
                """.formatted(
                headerBg,
                approved ? "Host Verification Approved ✓" : "Host Verification Update",
                safeName,
                approved ? "Your organization verification has been approved." : "Your organization verification request was not approved at this time.",
                approved ? "#0081A7" : "#dc2626",
                reason != null && !reason.isBlank() ? reason : (approved ? "Verification approved." : "Insufficient documentation."),
                LocalDateTime.now().getYear()
        );

        return dispatchEmail(null, "VERIFICATION_DECISION", approved ? "APPROVED" : "REJECTED", toEmail, subject, content);
    }

    /**
     * 4. Contest Invitation / Registration Confirmation Email
     */
    public boolean sendContestRegistrationConfirmedEmail(Long userId, String toEmail, String participantName, String contestTitle, String orgName,
                                                        LocalDateTime startTime, LocalDateTime endTime,
                                                        Integer durationMinutes, Long contestId) {
        if (toEmail == null || toEmail.isBlank()) return false;

        String refId = contestId != null ? String.valueOf(contestId) : contestTitle;
        if (userId != null && notificationEventRepo != null) {
            if (notificationEventRepo.existsByUserIdAndTypeAndReferenceId(userId, "CONTEST_REGISTERED", refId)) {
                log.info("Contest registration email already dispatched for user {} and contest {}. Skipping duplicate.", userId, refId);
                return true;
            }
        }
        String safeName = (participantName != null && !participantName.isBlank()) ? participantName : "Competitor";
        String safeOrg = (orgName != null && !orgName.isBlank()) ? orgName : "KODIFY";
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("MMM dd, yyyy HH:mm");
        String startStr = startTime != null ? startTime.format(dtf) : "Scheduled";
        String endStr = endTime != null ? endTime.format(dtf) : "Scheduled";
        int duration = durationMinutes != null ? durationMinutes : 120;

        String baseUrl = (appBaseUrl != null && !appBaseUrl.isBlank()) ? appBaseUrl.replaceAll("/+$", "") : "http://localhost:8080";
        String contestUrl = (contestId != null) ? (baseUrl + "/contests/" + contestId) : (baseUrl + "/contests");

        String subject = "KODIFY Contest Registration Confirmed — " + contestTitle;

        String content = """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <div style="background: linear-gradient(135deg, #0081A7 0%%, #00AFB9 100%%); padding: 20px; border-radius: 6px 6px 0 0; text-align: center; color: white;">
                        <h2 style="margin: 0; font-size: 22px;">Contest Registration Confirmed ✓</h2>
                    </div>
                    <div style="padding: 24px; background: #ffffff; color: #1e293b;">
                        <p style="font-size: 15px;">Hello <strong>%s</strong>,</p>
                        <p style="font-size: 14px; line-height: 1.6;">You are officially registered for <strong>%s</strong> on KODIFY.</p>
                        
                        <table style="width: 100%%; border-collapse: collapse; margin: 16px 0; background: #f8fafc; border-radius: 6px; padding: 10px; border: 1px solid #e2e8f0;">
                            <tr><td style="padding: 8px 12px; color: #64748b; font-weight: bold;">Contest:</td><td style="padding: 8px 12px; font-weight: bold; color: #0081A7;">%s</td></tr>
                            <tr><td style="padding: 8px 12px; color: #64748b; font-weight: bold;">Organizer:</td><td style="padding: 8px 12px;">%s</td></tr>
                            <tr><td style="padding: 8px 12px; color: #64748b; font-weight: bold;">Start Time:</td><td style="padding: 8px 12px; font-weight: bold; color: #166534;">%s</td></tr>
                            <tr><td style="padding: 8px 12px; color: #64748b; font-weight: bold;">End Time:</td><td style="padding: 8px 12px;">%s</td></tr>
                            <tr><td style="padding: 8px 12px; color: #64748b; font-weight: bold;">Duration:</td><td style="padding: 8px 12px;">%d Minutes</td></tr>
                        </table>

                        <div style="background: #f0fdf4; border-left: 4px solid #16a34a; padding: 12px; margin: 16px 0; font-size: 13px; color: #166534;">
                            <strong>Ready to compete:</strong> Make sure you log in 10 minutes prior to the start time. The arena and problems will unlock automatically.
                        </div>

                        <div style="text-align: center; margin: 24px 0 16px 0;">
                            <a href="%s" style="background: linear-gradient(135deg, #0081A7 0%%, #00AFB9 100%%); color: #ffffff; text-decoration: none; padding: 12px 30px; font-size: 14px; font-weight: 700; border-radius: 6px; display: inline-block;">
                                VIEW CONTEST DETAILS &rarr;
                            </a>
                        </div>
                    </div>
                    <div style="text-align: center; font-size: 12px; color: #94a3b8; padding-top: 15px; border-top: 1px solid #e2e8f0;">
                        &copy; %d KODIFY Competitive Arena
                    </div>
                </div>
                """.formatted(safeName, contestTitle, contestTitle, safeOrg, startStr, endStr, duration, contestUrl, LocalDateTime.now().getYear());

        return dispatchEmail(userId, "CONTEST_REGISTERED", refId, toEmail, subject, content);
    }

    /**
     * 4b. Pre-Contest Reminder Email (10 Minutes before start)
     */
    public boolean sendContest10MinReminderEmail(Long userId, String toEmail, String participantName, String contestTitle,
                                                LocalDateTime startTime, Integer durationMinutes, Long contestId) {
        if (toEmail == null || toEmail.isBlank()) return false;

        String refId = contestId != null ? String.valueOf(contestId) : contestTitle;
        if (userId != null && notificationEventRepo != null) {
            if (notificationEventRepo.existsByUserIdAndTypeAndReferenceId(userId, "CONTEST_REMINDER_10M", refId)) {
                log.info("Contest reminder already sent to user {} for contest {}. Skipping duplicate.", userId, refId);
                return true;
            }
        }

        String safeName = (participantName != null && !participantName.isBlank()) ? participantName : "Competitor";
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("MMM dd, yyyy HH:mm");
        String startStr = startTime != null ? startTime.format(dtf) : "Starting soon";
        int duration = durationMinutes != null ? durationMinutes : 120;

        String baseUrl = (appBaseUrl != null && !appBaseUrl.isBlank()) ? appBaseUrl.replaceAll("/+$", "") : "http://localhost:8080";
        String enterArenaUrl = (contestId != null) ? (baseUrl + "/contests/" + contestId) : (baseUrl + "/contests");

        String subject = "KODIFY Contest Starts in 10 Minutes — " + contestTitle;

        String content = """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <div style="background: linear-gradient(135deg, #d97706 0%%, #f59e0b 100%%); padding: 20px; border-radius: 6px 6px 0 0; text-align: center; color: white;">
                        <h2 style="margin: 0; font-size: 22px;">⚡ Contest Starts in 10 Minutes</h2>
                    </div>
                    <div style="padding: 24px; background: #ffffff; color: #1e293b;">
                        <p style="font-size: 15px;">Hello <strong>%s</strong>,</p>
                        <p style="font-size: 14px; line-height: 1.6;">Your registered contest <strong>%s</strong> is starting in approximately 10 minutes!</p>
                        
                        <table style="width: 100%%; border-collapse: collapse; margin: 16px 0; background: #fffbeb; border-radius: 6px; padding: 10px; border: 1px solid #fef3c7;">
                            <tr><td style="padding: 8px 12px; color: #92400e; font-weight: bold;">Contest:</td><td style="padding: 8px 12px; font-weight: bold;">%s</td></tr>
                            <tr><td style="padding: 8px 12px; color: #92400e; font-weight: bold;">Start Time:</td><td style="padding: 8px 12px; font-weight: bold; color: #b45309;">%s</td></tr>
                            <tr><td style="padding: 8px 12px; color: #92400e; font-weight: bold;">Duration:</td><td style="padding: 8px 12px;">%d Minutes</td></tr>
                        </table>

                        <p style="font-size: 13px; color: #475569;">Enter the waiting area now to review guidelines and prepare your workspace.</p>

                        <div style="text-align: center; margin: 24px 0 16px 0;">
                            <a href="%s" style="background: #d97706; color: #ffffff; text-decoration: none; padding: 14px 34px; font-size: 15px; font-weight: 700; border-radius: 6px; display: inline-block; letter-spacing: 0.5px;">
                                ENTER ARENA NOW &rarr;
                            </a>
                        </div>
                    </div>
                    <div style="text-align: center; font-size: 12px; color: #94a3b8; padding-top: 15px; border-top: 1px solid #e2e8f0;">
                        &copy; %d KODIFY Competitive Arena
                    </div>
                </div>
                """.formatted(safeName, contestTitle, contestTitle, startStr, duration, enterArenaUrl, LocalDateTime.now().getYear());

        return dispatchEmail(userId, "CONTEST_REMINDER_10M", refId, toEmail, subject, content);
    }

    /**
     * 4c. Contest Started Live Email
     */
    public boolean sendContestStartedEmail(Long userId, String toEmail, String participantName, String contestTitle,
                                          LocalDateTime endTime, Integer durationMinutes, Long contestId) {
        if (toEmail == null || toEmail.isBlank()) return false;

        String refId = contestId != null ? String.valueOf(contestId) : contestTitle;
        if (userId != null && notificationEventRepo != null) {
            if (notificationEventRepo.existsByUserIdAndTypeAndReferenceId(userId, "CONTEST_STARTED", refId)) {
                return true;
            }
        }

        String safeName = (participantName != null && !participantName.isBlank()) ? participantName : "Competitor";
        String baseUrl = (appBaseUrl != null && !appBaseUrl.isBlank()) ? appBaseUrl.replaceAll("/+$", "") : "http://localhost:8080";
        String enterArenaUrl = (contestId != null) ? (baseUrl + "/contests/" + contestId) : (baseUrl + "/contests");

        String subject = "KODIFY Contest Has Started — " + contestTitle;

        String content = """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <div style="background: #ef4444; padding: 20px; border-radius: 6px 6px 0 0; text-align: center; color: white;">
                        <h2 style="margin: 0; font-size: 22px;">🔴 Contest is Now LIVE</h2>
                    </div>
                    <div style="padding: 24px; background: #ffffff; color: #1e293b;">
                        <p style="font-size: 15px;">Hello <strong>%s</strong>,</p>
                        <p style="font-size: 14px; line-height: 1.6;"><strong>%s</strong> has officially begun! Problems and starter code are now available in the arena.</p>

                        <div style="text-align: center; margin: 24px 0 16px 0;">
                            <a href="%s" style="background: #ef4444; color: #ffffff; text-decoration: none; padding: 14px 34px; font-size: 15px; font-weight: 700; border-radius: 6px; display: inline-block; letter-spacing: 0.5px;">
                                ENTER CONTEST ARENA &rarr;
                            </a>
                        </div>
                    </div>
                    <div style="text-align: center; font-size: 12px; color: #94a3b8; padding-top: 15px; border-top: 1px solid #e2e8f0;">
                        &copy; %d KODIFY Competitive Arena
                    </div>
                </div>
                """.formatted(safeName, contestTitle, enterArenaUrl, LocalDateTime.now().getYear());

        return dispatchEmail(userId, "CONTEST_STARTED", refId, toEmail, subject, content);
    }

    /**
     * 4d. Contest Results Available Email
     */
    public boolean sendContestResultAvailableEmail(Long userId, String toEmail, String participantName, String contestTitle,
                                                  Integer rank, Integer score, Integer totalScore, Long contestId) {
        if (toEmail == null || toEmail.isBlank()) return false;

        String refId = contestId != null ? String.valueOf(contestId) : contestTitle;
        if (userId != null && notificationEventRepo != null) {
            if (notificationEventRepo.existsByUserIdAndTypeAndReferenceId(userId, "CONTEST_RESULTS", refId)) {
                return true;
            }
        }

        String safeName = (participantName != null && !participantName.isBlank()) ? participantName : "Competitor";
        String baseUrl = (appBaseUrl != null && !appBaseUrl.isBlank()) ? appBaseUrl.replaceAll("/+$", "") : "http://localhost:8080";
        String resultsUrl = (contestId != null) ? (baseUrl + "/contests/" + contestId) : (baseUrl + "/contests");

        String subject = "KODIFY Contest Results Available — " + contestTitle;

        String content = """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <div style="background: linear-gradient(135deg, #059669 0%%, #10b981 100%%); padding: 20px; border-radius: 6px 6px 0 0; text-align: center; color: white;">
                        <h2 style="margin: 0; font-size: 22px;">🏆 Contest Results are In!</h2>
                    </div>
                    <div style="padding: 24px; background: #ffffff; color: #1e293b;">
                        <p style="font-size: 15px;">Hello <strong>%s</strong>,</p>
                        <p style="font-size: 14px; line-height: 1.6;">The official results and verified standings for <strong>%s</strong> are now available.</p>
                        
                        <table style="width: 100%%; border-collapse: collapse; margin: 16px 0; background: #f0fdf4; border-radius: 6px; padding: 10px; border: 1px solid #bbf7d0;">
                            <tr><td style="padding: 8px 12px; color: #166534; font-weight: bold;">Your Final Rank:</td><td style="padding: 8px 12px; font-weight: 900; color: #d97706; font-size: 16px;">#%s</td></tr>
                            <tr><td style="padding: 8px 12px; color: #166534; font-weight: bold;">Score Earned:</td><td style="padding: 8px 12px; font-weight: bold; color: #15803d;">%d / %d pts</td></tr>
                        </table>

                        <div style="text-align: center; margin: 24px 0 16px 0;">
                            <a href="%s" style="background: #059669; color: #ffffff; text-decoration: none; padding: 14px 34px; font-size: 15px; font-weight: 700; border-radius: 6px; display: inline-block; letter-spacing: 0.5px;">
                                VIEW COMPLETE BREAKDOWN &rarr;
                            </a>
                        </div>
                    </div>
                    <div style="text-align: center; font-size: 12px; color: #94a3b8; padding-top: 15px; border-top: 1px solid #e2e8f0;">
                        &copy; %d KODIFY Competitive Arena
                    </div>
                </div>
                """.formatted(safeName, contestTitle, rank != null ? String.valueOf(rank) : "--", score != null ? score : 0, totalScore != null ? totalScore : 0, resultsUrl, LocalDateTime.now().getYear());

        return dispatchEmail(userId, "CONTEST_RESULTS", refId, toEmail, subject, content);
    }

    /**
     * 4e. Public Contest Published Announcement Email
     */
    public boolean sendContestPublishedEmail(Long userId, String toEmail, String participantName,
                                            String contestTitle, String orgName,
                                            LocalDateTime startTime, LocalDateTime endTime,
                                            LocalDateTime registrationDeadline,
                                            String description, Long contestId) {
        if (toEmail == null || toEmail.isBlank()) return false;

        String refId = contestId != null ? String.valueOf(contestId) : contestTitle;
        if (userId != null && notificationEventRepo != null) {
            if (notificationEventRepo.existsByUserIdAndTypeAndReferenceId(userId, "CONTEST_PUBLISHED", refId)) {
                return true;
            }
        }

        String safeName = (participantName != null && !participantName.isBlank()) ? participantName : "Developer";
        String safeOrg = (orgName != null && !orgName.isBlank()) ? orgName : "KODIFY";
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("MMM dd, yyyy 'at' hh:mm a");
        DateTimeFormatter dateFmt = DateTimeFormatter.ofPattern("MMMM dd, yyyy");
        String dateStr = startTime != null ? startTime.format(dateFmt) : "Upcoming";
        String startStr = startTime != null ? startTime.format(dtf) : "Scheduled";
        String endStr = endTime != null ? endTime.format(dtf) : "Scheduled";
        String deadlineStr = registrationDeadline != null ? registrationDeadline.format(dtf) : (startTime != null ? startTime.minusMinutes(30).format(dtf) : "30 mins before start");

        String safeDesc = (description != null && !description.isBlank())
                ? description
                : "A new algorithmic challenge round has been scheduled on KODIFY. Register now to test your problem-solving abilities and compete for top ranks.";

        String baseUrl = (appBaseUrl != null && !appBaseUrl.isBlank()) ? appBaseUrl.replaceAll("/+$", "") : "http://localhost:8080";
        String contestUrl = (contestId != null) ? (baseUrl + "/contests/" + contestId) : (baseUrl + "/contests");

        String subject = "New Contest Announced on KODIFY: " + contestTitle;

        String content = """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <div style="background: linear-gradient(135deg, #0081A7 0%%, #00AFB9 100%%); padding: 22px; border-radius: 6px 6px 0 0; text-align: center; color: white;">
                        <h2 style="margin: 0; font-size: 22px; letter-spacing: 0.5px;">🏆 New KODIFY Contest Available</h2>
                        <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.95;">Open Registration &bull; Competitive Programming</p>
                    </div>
                    <div style="padding: 24px; background: #ffffff; color: #1e293b;">
                        <p style="font-size: 15px;">Hello <strong>%s</strong>,</p>
                        <p style="font-size: 14px; line-height: 1.6;">A new contest <strong>%s</strong> is now open on KODIFY. Register now and participate!</p>
                        
                        <div style="background: #f8fafc; border-left: 4px solid #0081A7; padding: 12px 16px; margin: 16px 0; font-size: 13px; color: #334155; line-height: 1.5;">
                            %s
                        </div>

                        <table style="width: 100%%; border-collapse: collapse; margin: 16px 0; background: #f8fafc; border-radius: 6px; padding: 10px; border: 1px solid #e2e8f0; font-size: 13px;">
                            <tr><td style="padding: 8px 12px; color: #64748b; font-weight: bold; width: 140px;">Contest Name:</td><td style="padding: 8px 12px; font-weight: bold; color: #0081A7;">%s</td></tr>
                            <tr><td style="padding: 8px 12px; color: #64748b; font-weight: bold;">Host / Org:</td><td style="padding: 8px 12px;">%s</td></tr>
                            <tr><td style="padding: 8px 12px; color: #64748b; font-weight: bold;">Contest Date:</td><td style="padding: 8px 12px; font-weight: 600;">%s</td></tr>
                            <tr><td style="padding: 8px 12px; color: #64748b; font-weight: bold;">Start Time:</td><td style="padding: 8px 12px; font-weight: bold; color: #15803d;">%s (IST)</td></tr>
                            <tr><td style="padding: 8px 12px; color: #64748b; font-weight: bold;">End Time:</td><td style="padding: 8px 12px; font-weight: bold; color: #b45309;">%s (IST)</td></tr>
                            <tr><td style="padding: 8px 12px; color: #64748b; font-weight: bold;">Registration Deadline:</td><td style="padding: 8px 12px; font-weight: bold; color: #dc2626;">%s (IST)</td></tr>
                        </table>

                        <p style="font-size: 13px; color: #64748b; line-height: 1.5;">Registration is strictly open until 30 minutes before the contest start time. Secure your spot now!</p>

                        <div style="text-align: center; margin: 24px 0 16px 0;">
                            <a href="%s" style="background: linear-gradient(135deg, #0081A7 0%%, #00AFB9 100%%); color: #ffffff; text-decoration: none; padding: 14px 32px; font-size: 14px; font-weight: 700; border-radius: 6px; display: inline-block;">
                                VIEW & REGISTER NOW &rarr;
                            </a>
                        </div>
                    </div>
                    <div style="text-align: center; font-size: 12px; color: #94a3b8; padding-top: 15px; border-top: 1px solid #e2e8f0;">
                        &copy; %d KODIFY Platform &bull; Automated Notifications
                    </div>
                </div>
                """.formatted(safeName, contestTitle, safeDesc, contestTitle, safeOrg, dateStr, startStr, endStr, deadlineStr, contestUrl, LocalDateTime.now().getYear());

        return dispatchEmail(userId, "CONTEST_PUBLISHED", refId, toEmail, subject, content);
    }

    /**
     * 4f. Private / Invited Contest Direct Invitation Email
     */
    public boolean sendContestPrivateInvitationEmail(Long userId, String toEmail, String participantName,
                                                    String contestTitle, String orgName,
                                                    LocalDateTime startTime, LocalDateTime endTime,
                                                    String description, Long contestId) {
        if (toEmail == null || toEmail.isBlank()) return false;

        String refId = contestId != null ? String.valueOf(contestId) : contestTitle;
        if (userId != null && notificationEventRepo != null) {
            if (notificationEventRepo.existsByUserIdAndTypeAndReferenceId(userId, "CONTEST_PRIVATE_INVITED", refId)) {
                return true;
            }
        }

        String safeName = (participantName != null && !participantName.isBlank()) ? participantName : "Invited Competitor";
        String safeOrg = (orgName != null && !orgName.isBlank()) ? orgName : "KODIFY";
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("MMM dd, yyyy 'at' hh:mm a");
        DateTimeFormatter dateFmt = DateTimeFormatter.ofPattern("MMMM dd, yyyy");
        String dateStr = startTime != null ? startTime.format(dateFmt) : "Scheduled";
        String startStr = startTime != null ? startTime.format(dtf) : "Scheduled";
        String endStr = endTime != null ? endTime.format(dtf) : "Scheduled";

        String safeDesc = (description != null && !description.isBlank())
                ? description
                : "You have been personally selected and invited to participate in this private coding contest.";

        String baseUrl = (appBaseUrl != null && !appBaseUrl.isBlank()) ? appBaseUrl.replaceAll("/+$", "") : "http://localhost:8080";
        String contestUrl = (contestId != null) ? (baseUrl + "/contests/" + contestId) : (baseUrl + "/contests");

        String subject = "You're Invited: " + contestTitle + " on KODIFY";

        String content = """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <div style="background: linear-gradient(135deg, #7c3aed 0%%, #a855f7 100%%); padding: 22px; border-radius: 6px 6px 0 0; text-align: center; color: white;">
                        <h2 style="margin: 0; font-size: 22px;">🎯 Private Contest Invitation</h2>
                        <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.95;">Exclusive Invitational Round</p>
                    </div>
                    <div style="padding: 24px; background: #ffffff; color: #1e293b;">
                        <p style="font-size: 15px;">Hello <strong>%s</strong>,</p>
                        <p style="font-size: 14px; line-height: 1.6;">You have been invited to participate in <strong>%s</strong> hosted by <strong>%s</strong>.</p>
                        
                        <div style="background: #faf5ff; border: 1px solid #d8b4fe; padding: 14px; border-radius: 6px; margin: 16px 0; text-align: center;">
                            <div style="font-size: 13px; font-weight: bold; color: #6b21a8;">✓ NO REGISTRATION REQUIRED</div>
                            <div style="font-size: 12px; color: #7e22ce; margin-top: 4px;">Your invitation grants you direct access to enter and compete in this contest.</div>
                        </div>

                        <table style="width: 100%%; border-collapse: collapse; margin: 16px 0; background: #f8fafc; border-radius: 6px; padding: 10px; border: 1px solid #e2e8f0; font-size: 13px;">
                            <tr><td style="padding: 8px 12px; color: #64748b; font-weight: bold; width: 130px;">Contest:</td><td style="padding: 8px 12px; font-weight: bold; color: #7c3aed;">%s</td></tr>
                            <tr><td style="padding: 8px 12px; color: #64748b; font-weight: bold;">Organizer:</td><td style="padding: 8px 12px;">%s</td></tr>
                            <tr><td style="padding: 8px 12px; color: #64748b; font-weight: bold;">Contest Date:</td><td style="padding: 8px 12px; font-weight: 600;">%s</td></tr>
                            <tr><td style="padding: 8px 12px; color: #64748b; font-weight: bold;">Start Time:</td><td style="padding: 8px 12px; font-weight: bold; color: #15803d;">%s (IST)</td></tr>
                            <tr><td style="padding: 8px 12px; color: #64748b; font-weight: bold;">End Time:</td><td style="padding: 8px 12px; font-weight: bold; color: #b45309;">%s (IST)</td></tr>
                        </table>

                        <div style="background: #f8fafc; border-left: 4px solid #7c3aed; padding: 12px 16px; margin: 16px 0; font-size: 13px; color: #334155; line-height: 1.5;">
                            <strong>Contest Info:</strong><br/>
                            %s
                        </div>

                        <div style="text-align: center; margin: 24px 0 16px 0;">
                            <a href="%s" style="background: linear-gradient(135deg, #7c3aed 0%%, #a855f7 100%%); color: #ffffff; text-decoration: none; padding: 14px 34px; font-size: 14px; font-weight: 700; border-radius: 6px; display: inline-block;">
                                DIRECT PARTICIPATION LINK &rarr;
                            </a>
                        </div>
                    </div>
                    <div style="text-align: center; font-size: 12px; color: #94a3b8; padding-top: 15px; border-top: 1px solid #e2e8f0;">
                        &copy; %d KODIFY Platform &bull; Private Invitational
                    </div>
                </div>
                """.formatted(safeName, contestTitle, safeOrg, contestTitle, safeOrg, dateStr, startStr, endStr, safeDesc, contestUrl, LocalDateTime.now().getYear());

        return dispatchEmail(userId, "CONTEST_PRIVATE_INVITED", refId, toEmail, subject, content);
    }

    public boolean sendContestPrivateInvitationEmail(Long userId, String toEmail, String participantName,
                                                    String contestTitle, String orgName,
                                                    LocalDateTime startTime, LocalDateTime endTime,
                                                    Integer durationMinutes, String description, Long contestId) {
        return sendContestPrivateInvitationEmail(userId, toEmail, participantName, contestTitle, orgName, startTime, endTime, description, contestId);
    }

    /**
     * 4g. Contest Rank 1 Certificate Email
     */
    public boolean sendContestRank1CertificateEmail(Long userId, String toEmail, String winnerName,
                                                   String contestTitle, LocalDateTime contestDate,
                                                   Long contestId, String certificateCode) {
        if (toEmail == null || toEmail.isBlank()) return false;

        String refId = contestId != null ? String.valueOf(contestId) : contestTitle;
        if (userId != null && notificationEventRepo != null) {
            if (notificationEventRepo.existsByUserIdAndTypeAndReferenceId(userId, "CONTEST_RANK1_CERTIFICATE", refId)) {
                log.info("Contest Rank 1 certificate email already sent for user {} and contest {}. Skipping duplicate.", userId, refId);
                return true;
            }
        }

        String safeName = (winnerName != null && !winnerName.isBlank()) ? winnerName : "Champion";
        DateTimeFormatter dateFmt = DateTimeFormatter.ofPattern("MMMM dd, yyyy");
        String dateStr = contestDate != null ? contestDate.format(dateFmt) : LocalDateTime.now().format(dateFmt);

        String baseUrl = (appBaseUrl != null && !appBaseUrl.isBlank()) ? appBaseUrl.replaceAll("/+$", "") : "http://localhost:8080";
        String certUrl = baseUrl + "/certificates";

        String subject = "🏆 Congratulations! You secured 1st Rank in " + contestTitle + " — Certificate Unlocked";

        String content = """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <div style="background: linear-gradient(135deg, #b45309 0%%, #f59e0b 100%%); padding: 24px; border-radius: 6px 6px 0 0; text-align: center; color: white;">
                        <h1 style="margin: 0; font-size: 24px;">🏆 1st Rank Champion!</h1>
                        <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.95;">Official KODIFY Contest Certificate Award</p>
                    </div>
                    <div style="padding: 24px; background: #ffffff; color: #1e293b;">
                        <p style="font-size: 15px;">Congratulations <strong>%s</strong>!</p>
                        <p style="font-size: 14px; line-height: 1.6;">You have unlocked a new <strong>KODIFY Contest Achievement Certificate</strong> for securing <strong>1st Rank</strong> in <strong>%s</strong>.</p>
                        
                        <table style="width: 100%%; border-collapse: collapse; margin: 18px 0; background: #fffdfa; border-radius: 6px; border: 1.5px solid #fde68a; font-size: 13px;">
                            <tr><td style="padding: 10px 14px; color: #92400e; font-weight: bold; width: 140px;">Recipient:</td><td style="padding: 10px 14px; font-weight: bold; color: #1e293b;">%s</td></tr>
                            <tr><td style="padding: 10px 14px; color: #92400e; font-weight: bold;">Category:</td><td style="padding: 10px 14px; font-weight: bold; color: #b45309;">Contest Achievement</td></tr>
                            <tr><td style="padding: 10px 14px; color: #92400e; font-weight: bold;">Contest Name:</td><td style="padding: 10px 14px; font-weight: bold;">%s</td></tr>
                            <tr><td style="padding: 10px 14px; color: #92400e; font-weight: bold;">Rank Achieved:</td><td style="padding: 10px 14px; font-weight: 900; color: #15803d; font-size: 15px;">★ 1st Rank (Winner)</td></tr>
                            <tr><td style="padding: 10px 14px; color: #92400e; font-weight: bold;">Contest Date:</td><td style="padding: 10px 14px;">%s</td></tr>
                            <tr><td style="padding: 10px 14px; color: #92400e; font-weight: bold;">Certificate Code:</td><td style="padding: 10px 14px; font-family: monospace; font-weight: bold; color: #475569;">%s</td></tr>
                        </table>

                        <p style="font-size: 13px; color: #475569; line-height: 1.5;">Your authenticated PDF certificate is available immediately. You can view, download, and share it from your KODIFY Profile.</p>

                        <div style="text-align: center; margin: 24px 0 16px 0;">
                            <a href="%s" style="background: linear-gradient(135deg, #b45309 0%%, #f59e0b 100%%); color: #ffffff; text-decoration: none; padding: 14px 34px; font-size: 14px; font-weight: 700; border-radius: 6px; display: inline-block;">
                                VIEW & DOWNLOAD CERTIFICATE &rarr;
                            </a>
                        </div>
                    </div>
                    <div style="text-align: center; font-size: 12px; color: #94a3b8; padding-top: 15px; border-top: 1px solid #e2e8f0;">
                        &copy; %d KODIFY Academic & Contest Board
                    </div>
                </div>
                """.formatted(safeName, contestTitle, safeName, contestTitle, dateStr, certificateCode != null ? certificateCode : "KODIFY-CERT", certUrl, LocalDateTime.now().getYear());

        return dispatchEmail(userId, "CONTEST_RANK1_CERTIFICATE", refId, toEmail, subject, content);
    }

    /**
     * 4h. Contest Invitation Email (Backwards Compatibility)
     */
    public boolean sendContestInvitationEmail(Long userId, String toEmail, String contestTitle, String orgName,
                                             LocalDateTime startTime, LocalDateTime endTime,
                                             Integer durationMinutes, String guidelines, Long contestId) {
        return sendContestPrivateInvitationEmail(userId, toEmail, null, contestTitle, orgName, startTime, endTime, guidelines, contestId);
    }

    /**
     * 4i. Certificate Unlocked Email with Direct 1-Click Download
     */
    public boolean sendCertificateUnlockedEmail(Long userId, String toEmail, String fullName, String category,
                                                String milestoneName, String achievementName, String certificateCode, Long certificateId) {
        if (toEmail == null || toEmail.isBlank()) return false;

        String refId = certificateCode != null ? certificateCode : String.valueOf(certificateId);
        if (userId != null && notificationEventRepo != null) {
            if (notificationEventRepo.existsByUserIdAndTypeAndReferenceId(userId, "CERTIFICATE_UNLOCKED", refId)) {
                log.info("Certificate unlocked email already dispatched for user {} and code {}. Skipping duplicate.", userId, refId);
                return true;
            }
        }

        String safeName = (fullName != null && !fullName.isBlank()) ? fullName : "Achiever";
        String safeCategory = (category != null && !category.isBlank()) ? category : "Milestone Achievement";
        String safeMilestone = (milestoneName != null && !milestoneName.isBlank()) ? milestoneName : "Certification";
        String safeAchievement = (achievementName != null && !achievementName.isBlank()) ? achievementName : safeMilestone;
        String dateStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("MMMM dd, yyyy"));

        String baseUrl = (appBaseUrl != null && !appBaseUrl.isBlank()) ? appBaseUrl.replaceAll("/+$", "") : "http://localhost:8080";
        String downloadUrl = (certificateCode != null && !certificateCode.isBlank())
                ? (baseUrl + "/api/certificates/download/code/" + certificateCode)
                : (baseUrl + "/certificates");

        String subject = "🏆 Congratulations! You have unlocked a new KODIFY Certificate — " + safeMilestone;

        String content = """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <div style="background: linear-gradient(135deg, #0081A7 0%%, #00AFB9 100%%); padding: 24px; border-radius: 6px 6px 0 0; text-align: center; color: white;">
                        <h1 style="margin: 0; font-size: 24px;">🏆 New Certificate Unlocked!</h1>
                        <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.95;">Official KODIFY Credential Award</p>
                    </div>
                    <div style="padding: 24px; background: #ffffff; color: #1e293b;">
                        <p style="font-size: 15px;">Congratulations <strong>%s</strong>!</p>
                        <p style="font-size: 14px; line-height: 1.6;">You have achieved the required milestone and unlocked your official <strong>%s</strong> certificate.</p>
                        
                        <table style="width: 100%%; border-collapse: collapse; margin: 18px 0; background: #f8fafc; border-radius: 6px; border: 1.5px solid #e2e8f0; font-size: 13px;">
                            <tr><td style="padding: 10px 14px; color: #64748b; font-weight: bold; width: 140px;">Recipient:</td><td style="padding: 10px 14px; font-weight: bold; color: #1e293b;">%s</td></tr>
                            <tr><td style="padding: 10px 14px; color: #64748b; font-weight: bold;">Category:</td><td style="padding: 10px 14px; font-weight: bold; color: #0081A7;">%s</td></tr>
                            <tr><td style="padding: 10px 14px; color: #64748b; font-weight: bold;">Award / Milestone:</td><td style="padding: 10px 14px; font-weight: bold; color: #15803d;">%s</td></tr>
                            <tr><td style="padding: 10px 14px; color: #64748b; font-weight: bold;">Achievement Credential:</td><td style="padding: 10px 14px; font-weight: bold; color: #1e293b;">%s</td></tr>
                            <tr><td style="padding: 10px 14px; color: #64748b; font-weight: bold;">Date Issued:</td><td style="padding: 10px 14px;">%s</td></tr>
                            <tr><td style="padding: 10px 14px; color: #64748b; font-weight: bold;">Certificate Code:</td><td style="padding: 10px 14px; font-family: monospace; font-weight: bold; color: #475569;">%s</td></tr>
                        </table>

                        <p style="font-size: 13px; color: #475569; line-height: 1.5;">Your verified PDF certificate is ready for download. Click the button below to download your document directly.</p>

                        <div style="text-align: center; margin: 24px 0 16px 0;">
                            <a href="%s" style="background: linear-gradient(135deg, #0081A7 0%%, #00AFB9 100%%); color: #ffffff; text-decoration: none; padding: 14px 34px; font-size: 14px; font-weight: 700; border-radius: 6px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0, 129, 167, 0.25);">
                                DOWNLOAD CERTIFICATE (PDF) &rarr;
                            </a>
                        </div>
                    </div>
                    <div style="text-align: center; font-size: 12px; color: #94a3b8; padding-top: 15px; border-top: 1px solid #e2e8f0;">
                        &copy; %d KODIFY Academic & Assessment Board
                    </div>
                </div>
                """.formatted(safeName, safeCategory, safeName, safeCategory, safeMilestone, safeAchievement, dateStr, certificateCode != null ? certificateCode : "KODIFY-CERT", downloadUrl, LocalDateTime.now().getYear());

        return dispatchEmail(userId, "CERTIFICATE_UNLOCKED", refId, toEmail, subject, content);
    }

    public boolean sendCertificateUnlockedEmail(Long userId, String toEmail, String fullName, String category,
                                                String milestoneName, String certificateCode, Long certificateId) {
        return sendCertificateUnlockedEmail(userId, toEmail, fullName, category, milestoneName, milestoneName, certificateCode, certificateId);
    }

    /**
     * 4j. Support Ticket Raised Email (Event 1)
     */
    public boolean sendTicketRaisedEmail(Long userId, String toEmail, String userName, String ticketNumber,
                                        String subjectText, String category, String priority, String description,
                                        LocalDateTime createdAt, Long ticketId) {
        if (toEmail == null || toEmail.isBlank()) return false;

        String refId = ticketId != null ? String.valueOf(ticketId) : ticketNumber;
        if (userId != null && notificationEventRepo != null) {
            if (notificationEventRepo.existsByUserIdAndTypeAndReferenceId(userId, "TICKET_RAISED", refId)) {
                return true;
            }
        }

        String safeName = (userName != null && !userName.isBlank()) ? userName : "User";
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("MMM dd, yyyy 'at' hh:mm a");
        String dateStr = createdAt != null ? createdAt.format(dtf) : LocalDateTime.now().format(dtf);
        String baseUrl = (appBaseUrl != null && !appBaseUrl.isBlank()) ? appBaseUrl.replaceAll("/+$", "") : "http://localhost:8080";
        String ticketUrl = baseUrl + "/support?ticket=" + (ticketId != null ? ticketId : "");

        String subject = "[#" + ticketNumber + "] Support Ticket Raised: " + subjectText;

        String content = """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <div style="background: linear-gradient(135deg, #0081A7 0%%, #00AFB9 100%%); padding: 22px; border-radius: 6px 6px 0 0; text-align: center; color: white;">
                        <h2 style="margin: 0; font-size: 22px;">Support Ticket Raised ✓</h2>
                        <p style="margin: 5px 0 0 0; font-size: 13px; opacity: 0.95;">KODIFY Helpdesk & Technical Support</p>
                    </div>
                    <div style="padding: 24px; background: #ffffff; color: #1e293b;">
                        <p style="font-size: 15px;">Hello <strong>%s</strong>,</p>
                        <p style="font-size: 14px; line-height: 1.6;">Your support ticket <strong>#%s</strong> has been successfully registered with our support desk. Our team will review it and respond promptly.</p>
                        
                        <table style="width: 100%%; border-collapse: collapse; margin: 16px 0; background: #f8fafc; border-radius: 6px; padding: 10px; border: 1px solid #e2e8f0; font-size: 13px;">
                            <tr><td style="padding: 8px 12px; color: #64748b; font-weight: bold; width: 130px;">Ticket ID:</td><td style="padding: 8px 12px; font-weight: bold; color: #0081A7; font-family: monospace;">#%s</td></tr>
                            <tr><td style="padding: 8px 12px; color: #64748b; font-weight: bold;">Subject:</td><td style="padding: 8px 12px; font-weight: bold; color: #1e293b;">%s</td></tr>
                            <tr><td style="padding: 8px 12px; color: #64748b; font-weight: bold;">Category:</td><td style="padding: 8px 12px;">%s</td></tr>
                            <tr><td style="padding: 8px 12px; color: #64748b; font-weight: bold;">Priority:</td><td style="padding: 8px 12px; font-weight: 600;">%s</td></tr>
                            <tr><td style="padding: 8px 12px; color: #64748b; font-weight: bold;">Status:</td><td style="padding: 8px 12px; font-weight: bold; color: #0284c7;">NEW (Pending Review)</td></tr>
                            <tr><td style="padding: 8px 12px; color: #64748b; font-weight: bold;">Submitted:</td><td style="padding: 8px 12px;">%s</td></tr>
                        </table>

                        <div style="background: #f8fafc; border-left: 4px solid #0081A7; padding: 14px 16px; margin: 18px 0; font-size: 13px; color: #334155; line-height: 1.6;">
                            <strong>Submitted Description:</strong><br/>
                            <div style="margin-top: 6px; white-space: pre-wrap; color: #1e293b;">%s</div>
                        </div>

                        <div style="text-align: center; margin: 24px 0 16px 0;">
                            <a href="%s" style="background: linear-gradient(135deg, #0081A7 0%%, #00AFB9 100%%); color: #ffffff; text-decoration: none; padding: 12px 30px; font-size: 14px; font-weight: 700; border-radius: 6px; display: inline-block;">
                                VIEW TICKET & CONVERSATION &rarr;
                            </a>
                        </div>
                    </div>
                    <div style="text-align: center; font-size: 12px; color: #94a3b8; padding-top: 15px; border-top: 1px solid #e2e8f0;">
                        &copy; %d KODIFY Support Desk &bull; Automated Helpdesk
                    </div>
                </div>
                """.formatted(safeName, ticketNumber, ticketNumber, subjectText, category != null ? category.replace('_', ' ') : "General", priority != null ? priority : "MEDIUM", dateStr, description, ticketUrl, LocalDateTime.now().getYear());

        return dispatchEmail(userId, "TICKET_RAISED", refId, toEmail, subject, content);
    }

    /**
     * 4k. Support Ticket Viewed Email (Event 2)
     */
    public boolean sendTicketViewedEmail(Long userId, String toEmail, String userName, String ticketNumber,
                                        String subjectText, LocalDateTime viewedAt, Long ticketId) {
        if (toEmail == null || toEmail.isBlank()) return false;

        String refId = ticketId != null ? String.valueOf(ticketId) : ticketNumber;
        if (userId != null && notificationEventRepo != null) {
            if (notificationEventRepo.existsByUserIdAndTypeAndReferenceId(userId, "TICKET_VIEWED", refId)) {
                return true;
            }
        }

        String safeName = (userName != null && !userName.isBlank()) ? userName : "User";
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("MMM dd, yyyy 'at' hh:mm a");
        String dateStr = viewedAt != null ? viewedAt.format(dtf) : LocalDateTime.now().format(dtf);
        String baseUrl = (appBaseUrl != null && !appBaseUrl.isBlank()) ? appBaseUrl.replaceAll("/+$", "") : "http://localhost:8080";
        String ticketUrl = baseUrl + "/support?ticket=" + (ticketId != null ? ticketId : "");

        String subject = "[#" + ticketNumber + "] Update: Support Ticket Viewed by KODIFY Support Team";

        String content = """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <div style="background: linear-gradient(135deg, #2563eb 0%%, #3b82f6 100%%); padding: 22px; border-radius: 6px 6px 0 0; text-align: center; color: white;">
                        <h2 style="margin: 0; font-size: 22px;">Ticket Viewed by Support 👁️</h2>
                        <p style="margin: 5px 0 0 0; font-size: 13px; opacity: 0.95;">KODIFY Helpdesk Update</p>
                    </div>
                    <div style="padding: 24px; background: #ffffff; color: #1e293b;">
                        <p style="font-size: 15px;">Hello <strong>%s</strong>,</p>
                        <p style="font-size: 14px; line-height: 1.6;">Your support ticket <strong>#%s</strong> has been opened and reviewed by an administrator / support specialist from the KODIFY team.</p>
                        
                        <table style="width: 100%%; border-collapse: collapse; margin: 16px 0; background: #f8fafc; border-radius: 6px; padding: 10px; border: 1px solid #e2e8f0; font-size: 13px;">
                            <tr><td style="padding: 8px 12px; color: #64748b; font-weight: bold; width: 130px;">Ticket ID:</td><td style="padding: 8px 12px; font-weight: bold; color: #2563eb; font-family: monospace;">#%s</td></tr>
                            <tr><td style="padding: 8px 12px; color: #64748b; font-weight: bold;">Subject:</td><td style="padding: 8px 12px; font-weight: bold; color: #1e293b;">%s</td></tr>
                            <tr><td style="padding: 8px 12px; color: #64748b; font-weight: bold;">Status:</td><td style="padding: 8px 12px; font-weight: bold; color: #3b82f6;">VIEWED & IN TRIAGE</td></tr>
                            <tr><td style="padding: 8px 12px; color: #64748b; font-weight: bold;">Viewed At:</td><td style="padding: 8px 12px;">%s</td></tr>
                        </table>

                        <p style="font-size: 13px; color: #475569; line-height: 1.5;">We are actively looking into your inquiry and will update your ticket thread as soon as an action or solution is available.</p>

                        <div style="text-align: center; margin: 24px 0 16px 0;">
                            <a href="%s" style="background: linear-gradient(135deg, #2563eb 0%%, #3b82f6 100%%); color: #ffffff; text-decoration: none; padding: 12px 30px; font-size: 14px; font-weight: 700; border-radius: 6px; display: inline-block;">
                                VIEW TICKET STATUS &rarr;
                            </a>
                        </div>
                    </div>
                    <div style="text-align: center; font-size: 12px; color: #94a3b8; padding-top: 15px; border-top: 1px solid #e2e8f0;">
                        &copy; %d KODIFY Support Desk &bull; Automated Helpdesk
                    </div>
                </div>
                """.formatted(safeName, ticketNumber, ticketNumber, subjectText, dateStr, ticketUrl, LocalDateTime.now().getYear());

        return dispatchEmail(userId, "TICKET_VIEWED", refId, toEmail, subject, content);
    }

    /**
     * 4l. Support Ticket Resolved Email (Event 3)
     */
    public boolean sendTicketResolvedEmail(Long userId, String toEmail, String userName, String ticketNumber,
                                          String subjectText, String resolutionNotes, LocalDateTime resolvedAt, Long ticketId) {
        if (toEmail == null || toEmail.isBlank()) return false;

        String refId = ticketId != null ? String.valueOf(ticketId) : ticketNumber;
        if (userId != null && notificationEventRepo != null) {
            if (notificationEventRepo.existsByUserIdAndTypeAndReferenceId(userId, "TICKET_RESOLVED", refId)) {
                return true;
            }
        }

        String safeName = (userName != null && !userName.isBlank()) ? userName : "User";
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("MMM dd, yyyy 'at' hh:mm a");
        String dateStr = resolvedAt != null ? resolvedAt.format(dtf) : LocalDateTime.now().format(dtf);
        String baseUrl = (appBaseUrl != null && !appBaseUrl.isBlank()) ? appBaseUrl.replaceAll("/+$", "") : "http://localhost:8080";
        String ticketUrl = baseUrl + "/support?ticket=" + (ticketId != null ? ticketId : "");

        String subject = "[#" + ticketNumber + "] Resolved: Support Ticket — " + subjectText;

        String safeNotes = (resolutionNotes != null && !resolutionNotes.isBlank())
                ? resolutionNotes
                : "The issue has been investigated and marked resolved by our support team.";

        String content = """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <div style="background: linear-gradient(135deg, #16a34a 0%%, #22c55e 100%%); padding: 22px; border-radius: 6px 6px 0 0; text-align: center; color: white;">
                        <h2 style="margin: 0; font-size: 22px;">Support Ticket Resolved 🎯</h2>
                        <p style="margin: 5px 0 0 0; font-size: 13px; opacity: 0.95;">Resolution Confirmed</p>
                    </div>
                    <div style="padding: 24px; background: #ffffff; color: #1e293b;">
                        <p style="font-size: 15px;">Hello <strong>%s</strong>,</p>
                        <p style="font-size: 14px; line-height: 1.6;">Your support ticket <strong>#%s</strong> has been marked as <strong>RESOLVED</strong> by the KODIFY support team.</p>
                        
                        <table style="width: 100%%; border-collapse: collapse; margin: 16px 0; background: #f0fdf4; border-radius: 6px; padding: 10px; border: 1.5px solid #bbf7d0; font-size: 13px;">
                            <tr><td style="padding: 8px 12px; color: #166534; font-weight: bold; width: 130px;">Ticket ID:</td><td style="padding: 8px 12px; font-weight: bold; color: #15803d; font-family: monospace;">#%s</td></tr>
                            <tr><td style="padding: 8px 12px; color: #166534; font-weight: bold;">Subject:</td><td style="padding: 8px 12px; font-weight: bold; color: #1e293b;">%s</td></tr>
                            <tr><td style="padding: 8px 12px; color: #166534; font-weight: bold;">Final Status:</td><td style="padding: 8px 12px; font-weight: 900; color: #16a34a;">✓ RESOLVED</td></tr>
                            <tr><td style="padding: 8px 12px; color: #166534; font-weight: bold;">Resolved Date:</td><td style="padding: 8px 12px;">%s</td></tr>
                        </table>

                        <div style="background: #f8fafc; border-left: 4px solid #16a34a; padding: 14px 16px; margin: 18px 0; font-size: 13px; color: #334155; line-height: 1.6;">
                            <strong>Resolution Details:</strong><br/>
                            <div style="margin-top: 6px; white-space: pre-wrap; color: #1e293b;">%s</div>
                        </div>

                        <p style="font-size: 13px; color: #475569;">If you have further questions or require additional assistance, you can reopen or reply directly on the ticket thread.</p>

                        <div style="text-align: center; margin: 24px 0 16px 0;">
                            <a href="%s" style="background: linear-gradient(135deg, #16a34a 0%%, #22c55e 100%%); color: #ffffff; text-decoration: none; padding: 12px 30px; font-size: 14px; font-weight: 700; border-radius: 6px; display: inline-block;">
                                VIEW RESOLVED TICKET &rarr;
                            </a>
                        </div>
                    </div>
                    <div style="text-align: center; font-size: 12px; color: #94a3b8; padding-top: 15px; border-top: 1px solid #e2e8f0;">
                        &copy; %d KODIFY Support Desk &bull; Automated Helpdesk
                    </div>
                </div>
                """.formatted(safeName, ticketNumber, ticketNumber, subjectText, dateStr, safeNotes, ticketUrl, LocalDateTime.now().getYear());

        return dispatchEmail(userId, "TICKET_RESOLVED", refId, toEmail, subject, content);
    }

    /**
     * 4m. Support Ticket Closed Email (Event 4)
     */
    public boolean sendTicketClosedEmail(Long userId, String toEmail, String userName, String ticketNumber,
                                       String subjectText, LocalDateTime closedAt, Long ticketId) {
        if (toEmail == null || toEmail.isBlank()) return false;

        String refId = ticketId != null ? String.valueOf(ticketId) : ticketNumber;
        if (userId != null && notificationEventRepo != null) {
            if (notificationEventRepo.existsByUserIdAndTypeAndReferenceId(userId, "TICKET_CLOSED", refId)) {
                return true;
            }
        }

        String safeName = (userName != null && !userName.isBlank()) ? userName : "User";
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("MMM dd, yyyy 'at' hh:mm a");
        String dateStr = closedAt != null ? closedAt.format(dtf) : LocalDateTime.now().format(dtf);
        String baseUrl = (appBaseUrl != null && !appBaseUrl.isBlank()) ? appBaseUrl.replaceAll("/+$", "") : "http://localhost:8080";
        String supportHistoryUrl = baseUrl + "/support";

        String subject = "[#" + ticketNumber + "] Closed: Support Ticket — " + subjectText;

        String content = """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <div style="background: linear-gradient(135deg, #475569 0%%, #64748b 100%%); padding: 22px; border-radius: 6px 6px 0 0; text-align: center; color: white;">
                        <h2 style="margin: 0; font-size: 22px;">Support Ticket Closed 📁</h2>
                        <p style="margin: 5px 0 0 0; font-size: 13px; opacity: 0.95;">Archive & History Confirmation</p>
                    </div>
                    <div style="padding: 24px; background: #ffffff; color: #1e293b;">
                        <p style="font-size: 15px;">Hello <strong>%s</strong>,</p>
                        <p style="font-size: 14px; line-height: 1.6;">Your support ticket <strong>#%s</strong> has been officially marked as <strong>CLOSED</strong> and archived in your ticket history.</p>
                        
                        <table style="width: 100%%; border-collapse: collapse; margin: 16px 0; background: #f8fafc; border-radius: 6px; padding: 10px; border: 1px solid #e2e8f0; font-size: 13px;">
                            <tr><td style="padding: 8px 12px; color: #64748b; font-weight: bold; width: 130px;">Ticket ID:</td><td style="padding: 8px 12px; font-weight: bold; color: #475569; font-family: monospace;">#%s</td></tr>
                            <tr><td style="padding: 8px 12px; color: #64748b; font-weight: bold;">Subject:</td><td style="padding: 8px 12px; font-weight: bold; color: #1e293b;">%s</td></tr>
                            <tr><td style="padding: 8px 12px; color: #64748b; font-weight: bold;">Final Status:</td><td style="padding: 8px 12px; font-weight: bold; color: #64748b;">CLOSED</td></tr>
                            <tr><td style="padding: 8px 12px; color: #64748b; font-weight: bold;">Closed At:</td><td style="padding: 8px 12px;">%s</td></tr>
                        </table>

                        <p style="font-size: 13px; color: #475569; line-height: 1.5;">Thank you for helping us maintain KODIFY's quality and performance. If you ever experience any other issues, you are welcome to open a new ticket anytime.</p>

                        <div style="text-align: center; margin: 24px 0 16px 0;">
                            <a href="%s" style="background: linear-gradient(135deg, #475569 0%%, #64748b 100%%); color: #ffffff; text-decoration: none; padding: 12px 30px; font-size: 14px; font-weight: 700; border-radius: 6px; display: inline-block;">
                                VIEW SUPPORT HISTORY &rarr;
                            </a>
                        </div>
                    </div>
                    <div style="text-align: center; font-size: 12px; color: #94a3b8; padding-top: 15px; border-top: 1px solid #e2e8f0;">
                        &copy; %d KODIFY Support Desk &bull; Automated Helpdesk
                    </div>
                </div>
                """.formatted(safeName, ticketNumber, ticketNumber, subjectText, dateStr, supportHistoryUrl, LocalDateTime.now().getYear());

        return dispatchEmail(userId, "TICKET_CLOSED", refId, toEmail, subject, content);
    }

    /**
     * 5. Assignment Invitation Email with Unique 6-Digit Code
     */
    public boolean sendAssignmentInvitationEmail(Long userId, String toEmail, String participantName,
                                                 String assignmentTitle, String orgName,
                                                 LocalDateTime startTime, LocalDateTime dueDate,
                                                 Integer durationMinutes, String verificationCode,
                                                 String guidelines, Long assignmentId) {
        if (toEmail == null || toEmail.isBlank()) return false;

        String safeParticipant = (participantName != null && !participantName.isBlank()) ? participantName : "Participant";
        String safeOrg = (orgName != null && !orgName.isBlank()) ? orgName : "KODIFY Assessment";
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("MMM dd, yyyy HH:mm");
        String dateStr = startTime != null ? startTime.format(DateTimeFormatter.ofPattern("MMM dd, yyyy")) : "Immediate";
        String startStr = startTime != null ? startTime.format(dtf) : "Immediate";
        String dueStr = dueDate != null ? dueDate.format(dtf) : "Open / No Deadline";
        int duration = durationMinutes != null ? durationMinutes : 60;
        String safeGuidelines = (guidelines != null && !guidelines.isBlank())
                ? guidelines
                : "Ensure you are in a quiet room with a working webcam for proctoring. Tab-switching and clipboard access are monitored.";

        String subject = "KODIFY Assignment Invitation — " + assignmentTitle;

        String baseUrl = (appBaseUrl != null && !appBaseUrl.isBlank()) ? appBaseUrl.replaceAll("/+$", "") : "http://localhost:8080";
        String enterUrl = (assignmentId != null) ? (baseUrl + "/assignments/enter/" + assignmentId) : (baseUrl + "/assignments");

        String plainText = """
                KODIFY ASSESSMENT INVITATION
                =============================
                Hello %s,

                You have been invited to attend an online coding assessment on KODIFY.

                Assessment: %s
                Organization: %s
                Date: %s
                Time Window: %s to %s
                Duration: %d Minutes

                YOUR VERIFICATION CODE: %s
                (Keep this code private and enter it upon entering the portal)

                Guidelines:
                %s

                ENTER ASSIGNMENT:
                %s

                -----------------------------------------
                (c) %d KODIFY Assessment Platform - Automated Integrity System
                """.formatted(safeParticipant, assignmentTitle, safeOrg, dateStr, startStr, dueStr, duration, verificationCode, safeGuidelines, enterUrl, LocalDateTime.now().getYear());

        String htmlContent = """
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>KODIFY Assignment Invitation</title>
                </head>
                <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
                  <table width="100%%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 24px 12px;">
                    <tr>
                      <td align="center">
                        <table width="100%%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                          
                          <!-- Header -->
                          <tr>
                            <td style="background: linear-gradient(135deg, #005f73 0%%, #0a9396 100%%); padding: 28px 24px; text-align: center; color: #ffffff;">
                              <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 2px; font-family: Georgia, serif;">KODIFY</h1>
                              <p style="margin: 6px 0 0 0; font-size: 13px; letter-spacing: 1px; text-transform: uppercase; opacity: 0.9; font-weight: 600;">Secure Assessment Invitation</p>
                            </td>
                          </tr>

                          <!-- Subtle Wave Accent Bar -->
                          <tr>
                            <td style="height: 4px; background: linear-gradient(90deg, #ee9b00 0%%, #ca6702 50%%, #9b2226 100%%); line-height: 4px; font-size: 4px;">&nbsp;</td>
                          </tr>

                          <!-- Main Body -->
                          <tr>
                            <td style="padding: 28px 24px; color: #1e293b;">
                              <p style="font-size: 16px; margin: 0 0 12px 0; color: #0f172a;">Hello <strong>%s</strong>,</p>
                              <p style="font-size: 14px; line-height: 1.6; margin: 0 0 20px 0; color: #475569;">
                                You have been invited to participate in a proctored coding assessment on <strong>KODIFY</strong>.
                              </p>

                              <!-- Metadata Table -->
                              <table width="100%%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin: 0 0 22px 0; font-size: 13px;">
                                <tr>
                                  <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: 600; width: 120px;">Assessment</td>
                                  <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #005f73;">%s</td>
                                </tr>
                                <tr>
                                  <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: 600;">Organization</td>
                                  <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #334155;">%s</td>
                                </tr>
                                <tr>
                                  <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: 600;">Date</td>
                                  <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #334155;">%s</td>
                                </tr>
                                <tr>
                                  <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: 600;">Time Window</td>
                                  <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #334155;">%s &ndash; %s</td>
                                </tr>
                                <tr>
                                  <td style="padding: 10px 14px; color: #64748b; font-weight: 600;">Duration</td>
                                  <td style="padding: 10px 14px; font-weight: 700; color: #0a9396;">%d Minutes</td>
                                </tr>
                              </table>

                              <!-- Verification Code Badge -->
                              <table width="100%%" border="0" cellspacing="0" cellpadding="0" style="margin: 0 0 22px 0;">
                                <tr>
                                  <td style="background-color: #f0fdf4; border: 2px dashed #16a34a; border-radius: 8px; padding: 18px; text-align: center;">
                                    <div style="font-size: 11px; font-weight: 800; color: #166534; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">
                                      CANDIDATE ACCESS VERIFICATION CODE
                                    </div>
                                    <div style="font-size: 32px; font-weight: 900; color: #15803d; letter-spacing: 8px; font-family: 'Courier New', monospace; margin: 4px 0 8px 0;">
                                      %s
                                    </div>
                                    <div style="font-size: 12px; color: #475569;">
                                      Present this code on the assessment entry screen to unlock your test.
                                    </div>
                                  </td>
                                </tr>
                              </table>

                              <!-- Guidelines Box -->
                              <div style="background-color: #f8fafc; border-left: 4px solid #005f73; border-radius: 0 6px 6px 0; padding: 14px 16px; margin: 0 0 24px 0; font-size: 13px; color: #334155; line-height: 1.5;">
                                <strong style="color: #0f172a; display: block; margin-bottom: 4px;">Assessment Guidelines:</strong>
                                %s
                              </div>

                              <!-- CTA Button -->
                              <div style="text-align: center; margin: 24px 0 16px 0;">
                                <a href="%s" style="background: linear-gradient(135deg, #0081A7 0%%, #00AFB9 100%%); color: #ffffff; text-decoration: none; padding: 14px 34px; font-size: 15px; font-weight: 700; border-radius: 6px; display: inline-block; letter-spacing: 0.5px; box-shadow: 0 4px 6px -1px rgba(0, 129, 167, 0.25);">
                                  ENTER ASSIGNMENT &rarr;
                                </a>
                              </div>

                              <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 12px 0 0 0; line-height: 1.4;">
                                If the button above does not work, copy and paste this link into your browser:<br/>
                                <span style="word-break: break-all; color: #0081A7;">%s</span>
                              </p>
                            </td>
                          </tr>

                          <!-- Footer -->
                          <tr>
                            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; text-align: center; font-size: 12px; color: #94a3b8;">
                              &copy; %d KODIFY Assessment Platform &bull; Automated Integrity & Proctoring
                            </td>
                          </tr>

                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """.formatted(
                        safeParticipant,
                        assignmentTitle,
                        safeOrg,
                        dateStr,
                        startStr,
                        dueStr,
                        duration,
                        verificationCode,
                        safeGuidelines,
                        enterUrl,
                        enterUrl,
                        LocalDateTime.now().getYear()
                );

        String refId = assignmentId != null ? String.valueOf(assignmentId) : assignmentTitle;
        return dispatchEmail(userId, "ASSIGNMENT_INVITED", refId, toEmail, subject, plainText, htmlContent);
    }

    // Backwards-compatible overload
    public boolean sendAssignmentInvitationEmail(String toEmail, String assignmentTitle, String orgName,
                                                 LocalDateTime startTime, LocalDateTime dueDate,
                                                 Integer durationMinutes, String accessCode) {
        return sendAssignmentInvitationEmail(null, toEmail, "Participant", assignmentTitle, orgName, startTime, dueDate, durationMinutes, accessCode, null, null);
    }

    public boolean sendCreatorDecisionEmail(String toEmail, String fullName, boolean approved, String adminComment) {
        return sendCreatorVerificationDecisionEmail(toEmail, fullName, approved, adminComment);
    }

    public boolean sendProblemSolvedEmail(String toEmail, Long problemId, String problemTitle,
                                          String language, Double runtime, int passedTests, int totalTests) {
        if (toEmail == null || toEmail.isBlank()) return false;
        String safeRuntime = runtime != null ? String.format("%.3fs", runtime) : "0.012s";
        String subject = "KODIFY Problem Solved: #" + problemId + " — " + problemTitle;
        String content = """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <div style="background: #059669; padding: 15px; border-radius: 6px 6px 0 0; text-align: center; color: white;">
                        <h2 style="margin: 0; font-size: 22px;">🎉 Problem Solved</h2>
                    </div>
                    <div style="padding: 20px; background: #ffffff; color: #1e293b;">
                        <p style="font-size: 15px;">You have successfully solved <strong>#%d — %s</strong> on KODIFY.</p>
                        <table style="width: 100%%; border-collapse: collapse; margin: 15px 0; background: #f8fafc; border-radius: 6px; padding: 10px;">
                            <tr><td style="padding: 8px 12px; color: #64748b; font-weight: bold;">Status:</td><td style="padding: 8px 12px; color: #16a34a; font-weight: bold;">ACCEPTED ✓</td></tr>
                            <tr><td style="padding: 8px 12px; color: #64748b; font-weight: bold;">Language:</td><td style="padding: 8px 12px; font-weight: bold; font-family: monospace;">%s</td></tr>
                            <tr><td style="padding: 8px 12px; color: #64748b; font-weight: bold;">Execution Time:</td><td style="padding: 8px 12px;">%s</td></tr>
                            <tr><td style="padding: 8px 12px; color: #64748b; font-weight: bold;">Test Cases Passed:</td><td style="padding: 8px 12px; font-weight: bold;">%d / %d</td></tr>
                        </table>
                    </div>
                    <div style="text-align: center; font-size: 12px; color: #94a3b8; padding-top: 15px; border-top: 1px solid #e2e8f0;">
                        &copy; %d KODIFY Platform
                    </div>
                </div>
                """.formatted(problemId, problemTitle, language != null ? language : "Python", safeRuntime, passedTests, totalTests, LocalDateTime.now().getYear());

        return dispatchEmail(null, "PROBLEM_ACCEPTED", String.valueOf(problemId), toEmail, subject, content);
    }

    public boolean sendProblemSolvedEmail(String toEmail, String username, String problemTitle, String difficulty) {
        if (toEmail == null || toEmail.isBlank()) return false;
        String subject = "KODIFY Problem Solved: " + problemTitle;
        String content = """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <div style="background: #059669; padding: 15px; border-radius: 6px 6px 0 0; text-align: center; color: white;">
                        <h2 style="margin: 0; font-size: 22px;">🎉 Problem Solved</h2>
                    </div>
                    <div style="padding: 20px; background: #ffffff; color: #1e293b;">
                        <p style="font-size: 15px;">Hello <strong>%s</strong>, you have successfully solved <strong>%s</strong> [%s] on KODIFY.</p>
                        <p style="font-size: 13px; color: #64748b;">Keep up the algorithmic momentum! Continue practicing or compete in upcoming contests.</p>
                    </div>
                    <div style="text-align: center; font-size: 12px; color: #94a3b8; padding-top: 15px; border-top: 1px solid #e2e8f0;">
                        &copy; %d KODIFY Platform
                    </div>
                </div>
                """.formatted(username != null ? username : "Coder", problemTitle, difficulty != null ? difficulty : "Medium", LocalDateTime.now().getYear());
        return dispatchEmail(null, "PROBLEM_ACCEPTED", problemTitle, toEmail, subject, content);
    }

    /**
     * SUPPORT TICKET EMAILS (Events 1 - 4)
     */
    public boolean sendTicketRaisedEmail(User user, String ticketNumber, String subject, String description, String category, Long ticketId) {
        if (user == null || user.getEmail() == null || user.getEmail().isBlank()) return false;
        String userName = user.getName() != null ? user.getName() : user.getUsername();
        return sendTicketRaisedEmail(user.getId(), user.getEmail(), userName, ticketNumber, subject, description, category, ticketId);
    }

    public boolean sendTicketRaisedEmail(Long userId, String toEmail, String userName, String ticketNumber, String ticketSubject, String description, String category, Long ticketId) {
        if (toEmail == null || toEmail.isBlank()) return false;
        String refId = ticketId != null ? String.valueOf(ticketId) : ticketNumber;
        if (userId != null && notificationEventRepo != null) {
            if (notificationEventRepo.existsByUserIdAndTypeAndReferenceId(userId, "TICKET_RAISED", refId)) {
                log.info("Ticket raised email already dispatched for ticket {}. Skipping duplicate.", refId);
                return true;
            }
        }
        String safeName = (userName != null && !userName.isBlank()) ? userName : "User";
        String safeCat = (category != null && !category.isBlank()) ? category : "General Support";
        String baseUrl = (appBaseUrl != null && !appBaseUrl.isBlank()) ? appBaseUrl.replaceAll("/+$", "") : "http://localhost:8080";
        String ticketUrl = baseUrl + "/support?ticket=" + (ticketId != null ? ticketId : "");

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("MMM dd, yyyy HH:mm");
        String timeStr = LocalDateTime.now().format(dtf);

        String subject = "Support Ticket Raised #" + ticketNumber + " — " + ticketSubject;
        String content = """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <div style="background: linear-gradient(135deg, #0081A7 0%%, #00AFB9 100%%); padding: 20px; border-radius: 6px 6px 0 0; text-align: center; color: white;">
                        <h2 style="margin: 0; font-size: 22px;">Support Ticket Raised</h2>
                        <p style="margin: 5px 0 0 0; font-size: 13px; opacity: 0.9;">Ticket #%s</p>
                    </div>
                    <div style="padding: 24px; background: #ffffff; color: #1e293b;">
                        <p style="font-size: 15px;">Hello <strong>%s</strong>,</p>
                        <p style="font-size: 14px; line-height: 1.6;">Your support ticket has been successfully raised. Our support desk team will review your inquiry shortly.</p>
                        
                        <table style="width: 100%%; border-collapse: collapse; margin: 16px 0; background: #f8fafc; border-radius: 6px; padding: 10px; border: 1px solid #e2e8f0; font-size: 13px;">
                            <tr><td style="padding: 8px 12px; color: #64748b; font-weight: bold; width: 120px;">Ticket ID:</td><td style="padding: 8px 12px; font-weight: bold; color: #0081A7;">#%s</td></tr>
                            <tr><td style="padding: 8px 12px; color: #64748b; font-weight: bold;">Subject:</td><td style="padding: 8px 12px; font-weight: 600;">%s</td></tr>
                            <tr><td style="padding: 8px 12px; color: #64748b; font-weight: bold;">Category:</td><td style="padding: 8px 12px;">%s</td></tr>
                            <tr><td style="padding: 8px 12px; color: #64748b; font-weight: bold;">Submitted:</td><td style="padding: 8px 12px;">%s (IST)</td></tr>
                            <tr><td style="padding: 8px 12px; color: #64748b; font-weight: bold;">Status:</td><td style="padding: 8px 12px; color: #0284c7; font-weight: bold;">NEW</td></tr>
                        </table>

                        <div style="background: #f1f5f9; border-left: 4px solid #0081A7; padding: 12px 16px; margin: 16px 0; font-size: 13px; color: #334155; line-height: 1.5; word-break: break-word;">
                            <strong>Submitted Description:</strong><br/>
                            %s
                        </div>

                        <div style="text-align: center; margin: 24px 0 16px 0;">
                            <a href="%s" style="background: linear-gradient(135deg, #0081A7 0%%, #00AFB9 100%%); color: #ffffff; text-decoration: none; padding: 12px 28px; font-size: 14px; font-weight: 700; border-radius: 6px; display: inline-block;">
                                VIEW TICKET & CONVERSATION &rarr;
                            </a>
                        </div>
                    </div>
                    <div style="text-align: center; font-size: 12px; color: #94a3b8; padding-top: 15px; border-top: 1px solid #e2e8f0;">
                        &copy; %d KODIFY Support Desk &bull; We are here to help
                    </div>
                </div>
                """.formatted(ticketNumber, safeName, ticketNumber, ticketSubject, safeCat, timeStr, description != null ? description : "", ticketUrl, LocalDateTime.now().getYear());

        return dispatchEmail(userId, "TICKET_RAISED", refId, toEmail, subject, content);
    }

    public boolean sendTicketViewedEmail(User user, String ticketNumber, String subject, Long ticketId) {
        if (user == null || user.getEmail() == null || user.getEmail().isBlank()) return false;
        String userName = user.getName() != null ? user.getName() : user.getUsername();
        return sendTicketViewedEmail(user.getId(), user.getEmail(), userName, ticketNumber, subject, ticketId);
    }

    public boolean sendTicketViewedEmail(Long userId, String toEmail, String userName, String ticketNumber, String ticketSubject, Long ticketId) {
        if (toEmail == null || toEmail.isBlank()) return false;
        String refId = ticketId != null ? String.valueOf(ticketId) : ticketNumber;
        if (userId != null && notificationEventRepo != null) {
            if (notificationEventRepo.existsByUserIdAndTypeAndReferenceId(userId, "TICKET_VIEWED", refId)) {
                return true;
            }
        }
        String safeName = (userName != null && !userName.isBlank()) ? userName : "User";
        String baseUrl = (appBaseUrl != null && !appBaseUrl.isBlank()) ? appBaseUrl.replaceAll("/+$", "") : "http://localhost:8080";
        String ticketUrl = baseUrl + "/support?ticket=" + (ticketId != null ? ticketId : "");

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("MMM dd, yyyy HH:mm");
        String timeStr = LocalDateTime.now().format(dtf);

        String subject = "Support Ticket #" + ticketNumber + " Viewed by Support Team";
        String content = """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <div style="background: linear-gradient(135deg, #3b82f6 0%%, #60a5fa 100%%); padding: 20px; border-radius: 6px 6px 0 0; text-align: center; color: white;">
                        <h2 style="margin: 0; font-size: 22px;">Ticket Under Review 🔍</h2>
                        <p style="margin: 5px 0 0 0; font-size: 13px; opacity: 0.9;">Ticket #%s</p>
                    </div>
                    <div style="padding: 24px; background: #ffffff; color: #1e293b;">
                        <p style="font-size: 15px;">Hello <strong>%s</strong>,</p>
                        <p style="font-size: 14px; line-height: 1.6;">Your support ticket <strong>#%s: %s</strong> has been viewed and is actively being reviewed by the KODIFY Support Team at <strong>%s</strong>.</p>
                        
                        <div style="text-align: center; margin: 24px 0 16px 0;">
                            <a href="%s" style="background: #3b82f6; color: #ffffff; text-decoration: none; padding: 12px 28px; font-size: 14px; font-weight: 700; border-radius: 6px; display: inline-block;">
                                VIEW CONVERSATION &rarr;
                            </a>
                        </div>
                    </div>
                    <div style="text-align: center; font-size: 12px; color: #94a3b8; padding-top: 15px; border-top: 1px solid #e2e8f0;">
                        &copy; %d KODIFY Support Desk
                    </div>
                </div>
                """.formatted(ticketNumber, safeName, ticketNumber, ticketSubject, timeStr, ticketUrl, LocalDateTime.now().getYear());

        return dispatchEmail(userId, "TICKET_VIEWED", refId, toEmail, subject, content);
    }

    public boolean sendTicketResolvedEmail(User user, String ticketNumber, String subject, String resolutionMessage, Long ticketId) {
        if (user == null || user.getEmail() == null || user.getEmail().isBlank()) return false;
        String userName = user.getName() != null ? user.getName() : user.getUsername();
        return sendTicketResolvedEmail(user.getId(), user.getEmail(), userName, ticketNumber, subject, resolutionMessage, ticketId);
    }

    public boolean sendTicketResolvedEmail(Long userId, String toEmail, String userName, String ticketNumber, String ticketSubject, String resolutionMessage, Long ticketId) {
        if (toEmail == null || toEmail.isBlank()) return false;
        String refId = ticketId != null ? String.valueOf(ticketId) : ticketNumber;
        if (userId != null && notificationEventRepo != null) {
            if (notificationEventRepo.existsByUserIdAndTypeAndReferenceId(userId, "TICKET_RESOLVED", refId)) {
                return true;
            }
        }
        String safeName = (userName != null && !userName.isBlank()) ? userName : "User";
        String baseUrl = (appBaseUrl != null && !appBaseUrl.isBlank()) ? appBaseUrl.replaceAll("/+$", "") : "http://localhost:8080";
        String ticketUrl = baseUrl + "/support?ticket=" + (ticketId != null ? ticketId : "");

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("MMM dd, yyyy HH:mm");
        String timeStr = LocalDateTime.now().format(dtf);

        String subject = "Support Ticket Resolved #" + ticketNumber + " — " + ticketSubject;
        String content = """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <div style="background: linear-gradient(135deg, #10b981 0%%, #059669 100%%); padding: 20px; border-radius: 6px 6px 0 0; text-align: center; color: white;">
                        <h2 style="margin: 0; font-size: 22px;">Ticket Resolved ✓</h2>
                        <p style="margin: 5px 0 0 0; font-size: 13px; opacity: 0.9;">Ticket #%s</p>
                    </div>
                    <div style="padding: 24px; background: #ffffff; color: #1e293b;">
                        <p style="font-size: 15px;">Hello <strong>%s</strong>,</p>
                        <p style="font-size: 14px; line-height: 1.6;">Your support ticket <strong>#%s: %s</strong> has been resolved by our team.</p>
                        
                        %s

                        <div style="text-align: center; margin: 24px 0 16px 0;">
                            <a href="%s" style="background: #10b981; color: #ffffff; text-decoration: none; padding: 12px 28px; font-size: 14px; font-weight: 700; border-radius: 6px; display: inline-block;">
                                VIEW RESOLUTION & TICKET &rarr;
                            </a>
                        </div>
                    </div>
                    <div style="text-align: center; font-size: 12px; color: #94a3b8; padding-top: 15px; border-top: 1px solid #e2e8f0;">
                        &copy; %d KODIFY Support Desk &bull; Resolved at %s
                    </div>
                </div>
                """.formatted(ticketNumber, safeName, ticketNumber, ticketSubject,
                (resolutionMessage != null && !resolutionMessage.isBlank())
                        ? "<div style=\"background: #f0fdf4; border-left: 4px solid #10b981; padding: 12px 16px; margin: 16px 0; font-size: 13px; color: #065f46;\"><strong>Resolution Note:</strong><br/>" + resolutionMessage + "</div>"
                        : "",
                ticketUrl, LocalDateTime.now().getYear(), timeStr);

        return dispatchEmail(userId, "TICKET_RESOLVED", refId, toEmail, subject, content);
    }

    public boolean sendTicketClosedEmail(User user, String ticketNumber, String subject, Long ticketId) {
        if (user == null || user.getEmail() == null || user.getEmail().isBlank()) return false;
        String userName = user.getName() != null ? user.getName() : user.getUsername();
        return sendTicketClosedEmail(user.getId(), user.getEmail(), userName, ticketNumber, subject, ticketId);
    }

    public boolean sendTicketClosedEmail(Long userId, String toEmail, String userName, String ticketNumber, String ticketSubject, Long ticketId) {
        if (toEmail == null || toEmail.isBlank()) return false;
        String refId = ticketId != null ? String.valueOf(ticketId) : ticketNumber;
        if (userId != null && notificationEventRepo != null) {
            if (notificationEventRepo.existsByUserIdAndTypeAndReferenceId(userId, "TICKET_CLOSED", refId)) {
                return true;
            }
        }
        String safeName = (userName != null && !userName.isBlank()) ? userName : "User";
        String baseUrl = (appBaseUrl != null && !appBaseUrl.isBlank()) ? appBaseUrl.replaceAll("/+$", "") : "http://localhost:8080";
        String ticketUrl = baseUrl + "/support?ticket=" + (ticketId != null ? ticketId : "");

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("MMM dd, yyyy HH:mm");
        String timeStr = LocalDateTime.now().format(dtf);

        String subject = "Support Ticket Closed #" + ticketNumber + " — " + ticketSubject;
        String content = """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <div style="background: linear-gradient(135deg, #64748b 0%%, #475569 100%%); padding: 20px; border-radius: 6px 6px 0 0; text-align: center; color: white;">
                        <h2 style="margin: 0; font-size: 22px;">Ticket Closed</h2>
                        <p style="margin: 5px 0 0 0; font-size: 13px; opacity: 0.9;">Ticket #%s</p>
                    </div>
                    <div style="padding: 24px; background: #ffffff; color: #1e293b;">
                        <p style="font-size: 15px;">Hello <strong>%s</strong>,</p>
                        <p style="font-size: 14px; line-height: 1.6;">Your support ticket <strong>#%s: %s</strong> has been closed at <strong>%s</strong>.</p>
                        <p style="font-size: 13px; color: #64748b;">If you need any further assistance, you can raise a new ticket at any time through the support portal.</p>
                        
                        <div style="text-align: center; margin: 24px 0 16px 0;">
                            <a href="%s" style="background: #64748b; color: #ffffff; text-decoration: none; padding: 12px 28px; font-size: 14px; font-weight: 700; border-radius: 6px; display: inline-block;">
                                VIEW TICKET HISTORY &rarr;
                            </a>
                        </div>
                    </div>
                    <div style="text-align: center; font-size: 12px; color: #94a3b8; padding-top: 15px; border-top: 1px solid #e2e8f0;">
                        &copy; %d KODIFY Support Desk
                    </div>
                </div>
                """.formatted(ticketNumber, safeName, ticketNumber, ticketSubject, timeStr, ticketUrl, LocalDateTime.now().getYear());

        return dispatchEmail(userId, "TICKET_CLOSED", refId, toEmail, subject, content);
    }

    private boolean dispatchEmail(Long userId, String type, String referenceId, String to, String subject, String htmlContent) {
        return dispatchEmail(userId, type, referenceId, to, subject, null, htmlContent);
    }

    private boolean dispatchEmail(Long userId, String type, String referenceId, String to, String subject, String plainText, String htmlContent) {
        log.info("Dispatching Email [{}] | To: {} | Subject: {}", type, to, subject);

        String status = "SIMULATED";
        boolean sent = false;

        if (mailSender == null) {
            log.info("Live SMTP not configured. Email simulated successfully for {}.", to);
            status = "SIMULATED";
            sent = true;
        } else {
            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
                helper.setFrom(fromAddress != null ? fromAddress : "noreply@kodify.dev");
                helper.setTo(to);
                helper.setSubject(subject);
                if (plainText != null && !plainText.isBlank()) {
                    helper.setText(plainText, htmlContent);
                } else {
                    helper.setText(htmlContent, true);
                }

                mailSender.send(message);
                log.info("Email successfully sent via SMTP to {}", to);
                status = "SENT";
                sent = true;
            } catch (MessagingException | RuntimeException e) {
                log.warn("Could not dispatch live email to {} via SMTP ({}). Recorded in notification log.", to, e.getMessage());
                status = "FAILED";
                sent = false;
            }
        }

        // Record notification event history
        if (notificationEventRepo != null) {
            try {
                NotificationEvent event = new NotificationEvent(
                        userId,
                        type,
                        referenceId,
                        to,
                        subject,
                        status
                    );
                notificationEventRepo.save(event);
            } catch (Exception e) {
                log.warn("Could not persist notification event record: {}", e.getMessage());
            }
        }

        return sent || "SIMULATED".equals(status);
    }
}
