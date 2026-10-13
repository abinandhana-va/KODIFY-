package infosys.onlinecodeplate.service;

import infosys.onlinecodeplate.dto.AppDtos.BadgeDto;
import infosys.onlinecodeplate.dto.AppDtos.BadgeRequestDto;
import infosys.onlinecodeplate.dto.AppDtos.UserContestStatsDto;
import infosys.onlinecodeplate.entity.Badge;
import infosys.onlinecodeplate.entity.User;
import infosys.onlinecodeplate.entity.UserBadge;
import infosys.onlinecodeplate.repository.BadgeRepository;
import infosys.onlinecodeplate.repository.UserBadgeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BadgeService {

    private final BadgeRepository badgeRepo;
    private final UserBadgeRepository userBadgeRepo;
    private final AchievementService achievementService;
    private final ActivityService activityService;

    public BadgeService(BadgeRepository badgeRepo,
                        UserBadgeRepository userBadgeRepo,
                        AchievementService achievementService,
                        ActivityService activityService) {
        this.badgeRepo = badgeRepo;
        this.userBadgeRepo = userBadgeRepo;
        this.achievementService = achievementService;
        this.activityService = activityService;
    }

    @Transactional
    public List<UserBadge> awardEligibleBadges(User user) {
        if (user == null) return List.of();

        long uniqueSolved = achievementService.countUniqueSolvedProblems(user.getId());
        UserContestStatsDto contestStats = achievementService.getUserContestStats(user.getId());
        List<Badge> activeBadges = badgeRepo.findByEnabledTrue();
        List<UserBadge> newlyAwarded = new ArrayList<>();

        for (Badge badge : activeBadges) {
            long metricValue = getMetricValue(badge.getMetric(), uniqueSolved, contestStats);
            if (metricValue >= badge.getTarget() && !userBadgeRepo.existsByUserIdAndBadgeId(user.getId(), badge.getId())) {
                UserBadge ub = new UserBadge(user, badge, LocalDateTime.now());
                userBadgeRepo.save(ub);
                newlyAwarded.add(ub);

                activityService.logActivity(
                        user,
                        "Badge Earned",
                        "Earned the '" + badge.getName() + "' badge (" + badge.getTarget() + " " + formatMetricLabel(badge.getMetric()) + ")!"
                );
            }
        }
        return newlyAwarded;
    }

    @Transactional
    public List<BadgeDto> getAllBadgesForUser(User user) {
        if (user != null) {
            awardEligibleBadges(user);
        }

        long uniqueSolved = user != null ? achievementService.countUniqueSolvedProblems(user.getId()) : 0;
        UserContestStatsDto contestStats = user != null ? achievementService.getUserContestStats(user.getId()) : new UserContestStatsDto(0, 0, 0, 0, 0);

        List<UserBadge> userBadges = user != null ? userBadgeRepo.findByUserId(user.getId()) : List.of();
        java.util.Map<Long, UserBadge> userBadgeMap = userBadges.stream()
                .collect(Collectors.toMap(ub -> ub.getBadge().getId(), ub -> ub, (a, b) -> a));

        List<Badge> allActive = badgeRepo.findByEnabledTrueOrderByTargetAsc();
        List<BadgeDto> dtos = new ArrayList<>();

        for (Badge b : allActive) {
            long metricValue = getMetricValue(b.getMetric(), uniqueSolved, contestStats);
            BadgeDto dto = mapToDto(b);
            UserBadge ub = userBadgeMap.get(b.getId());
            if (ub != null) {
                dto.setEarned(true);
                dto.setEarnedAt(ub.getEarnedAt());
                dto.setCurrentProgress(b.getTarget());
            } else {
                dto.setEarned(false);
                dto.setEarnedAt(null);
                dto.setCurrentProgress((int) Math.min(metricValue, b.getTarget()));
            }
            dtos.add(dto);
        }

        return dtos;
    }

    @Transactional(readOnly = true)
    public List<BadgeDto> getEarnedBadgesForUser(User user) {
        if (user == null) return List.of();
        List<UserBadge> userBadges = userBadgeRepo.findByUserIdOrderByEarnedAtDesc(user.getId());
        return userBadges.stream().map(ub -> {
            BadgeDto dto = mapToDto(ub.getBadge());
            dto.setEarned(true);
            dto.setEarnedAt(ub.getEarnedAt());
            dto.setCurrentProgress(ub.getBadge().getTarget());
            return dto;
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BadgeDto> getAllBadgesForAdmin() {
        List<Badge> badges = badgeRepo.findAllByOrderByTargetAsc();
        return badges.stream().map(b -> {
            BadgeDto dto = mapToDto(b);
            dto.setEarnedCount(userBadgeRepo.countByBadgeId(b.getId()));
            return dto;
        }).collect(Collectors.toList());
    }

    @Transactional
    public BadgeDto createBadge(BadgeRequestDto req) {
        if (badgeRepo.existsByNameIgnoreCase(req.getName().trim())) {
            throw new RuntimeException("A badge with name '" + req.getName().trim() + "' already exists.");
        }

        String shape = req.getShape() != null ? req.getShape().trim().toUpperCase() : "CIRCLE";
        if (!"CIRCLE".equals(shape) && !"HEXAGON".equals(shape) && !"DIAMOND".equals(shape)) {
            shape = "CIRCLE";
        }

        Badge badge = new Badge(
                req.getName().trim(),
                req.getDescription() != null ? req.getDescription().trim() : "",
                req.getImageUrl() != null ? req.getImageUrl().trim() : "",
                shape,
                req.getMetric() != null ? req.getMetric().trim().toUpperCase() : "PROBLEMS_SOLVED",
                req.getTarget() != null ? req.getTarget() : 1,
                req.getEnabled() != null ? req.getEnabled() : true
        );

        badge = badgeRepo.save(badge);
        return mapToDto(badge);
    }

    @Transactional
    public BadgeDto updateBadge(Long id, BadgeRequestDto req) {
        Badge badge = badgeRepo.findById(id).orElseThrow(() -> new RuntimeException("Badge not found."));

        if (!badge.getName().equalsIgnoreCase(req.getName().trim())) {
            if (badgeRepo.existsByNameIgnoreCase(req.getName().trim())) {
                throw new RuntimeException("A badge with name '" + req.getName().trim() + "' already exists.");
            }
            badge.setName(req.getName().trim());
        }

        badge.setDescription(req.getDescription() != null ? req.getDescription().trim() : "");
        badge.setImageUrl(req.getImageUrl() != null ? req.getImageUrl().trim() : "");

        String shape = req.getShape() != null ? req.getShape().trim().toUpperCase() : "CIRCLE";
        if (!"CIRCLE".equals(shape) && !"HEXAGON".equals(shape) && !"DIAMOND".equals(shape)) {
            shape = "CIRCLE";
        }
        badge.setShape(shape);

        badge.setMetric(req.getMetric() != null ? req.getMetric().trim().toUpperCase() : "PROBLEMS_SOLVED");
        badge.setTarget(req.getTarget() != null ? req.getTarget() : 1);
        badge.setEnabled(req.getEnabled() != null ? req.getEnabled() : true);

        badge = badgeRepo.save(badge);
        BadgeDto dto = mapToDto(badge);
        dto.setEarnedCount(userBadgeRepo.countByBadgeId(badge.getId()));
        return dto;
    }

    @Transactional
    public void deleteBadge(Long id) {
        if (!badgeRepo.existsById(id)) {
            throw new RuntimeException("Badge not found.");
        }
        userBadgeRepo.deleteByBadgeId(id);
        badgeRepo.deleteById(id);
    }

    private long getMetricValue(String metric, long uniqueSolved, UserContestStatsDto contestStats) {
        if (metric == null) return uniqueSolved;
        switch (metric.toUpperCase()) {
            case "PROBLEMS_SOLVED":
                return uniqueSolved;
            case "CONTESTS_PARTICIPATED":
                return contestStats.getParticipatedCount();
            case "CONTESTS_CONDUCTED":
                return contestStats.getConductedCount();
            case "CONTEST_WINS":
                return contestStats.getWinsCount();
            default:
                return uniqueSolved;
        }
    }

    private String formatMetricLabel(String metric) {
        if (metric == null) return "Problems Solved";
        switch (metric.toUpperCase()) {
            case "PROBLEMS_SOLVED":
                return "Problems Solved";
            case "CONTESTS_PARTICIPATED":
                return "Contests Participated";
            case "CONTESTS_CONDUCTED":
                return "Contests Conducted";
            case "CONTEST_WINS":
                return "Contest Wins";
            default:
                return "Problems Solved";
        }
    }

    public BadgeDto mapToDto(Badge b) {
        BadgeDto dto = new BadgeDto();
        dto.setId(b.getId());
        dto.setName(b.getName());
        dto.setDescription(b.getDescription());
        dto.setImageUrl(b.getImageUrl());
        dto.setShape(b.getShape());
        dto.setMetric(b.getMetric());
        dto.setTarget(b.getTarget());
        dto.setEnabled(b.getEnabled());
        dto.setCreatedAt(b.getCreatedAt());
        return dto;
    }
}
