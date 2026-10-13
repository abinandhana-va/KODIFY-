package infosys.onlinecodeplate.controller;

import infosys.onlinecodeplate.dto.AppDtos.*;
import infosys.onlinecodeplate.entity.User;
import infosys.onlinecodeplate.repository.UserRepository;
import infosys.onlinecodeplate.service.SupportTicketService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/support/tickets")
public class SupportTicketController {

    private final SupportTicketService ticketService;
    private final UserRepository userRepo;

    public SupportTicketController(SupportTicketService ticketService, UserRepository userRepo) {
        this.ticketService = ticketService;
        this.userRepo = userRepo;
    }

    private User getAuthenticatedUser(Authentication auth) {
        if (auth == null || auth.getName() == null) {
            throw new RuntimeException("User not authenticated.");
        }
        return userRepo.findByEmailOrUsername(auth.getName(), auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found with identity " + auth.getName()));
    }

    @PostMapping
    public ResponseEntity<?> createTicket(@Valid @RequestBody SupportTicketRequestDto req, Authentication auth) {
        try {
            User user = getAuthenticatedUser(auth);
            return ResponseEntity.ok(ticketService.createTicket(req, user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/my")
    public ResponseEntity<?> getMyTickets(Authentication auth) {
        try {
            User user = getAuthenticatedUser(auth);
            return ResponseEntity.ok(ticketService.getMyTickets(user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getTicketDetail(@PathVariable Long id, Authentication auth) {
        try {
            User user = getAuthenticatedUser(auth);
            return ResponseEntity.ok(ticketService.getTicketDetail(id, user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/reply")
    public ResponseEntity<?> addReply(@PathVariable Long id, @RequestBody Map<String, String> body, Authentication auth) {
        try {
            User user = getAuthenticatedUser(auth);
            String message = body.get("message");
            return ResponseEntity.ok(ticketService.addUserReply(id, message, user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
