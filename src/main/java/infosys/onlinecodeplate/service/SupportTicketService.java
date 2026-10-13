package infosys.onlinecodeplate.service;

import infosys.onlinecodeplate.dto.AppDtos.*;
import infosys.onlinecodeplate.entity.Role;
import infosys.onlinecodeplate.entity.SupportTicket;
import infosys.onlinecodeplate.entity.SupportTicketMessage;
import infosys.onlinecodeplate.entity.User;
import infosys.onlinecodeplate.repository.SupportTicketMessageRepository;
import infosys.onlinecodeplate.repository.SupportTicketRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SupportTicketService {

    private final SupportTicketRepository ticketRepo;
    private final SupportTicketMessageRepository messageRepo;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private static final SecureRandom RANDOM = new SecureRandom();

    public SupportTicketService(SupportTicketRepository ticketRepo,
                                SupportTicketMessageRepository messageRepo,
                                NotificationService notificationService,
                                EmailService emailService) {
        this.ticketRepo = ticketRepo;
        this.messageRepo = messageRepo;
        this.notificationService = notificationService;
        this.emailService = emailService;
    }

    private String generateTicketNumber() {
        int code = 1000 + RANDOM.nextInt(9000);
        return "KDF-" + code;
    }

    @Transactional
    public SupportTicketDto createTicket(SupportTicketRequestDto req, User user) {
        if (user == null) {
            throw new RuntimeException("User must be authenticated to create a support ticket.");
        }
        if (req.getSubject() == null || req.getSubject().isBlank()) {
            throw new RuntimeException("Ticket subject cannot be blank.");
        }
        if (req.getDescription() == null || req.getDescription().isBlank()) {
            throw new RuntimeException("Ticket description cannot be blank.");
        }

        String ticketNumber = generateTicketNumber();
        while (ticketRepo.findByTicketNumber(ticketNumber).isPresent()) {
            ticketNumber = generateTicketNumber();
        }

        SupportTicket ticket = new SupportTicket(
                ticketNumber,
                user,
                req.getSubject().trim(),
                req.getCategory() != null ? req.getCategory().trim().toUpperCase() : "QUERY",
                req.getPriority() != null ? req.getPriority().trim().toUpperCase() : "MEDIUM",
                req.getDescription().trim(),
                req.getRating()
        );
        ticket = ticketRepo.save(ticket);

        // Save initial message as first entry in thread
        SupportTicketMessage msg = new SupportTicketMessage(
                ticket,
                user,
                "USER",
                req.getDescription().trim()
        );
        messageRepo.save(msg);

        // Confirmation notification to user
        notificationService.createNotification(
                user,
                "Ticket Submitted",
                "Your support ticket #" + ticket.getTicketNumber() + " has been submitted successfully.",
                "SUPPORT_CREATED",
                "/support?ticket=" + ticket.getId()
        );

        // Send Ticket Raised Email (Event 1)
        emailService.sendTicketRaisedEmail(
                user,
                ticket.getTicketNumber(),
                ticket.getSubject(),
                ticket.getDescription(),
                ticket.getCategory(),
                ticket.getId()
        );

        return mapToDto(ticket, true);
    }

    @Transactional(readOnly = true)
    public List<SupportTicketDto> getMyTickets(User user) {
        if (user == null) {
            throw new RuntimeException("User must be authenticated.");
        }
        return ticketRepo.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(t -> mapToDto(t, false))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SupportTicketDto> getAllTicketsForAdmin() {
        return ticketRepo.findAllOrderByPriorityAndCreatedAt()
                .stream()
                .map(t -> mapToDto(t, false))
                .collect(Collectors.toList());
    }

    @Transactional
    public SupportTicketDto getTicketDetail(Long ticketId, User user) {
        SupportTicket ticket = ticketRepo.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Support ticket not found with id: " + ticketId));

        boolean isAdmin = user != null && Role.ADMIN.equals(user.getRole());
        boolean isOwner = user != null && ticket.getUser() != null && ticket.getUser().getId().equals(user.getId());

        if (!isAdmin && !isOwner) {
            throw new RuntimeException("Access denied. You do not have permission to view this ticket.");
        }

        // If admin views a NEW ticket, transition to VIEWED and notify user
        if (isAdmin && "NEW".equalsIgnoreCase(ticket.getStatus())) {
            ticket.setStatus("VIEWED");
            ticket.setViewedAt(LocalDateTime.now());
            if (ticket.getAssignedAdmin() == null) {
                ticket.setAssignedAdmin(user);
            }
            ticket = ticketRepo.save(ticket);

            notificationService.createNotification(
                    ticket.getUser(),
                    "Ticket Viewed",
                    "Your support ticket #" + ticket.getTicketNumber() + " has been viewed by the KODIFY support team.",
                    "SUPPORT_VIEWED",
                    "/support?ticket=" + ticket.getId()
            );

            // Send Ticket Viewed Email (Event 2)
            emailService.sendTicketViewedEmail(
                    ticket.getUser(),
                    ticket.getTicketNumber(),
                    ticket.getSubject(),
                    ticket.getId()
            );
        }

        return mapToDto(ticket, true);
    }

    @Transactional
    public SupportTicketDto handleAdminAction(Long ticketId, SupportTicketActionDto actionDto, User adminUser) {
        if (adminUser == null || !Role.ADMIN.equals(adminUser.getRole())) {
            throw new RuntimeException("Only administrators can perform management actions on tickets.");
        }

        SupportTicket ticket = ticketRepo.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Support ticket not found with id: " + ticketId));

        String action = actionDto.getAction() != null ? actionDto.getAction().trim().toUpperCase() : "";
        ticket.setAssignedAdmin(adminUser);

        switch (action) {
            case "VIEW":
                if ("NEW".equalsIgnoreCase(ticket.getStatus())) {
                    ticket.setStatus("VIEWED");
                    ticket.setViewedAt(LocalDateTime.now());
                    notificationService.createNotification(
                            ticket.getUser(),
                            "Ticket Viewed",
                            "Your support ticket #" + ticket.getTicketNumber() + " has been viewed by the KODIFY support team.",
                            "SUPPORT_VIEWED",
                            "/support?ticket=" + ticket.getId()
                    );
                    emailService.sendTicketViewedEmail(
                            ticket.getUser(),
                            ticket.getTicketNumber(),
                            ticket.getSubject(),
                            ticket.getId()
                    );
                }
                break;

            case "START_WORKING":
                ticket.setStatus("IN_PROGRESS");
                if (ticket.getStartedAt() == null) {
                    ticket.setStartedAt(LocalDateTime.now());
                }
                notificationService.createNotification(
                        ticket.getUser(),
                        "Review In Progress",
                        "Your support ticket #" + ticket.getTicketNumber() + " is now being reviewed by the KODIFY support team.",
                        "SUPPORT_IN_PROGRESS",
                        "/support?ticket=" + ticket.getId()
                );
                break;

            case "REPLY":
                if (actionDto.getMessage() == null || actionDto.getMessage().isBlank()) {
                    throw new RuntimeException("Reply message cannot be blank.");
                }
                ticket.setStatus("WAITING_FOR_USER");
                SupportTicketMessage replyMsg = new SupportTicketMessage(
                        ticket,
                        adminUser,
                        "ADMIN",
                        actionDto.getMessage().trim()
                );
                messageRepo.save(replyMsg);

                notificationService.createNotification(
                        ticket.getUser(),
                        "New Support Response",
                        "You have a new response on support ticket #" + ticket.getTicketNumber() + ".",
                        "SUPPORT_REPLY",
                        "/support?ticket=" + ticket.getId()
                );
                break;

            case "RESOLVE":
                ticket.setStatus("RESOLVED");
                ticket.setResolvedAt(LocalDateTime.now());
                if (actionDto.getMessage() != null && !actionDto.getMessage().isBlank()) {
                    SupportTicketMessage resolveMsg = new SupportTicketMessage(
                            ticket,
                            adminUser,
                            "ADMIN",
                            actionDto.getMessage().trim()
                    );
                    messageRepo.save(resolveMsg);
                }
                notificationService.createNotification(
                        ticket.getUser(),
                        "Ticket Resolved",
                        "Your support ticket #" + ticket.getTicketNumber() + " has been resolved.",
                        "SUPPORT_RESOLVED",
                        "/support?ticket=" + ticket.getId()
                );
                emailService.sendTicketResolvedEmail(
                        ticket.getUser(),
                        ticket.getTicketNumber(),
                        ticket.getSubject(),
                        actionDto.getMessage(),
                        ticket.getId()
                );
                break;

            case "CLOSE":
                ticket.setStatus("CLOSED");
                notificationService.createNotification(
                        ticket.getUser(),
                        "Ticket Closed",
                        "Your support ticket #" + ticket.getTicketNumber() + " has been closed.",
                        "SUPPORT_CLOSED",
                        "/support?ticket=" + ticket.getId()
                );
                emailService.sendTicketClosedEmail(
                        ticket.getUser(),
                        ticket.getTicketNumber(),
                        ticket.getSubject(),
                        ticket.getId()
                );
                break;

            default:
                throw new RuntimeException("Unknown support ticket action: " + action);
        }

        ticket = ticketRepo.save(ticket);
        return mapToDto(ticket, true);
    }

    @Transactional
    public SupportTicketDto addUserReply(Long ticketId, String message, User user) {
        if (user == null) {
            throw new RuntimeException("User must be authenticated.");
        }
        if (message == null || message.isBlank()) {
            throw new RuntimeException("Message cannot be blank.");
        }

        SupportTicket ticket = ticketRepo.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Support ticket not found with id: " + ticketId));

        if (!ticket.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("You can only reply to your own support tickets.");
        }

        if ("CLOSED".equalsIgnoreCase(ticket.getStatus())) {
            throw new RuntimeException("Cannot reply to a closed ticket.");
        }

        ticket.setStatus("IN_PROGRESS");
        ticket = ticketRepo.save(ticket);

        SupportTicketMessage replyMsg = new SupportTicketMessage(
                ticket,
                user,
                "USER",
                message.trim()
        );
        messageRepo.save(replyMsg);

        return mapToDto(ticket, true);
    }

    private SupportTicketDto mapToDto(SupportTicket t, boolean includeMessages) {
        SupportTicketDto dto = new SupportTicketDto();
        dto.setId(t.getId());
        dto.setTicketNumber(t.getTicketNumber());
        if (t.getUser() != null) {
            dto.setUserId(t.getUser().getId());
            dto.setUserName(t.getUser().getName());
            dto.setUserUsername(t.getUser().getUsername());
            dto.setUserEmail(t.getUser().getEmail());
        }
        dto.setSubject(t.getSubject());
        dto.setCategory(t.getCategory());
        dto.setPriority(t.getPriority());
        dto.setDescription(t.getDescription());
        dto.setRating(t.getRating());
        dto.setStatus(t.getStatus());

        if (t.getAssignedAdmin() != null) {
            dto.setAssignedAdminId(t.getAssignedAdmin().getId());
            dto.setAssignedAdminName(t.getAssignedAdmin().getName() != null ? t.getAssignedAdmin().getName() : t.getAssignedAdmin().getUsername());
        }

        dto.setCreatedAt(t.getCreatedAt());
        dto.setViewedAt(t.getViewedAt());
        dto.setStartedAt(t.getStartedAt());
        dto.setResolvedAt(t.getResolvedAt());
        dto.setUpdatedAt(t.getUpdatedAt());

        if (includeMessages) {
            List<SupportTicketMessage> msgList = messageRepo.findByTicketIdOrderByCreatedAtAsc(t.getId());
            dto.setMessages(msgList.stream().map(m -> {
                SupportTicketMessageDto mDto = new SupportTicketMessageDto();
                mDto.setId(m.getId());
                mDto.setTicketId(t.getId());
                if (m.getSender() != null) {
                    mDto.setSenderId(m.getSender().getId());
                    mDto.setSenderName(m.getSender().getName());
                    mDto.setSenderUsername(m.getSender().getUsername());
                }
                mDto.setSenderRole(m.getSenderRole());
                mDto.setMessage(m.getMessage());
                mDto.setCreatedAt(m.getCreatedAt());
                return mDto;
            }).collect(Collectors.toList()));
        }

        return dto;
    }
}
