package infosys.onlinecodeplate.controller;

import infosys.onlinecodeplate.dto.AppDtos.BadgeDto;
import infosys.onlinecodeplate.dto.AppDtos.BadgeRequestDto;
import infosys.onlinecodeplate.service.BadgeService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/badges")
public class AdminBadgeController {

    private final BadgeService badgeService;

    public AdminBadgeController(BadgeService badgeService) {
        this.badgeService = badgeService;
    }

    @GetMapping
    public ResponseEntity<List<BadgeDto>> getAllBadges() {
        return ResponseEntity.ok(badgeService.getAllBadgesForAdmin());
    }

    @PostMapping
    public ResponseEntity<?> createBadge(@Valid @RequestBody BadgeRequestDto req) {
        try {
            return ResponseEntity.ok(badgeService.createBadge(req));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateBadge(@PathVariable Long id, @Valid @RequestBody BadgeRequestDto req) {
        try {
            return ResponseEntity.ok(badgeService.updateBadge(id, req));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBadge(@PathVariable Long id) {
        try {
            badgeService.deleteBadge(id);
            return ResponseEntity.ok(Map.of("message", "Badge deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
