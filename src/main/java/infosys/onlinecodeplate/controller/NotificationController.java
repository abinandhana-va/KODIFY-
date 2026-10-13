package infosys.onlinecodeplate.controller;

import infosys.onlinecodeplate.dto.AppDtos.UserNotificationDto;
import infosys.onlinecodeplate.entity.User;
import infosys.onlinecodeplate.repository.UserRepository;
import infosys.onlinecodeplate.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepo;

    public NotificationController(NotificationService notificationService, UserRepository userRepo) {
        this.notificationService = notificationService;
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
    public ResponseEntity<List<UserNotificationDto>> getNotifications(Authentication auth) {
        User user = getAuthenticatedUser(auth);
        return ResponseEntity.ok(notificationService.getUserNotifications(user));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(Authentication auth) {
        User user = getAuthenticatedUser(auth);
        return ResponseEntity.ok(Map.of("unreadCount", notificationService.getUnreadCount(user)));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id, Authentication auth) {
        User user = getAuthenticatedUser(auth);
        notificationService.markAsRead(id, user);
        return ResponseEntity.ok(Map.of("message", "Marked as read."));
    }

    @PutMapping("/read-all")
    public ResponseEntity<?> markAllAsRead(Authentication auth) {
        User user = getAuthenticatedUser(auth);
        notificationService.markAllAsRead(user);
        return ResponseEntity.ok(Map.of("message", "All notifications marked as read."));
    }
}
