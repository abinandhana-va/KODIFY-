package infosys.onlinecodeplate.service;

import infosys.onlinecodeplate.dto.AppDtos.LeaderboardEntryDto;
import infosys.onlinecodeplate.entity.Problem;
import infosys.onlinecodeplate.entity.Role;
import infosys.onlinecodeplate.entity.User;
import infosys.onlinecodeplate.entity.UserSubmission;
import infosys.onlinecodeplate.repository.UserRepository;
import infosys.onlinecodeplate.repository.UserSubmissionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class LeaderboardService {

    private final UserRepository userRepository;
    private final UserSubmissionRepository submissionRepo;

    public LeaderboardService(UserRepository userRepository, UserSubmissionRepository submissionRepo) {
        this.userRepository = userRepository;
        this.submissionRepo = submissionRepo;
    }

    @Transactional(readOnly = true)
    public List<LeaderboardEntryDto> getLeaderboard(String type, String language) {
        boolean isWeekly = "weekly".equalsIgnoreCase(type);
        LocalDateTime weeklyStart = isWeekly ? getStartOfCurrentWeek() : null;

        // 1. Fetch non-admin users
        List<User> users = userRepository.findAll().stream()
                .filter(u -> u.getRole() != Role.ADMIN)
                .collect(Collectors.toList());

        // 2. Fetch all submissions
        List<UserSubmission> allSubmissions = submissionRepo.findAll();

        // 3. Group submissions by user ID
        Map<Long, List<UserSubmission>> submissionsByUser = allSubmissions.stream()
                .filter(s -> s.getUser() != null)
                .collect(Collectors.groupingBy(s -> s.getUser().getId()));

        List<LeaderboardEntryDto> entries = new ArrayList<>();

        for (User user : users) {
            List<UserSubmission> userSubs = submissionsByUser.getOrDefault(user.getId(), Collections.emptyList());

            // Filter by language if specified
            if (language != null && !language.isBlank() && !"ALL".equalsIgnoreCase(language.trim())) {
                String targetLang = language.trim();
                userSubs = userSubs.stream()
                        .filter(s -> s.getLanguage() != null && s.getLanguage().equalsIgnoreCase(targetLang))
                        .collect(Collectors.toList());
            }

            // Filter by timeframe if weekly
            if (isWeekly && weeklyStart != null) {
                userSubs = userSubs.stream()
                        .filter(s -> s.getCreatedAt() != null && !s.getCreatedAt().isBefore(weeklyStart))
                        .collect(Collectors.toList());
            }

            int totalSubmissions = userSubs.size();
            List<UserSubmission> acceptedSubs = userSubs.stream()
                    .filter(s -> "ACCEPTED".equalsIgnoreCase(s.getStatus()))
                    .collect(Collectors.toList());

            int acceptedCount = acceptedSubs.size();

            // Calculate Acceptance Rate safely
            double rawAccuracy = totalSubmissions > 0
                    ? ((double) acceptedCount / totalSubmissions) * 100.0
                    : 0.0;
            double acceptanceRate = Math.round(rawAccuracy * 10.0) / 10.0;

            // Calculate uniquely solved problems
            Map<Long, Problem> solvedProblemsMap = new HashMap<>();
            Double fastestAcceptedRuntime = null;

            for (UserSubmission sub : acceptedSubs) {
                if (sub.getProblem() != null) {
                    solvedProblemsMap.putIfAbsent(sub.getProblem().getId(), sub.getProblem());
                }
                if (sub.getRuntime() != null) {
                    if (fastestAcceptedRuntime == null || sub.getRuntime() < fastestAcceptedRuntime) {
                        fastestAcceptedRuntime = sub.getRuntime();
                    }
                }
            }

            int problemsSolved = solvedProblemsMap.size();

            // Calculate Score based on difficulty weights: Easy = 1, Medium = 2, Hard = 3
            int score = 0;
            for (Problem p : solvedProblemsMap.values()) {
                score += getDifficultyWeight(p.getDifficulty());
            }

            LeaderboardEntryDto entry = new LeaderboardEntryDto(
                    0, // rank set after sorting
                    user.getId(),
                    user.getUsername(),
                    user.getName(),
                    problemsSolved,
                    score,
                    acceptanceRate,
                    totalSubmissions,
                    acceptedCount
            );
            entry.setFastestAcceptedRuntime(fastestAcceptedRuntime);
            entries.add(entry);
        }

        // 4. Deterministic sorting:
        // 1. Problems solved DESC
        // 2. Acceptance rate DESC
        // 3. Score DESC
        // 4. Fastest accepted runtime ASC (nulls last)
        // 5. Username ASC (case-insensitive)
        entries.sort((a, b) -> {
            int cmp = Integer.compare(b.getProblemsSolved(), a.getProblemsSolved());
            if (cmp != 0) return cmp;

            cmp = Double.compare(b.getAcceptanceRate(), a.getAcceptanceRate());
            if (cmp != 0) return cmp;

            cmp = Integer.compare(b.getScore(), a.getScore());
            if (cmp != 0) return cmp;

            if (a.getFastestAcceptedRuntime() != null && b.getFastestAcceptedRuntime() != null) {
                cmp = Double.compare(a.getFastestAcceptedRuntime(), b.getFastestAcceptedRuntime());
                if (cmp != 0) return cmp;
            } else if (a.getFastestAcceptedRuntime() != null) {
                return -1;
            } else if (b.getFastestAcceptedRuntime() != null) {
                return 1;
            }

            String u1 = a.getUsername() != null ? a.getUsername().toLowerCase() : "";
            String u2 = b.getUsername() != null ? b.getUsername().toLowerCase() : "";
            return u1.compareTo(u2);
        });

        // 5. Assign sequential ranks
        for (int i = 0; i < entries.size(); i++) {
            entries.get(i).setRank(i + 1);
        }

        return entries;
    }

    public int getDifficultyWeight(String difficulty) {
        if (difficulty == null) return 1;
        String diff = difficulty.trim().toUpperCase();
        switch (diff) {
            case "EASY":
                return 1;
            case "MEDIUM":
                return 2;
            case "HARD":
                return 3;
            default:
                return 1;
        }
    }

    public LocalDateTime getStartOfCurrentWeek() {
        return LocalDate.now()
                .with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
                .atStartOfDay();
    }
}
