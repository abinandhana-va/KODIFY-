package infosys.onlinecodeplate.controller;

import infosys.onlinecodeplate.dto.AppDtos.CertificateDto;
import infosys.onlinecodeplate.dto.AppDtos.ContestDto;
import infosys.onlinecodeplate.dto.AppDtos.BadgeDto;
import infosys.onlinecodeplate.dto.AppDtos.HeatmapItemDto;
import infosys.onlinecodeplate.dto.AppDtos.UserContestStatsDto;
import infosys.onlinecodeplate.dto.AppDtos.WhatsNewDto;
import infosys.onlinecodeplate.dto.Dtos.ProfileUpdateRequest;
import infosys.onlinecodeplate.dto.Dtos.UserDto;
import infosys.onlinecodeplate.entity.Contest;
import infosys.onlinecodeplate.entity.User;
import infosys.onlinecodeplate.entity.UserSubmission;
import infosys.onlinecodeplate.repository.CertificateRepository;
import infosys.onlinecodeplate.repository.ContestRepository;
import infosys.onlinecodeplate.repository.ProblemRepository;
import infosys.onlinecodeplate.repository.UserRepository;
import infosys.onlinecodeplate.repository.UserSubmissionRepository;
import infosys.onlinecodeplate.service.AchievementService;
import infosys.onlinecodeplate.service.ActivityService;
import infosys.onlinecodeplate.service.AuthService;
import infosys.onlinecodeplate.service.BadgeService;
import infosys.onlinecodeplate.service.CertificateService;
import infosys.onlinecodeplate.service.ContestService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserRepository userRepository;
    private final AuthService authService;
    private final ActivityService activityService;
    private final AchievementService achievementService;
    private final CertificateService certificateService;
    private final BadgeService badgeService;
    private final ContestService contestService;
    private final ProblemRepository problemRepo;
    private final UserSubmissionRepository submissionRepo;
    private final ContestRepository contestRepo;
    private final PasswordEncoder passwordEncoder;

    public UserController(UserRepository userRepository,
                          AuthService authService,
                          ActivityService activityService,
                          AchievementService achievementService,
                          CertificateService certificateService,
                          BadgeService badgeService,
                          ContestService contestService,
                          ProblemRepository problemRepo,
                          UserSubmissionRepository submissionRepo,
                          ContestRepository contestRepo,
                          PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.authService = authService;
        this.activityService = activityService;
        this.achievementService = achievementService;
        this.certificateService = certificateService;
        this.badgeService = badgeService;
        this.contestService = contestService;
        this.problemRepo = problemRepo;
        this.submissionRepo = submissionRepo;
        this.contestRepo = contestRepo;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> getMe(Authentication authentication) {
        User user = userRepository.findByEmailOrUsername(authentication.getName(), authentication.getName()).orElseThrow();
        return ResponseEntity.ok(authService.mapToDto(user));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getMyStats(Authentication authentication) {
        User user = userRepository.findByEmailOrUsername(authentication.getName(), authentication.getName()).orElseThrow();
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalProblems", problemRepo.count());
        long solvedTotal = achievementService.countUniqueSolvedProblems(user.getId());
        long solvedEasy = submissionRepo.countSolvedProblemsByUserIdAndDifficulty(user.getId(), "ACCEPTED", "EASY");
        long solvedMedium = submissionRepo.countSolvedProblemsByUserIdAndDifficulty(user.getId(), "ACCEPTED", "MEDIUM");
        long solvedHard = submissionRepo.countSolvedProblemsByUserIdAndDifficulty(user.getId(), "ACCEPTED", "HARD");

        stats.put("solvedTotal", solvedTotal);
        stats.put("solvedEasy", solvedEasy);
        stats.put("solvedMedium", solvedMedium);
        stats.put("solvedHard", solvedHard);

        UserContestStatsDto contestStats = achievementService.getUserContestStats(user.getId());
        stats.put("contestParticipated", contestStats.getParticipatedCount());
        stats.put("contestConducted", contestStats.getConductedCount());
        stats.put("contestWins", contestStats.getWinsCount());
        stats.put("currentStreak", contestStats.getCurrentStreak());
        stats.put("longestStreak", contestStats.getLongestStreak());

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/heatmap")
    public ResponseEntity<List<HeatmapItemDto>> getMyHeatmap(Authentication authentication) {
        User user = userRepository.findByEmailOrUsername(authentication.getName(), authentication.getName()).orElseThrow();
        return ResponseEntity.ok(buildHeatmapForUser(user.getId()));
    }

    @GetMapping("/{id}/heatmap")
    public ResponseEntity<List<HeatmapItemDto>> getUserHeatmap(@PathVariable Long id) {
        return ResponseEntity.ok(buildHeatmapForUser(id));
    }

    @GetMapping("/profile-stats")
    public ResponseEntity<Map<String, Object>> getMyProfileStats(Authentication authentication) {
        User user = userRepository.findByEmailOrUsername(authentication.getName(), authentication.getName()).orElseThrow();
        return ResponseEntity.ok(buildFullProfileStats(user));
    }

    @GetMapping("/{id}/profile-stats")
    public ResponseEntity<Map<String, Object>> getUserProfileStats(@PathVariable Long id) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(buildFullProfileStats(user));
    }

    @GetMapping("/dashboard/whats-new")
    public ResponseEntity<WhatsNewDto> getWhatsNew() {
        WhatsNewDto dto = new WhatsNewDto();
        LocalDateTime now = LocalDateTime.now();

        // 1. Latest Contests
        List<ContestDto> contests = contestService.getAllContests(null, "ALL", null);
        dto.setNewContests(contests.stream().limit(3).collect(Collectors.toList()));

        // 2. Latest Certificates
        List<CertificateDto> certs = certificateService.getAllCertificatesForAdmin();
        dto.setNewCertificates(certs.stream().filter(CertificateDto::getEnabled).limit(3).collect(Collectors.toList()));

        // 3. Latest Badges
        List<BadgeDto> badges = badgeService.getAllBadgesForAdmin();
        dto.setNewBadges(badges.stream().filter(BadgeDto::getEnabled).limit(3).collect(Collectors.toList()));

        return ResponseEntity.ok(dto);
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateMe(Authentication authentication, @Valid @RequestBody ProfileUpdateRequest request) {
        try {
            User user = userRepository.findByEmailOrUsername(authentication.getName(), authentication.getName()).orElseThrow();
            boolean changed = false;

            if (request.getName() != null && !user.getName().equals(request.getName().trim())) {
                user.setName(request.getName().trim());
                changed = true;
            }

            if (request.getUsername() != null && !user.getUsername().equalsIgnoreCase(request.getUsername().trim())) {
                String newUsername = request.getUsername().trim();
                if (userRepository.existsByUsername(newUsername)) {
                    throw new RuntimeException("Username is already taken.");
                }
                user.setUsername(newUsername);
                changed = true;
            }

            if (request.getEmail() != null && !user.getEmail().equalsIgnoreCase(request.getEmail().trim())) {
                String newEmail = request.getEmail().trim().toLowerCase();
                if (userRepository.existsByEmail(newEmail)) {
                    throw new RuntimeException("Email is already registered by another account.");
                }
                user.setEmail(newEmail);
                changed = true;
            }

            if (request.getBio() != null && !request.getBio().equals(user.getBio())) {
                user.setBio(request.getBio().trim());
                changed = true;
            }

            if (request.getContact() != null && !request.getContact().equals(user.getContact())) {
                user.setContact(request.getContact().trim());
                changed = true;
            }

            if (changed) {
                userRepository.save(user);
                activityService.logActivity(user, "Profile Updated", "Updated personal profile details");
            }
            return ResponseEntity.ok(authService.mapToDto(user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/password")
    public ResponseEntity<?> updatePassword(Authentication authentication, @RequestBody Map<String, String> body) {
        String newPassword = body.get("newPassword");
        if (newPassword == null || newPassword.length() < 8) {
            return ResponseEntity.badRequest().body(Map.of("message", "Password must be at least 8 characters long"));
        }
        User user = userRepository.findByEmailOrUsername(authentication.getName(), authentication.getName()).orElseThrow();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        activityService.logActivity(user, "Password Changed", "Updated account password securely");
        return ResponseEntity.ok(Map.of("message", "Password updated successfully"));
    }

    private List<HeatmapItemDto> buildHeatmapForUser(Long userId) {
        List<UserSubmission> submissions = submissionRepo.findByUserId(userId);
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        // Group actual coding submission attempts by date
        Map<String, Integer> countsByDate = new HashMap<>();
        for (UserSubmission s : submissions) {
            if (s.getCreatedAt() != null) {
                String dateStr = s.getCreatedAt().format(dtf);
                countsByDate.put(dateStr, countsByDate.getOrDefault(dateStr, 0) + 1);
            }
        }

        // Generate full past 365 days dates
        LocalDate today = LocalDate.now();
        LocalDate startDate = today.minusDays(364);
        List<HeatmapItemDto> heatmap = new ArrayList<>();

        for (LocalDate d = startDate; !d.isAfter(today); d = d.plusDays(1)) {
            String dateStr = d.format(dtf);
            int count = countsByDate.getOrDefault(dateStr, 0);
            int intensity = 0;
            if (count >= 10) intensity = 4;
            else if (count >= 6) intensity = 3;
            else if (count >= 3) intensity = 2;
            else if (count >= 1) intensity = 1;

            heatmap.add(new HeatmapItemDto(dateStr, count, intensity));
        }

        return heatmap;
    }

    private Map<String, Object> buildFullProfileStats(User user) {
        Map<String, Object> map = new HashMap<>();
        map.put("user", authService.mapToDto(user));

        long solvedTotal = achievementService.countUniqueSolvedProblems(user.getId());
        long solvedEasy = submissionRepo.countSolvedProblemsByUserIdAndDifficulty(user.getId(), "ACCEPTED", "EASY");
        long solvedMedium = submissionRepo.countSolvedProblemsByUserIdAndDifficulty(user.getId(), "ACCEPTED", "MEDIUM");
        long solvedHard = submissionRepo.countSolvedProblemsByUserIdAndDifficulty(user.getId(), "ACCEPTED", "HARD");

        map.put("solvedTotal", solvedTotal);
        map.put("solvedEasy", solvedEasy);
        map.put("solvedMedium", solvedMedium);
        map.put("solvedHard", solvedHard);

        UserContestStatsDto contestStats = achievementService.getUserContestStats(user.getId());
        map.put("contestStats", contestStats);

        List<BadgeDto> badges = badgeService.getAllBadgesForUser(user);
        map.put("badges", badges);

        List<CertificateDto> certificates = certificateService.getAllCertificatesForUser(user);
        map.put("certificates", certificates);

        map.put("heatmap", buildHeatmapForUser(user.getId()));

        return map;
    }
}
