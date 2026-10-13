package infosys.onlinecodeplate.controller;

import infosys.onlinecodeplate.dto.AppDtos.BadgeDto;
import infosys.onlinecodeplate.entity.User;
import infosys.onlinecodeplate.repository.UserRepository;
import infosys.onlinecodeplate.service.BadgeService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/badges")
public class BadgeController {

    private final BadgeService badgeService;
    private final UserRepository userRepository;

    public BadgeController(BadgeService badgeService, UserRepository userRepository) {
        this.badgeService = badgeService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<List<BadgeDto>> getAllBadges(Authentication auth) {
        User user = null;
        if (auth != null) {
            user = userRepository.findByEmailOrUsername(auth.getName(), auth.getName()).orElse(null);
        }
        return ResponseEntity.ok(badgeService.getAllBadgesForUser(user));
    }

    @GetMapping("/me")
    public ResponseEntity<List<BadgeDto>> getMyBadges(Authentication auth) {
        User user = userRepository.findByEmailOrUsername(auth.getName(), auth.getName()).orElseThrow();
        badgeService.awardEligibleBadges(user);
        return ResponseEntity.ok(badgeService.getEarnedBadgesForUser(user));
    }
}
