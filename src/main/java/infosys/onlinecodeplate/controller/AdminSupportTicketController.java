package infosys.onlinecodeplate.controller;

import infosys.onlinecodeplate.dto.AppDtos.*;
import infosys.onlinecodeplate.entity.User;
import infosys.onlinecodeplate.repository.UserRepository;
import infosys.onlinecodeplate.service.SupportTicketService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/support/tickets")
@PreAuthorize("hasAuthority('ADMIN')")
public class AdminSupportTicketController {

    private final SupportTicketService ticketService;
    private final UserRepository userRepo;

    public AdminSupportTicketController(SupportTicketService ticketService, UserRepository userRepo) {
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

    @GetMapping
    public ResponseEntity<List<SupportTicketDto>> getAllTickets() {
        return ResponseEntity.ok(ticketService.getAllTicketsForAdmin());
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

    @PostMapping("/{id}/action")
    public ResponseEntity<?> handleAction(@PathVariable Long id,
                                          @RequestBody SupportTicketActionDto actionDto,
                                          Authentication auth) {
        try {
            User user = getAuthenticatedUser(auth);
            return ResponseEntity.ok(ticketService.handleAdminAction(id, actionDto, user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
