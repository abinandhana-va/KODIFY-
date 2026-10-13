package infosys.onlinecodeplate.service;

import infosys.onlinecodeplate.dto.AppDtos.UserContestStatsDto;
import infosys.onlinecodeplate.entity.Contest;
import infosys.onlinecodeplate.entity.ContestParticipant;
import infosys.onlinecodeplate.entity.ContestSubmission;
import infosys.onlinecodeplate.repository.ContestParticipantRepository;
import infosys.onlinecodeplate.repository.ContestRepository;
import infosys.onlinecodeplate.repository.ContestSubmissionRepository;
import infosys.onlinecodeplate.repository.UserSubmissionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AchievementService {

    private final UserSubmissionRepository userSubmissionRepo;
    private final ContestRepository contestRepo;
    private final ContestParticipantRepository contestParticipantRepo;
    private final ContestSubmissionRepository contestSubmissionRepo;

    public AchievementService(UserSubmissionRepository userSubmissionRepo,
                              ContestRepository contestRepo,
                              ContestParticipantRepository contestParticipantRepo,
                              ContestSubmissionRepository contestSubmissionRepo) {
        this.userSubmissionRepo = userSubmissionRepo;
        this.contestRepo = contestRepo;
        this.contestParticipantRepo = contestParticipantRepo;
        this.contestSubmissionRepo = contestSubmissionRepo;
    }

    /**
     * Single reliable definition of uniquely solved problems:
     * Unique problems with at least one ACCEPTED submission.
     */
    @Transactional(readOnly = true)
    public long countUniqueSolvedProblems(Long userId) {
        if (userId == null) return 0;
        return userSubmissionRepo.countSolvedProblemsByUserId(userId, "ACCEPTED");
    }

    @Transactional(readOnly = true)
    public List<Long> getSolvedProblemIds(Long userId) {
        if (userId == null) return Collections.emptyList();
        return userSubmissionRepo.findSolvedProblemIdsByUserId(userId, "ACCEPTED");
    }

    /**
     * Calculate comprehensive contest participation, conducted count, wins, and streaks.
     */
    @Transactional(readOnly = true)
    public UserContestStatsDto getUserContestStats(Long userId) {
        if (userId == null) {
            return new UserContestStatsDto(0, 0, 0, 0, 0);
        }

        long conductedCount = contestRepo.countConductedContestsByUserId(userId);

        // Find all participations where user participated or registered
        List<ContestParticipant> allUserParticipations = contestParticipantRepo.findByUserId(userId);
        Set<Long> participatedContestIds = allUserParticipations.stream()
                .filter(cp -> cp.getContest() != null && (cp.getParticipatedAt() != null || cp.getStatus() == null || "PARTICIPATED".equalsIgnoreCase(cp.getStatus()) || "REGISTERED".equalsIgnoreCase(cp.getStatus())))
                .map(cp -> cp.getContest().getId())
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        // Also check if user submitted to any contest directly
        List<ContestSubmission> userSubmissions = contestSubmissionRepo.findByUserIdOrderByCreatedAtDesc(userId);
        for (ContestSubmission cs : userSubmissions) {
            if (cs.getContest() != null) {
                participatedContestIds.add(cs.getContest().getId());
            }
        }

        long participatedCount = participatedContestIds.size();

        // Calculate contest streaks and wins
        List<Contest> allContests = contestRepo.findAllByOrderByStartTimeDesc();
        LocalDateTime now = LocalDateTime.now();

        // Completed contests ordered chronologically (oldest to newest)
        List<Contest> completedContests = allContests.stream()
                .filter(c -> "COMPLETED".equalsIgnoreCase(c.getStatus()) || (c.getEndTime() != null && c.getEndTime().isBefore(now) && !"CANCELLED".equalsIgnoreCase(c.getStatus()) && !"DRAFT".equalsIgnoreCase(c.getStatus())))
                .sorted(Comparator.comparing(Contest::getStartTime))
                .collect(Collectors.toList());

        int currentStreak = 0;
        int longestStreak = 0;
        int runningStreak = 0;
        int winsCount = 0;

        for (Contest c : completedContests) {
            boolean participated = participatedContestIds.contains(c.getId());
            if (participated) {
                runningStreak++;
                if (runningStreak > longestStreak) {
                    longestStreak = runningStreak;
                }
            } else {
                runningStreak = 0;
            }
        }

        // Current streak: calculate backwards from the most recent completed contest
        if (!completedContests.isEmpty()) {
            for (int i = completedContests.size() - 1; i >= 0; i--) {
                Contest c = completedContests.get(i);
                if (participatedContestIds.contains(c.getId())) {
                    currentStreak++;
                } else {
                    break;
                }
            }
        } else {
            currentStreak = (int) participatedCount;
            longestStreak = Math.max(longestStreak, (int) participatedCount);
        }

        if (longestStreak < currentStreak) {
            longestStreak = currentStreak;
        }
        if (longestStreak < participatedCount && completedContests.isEmpty()) {
            longestStreak = (int) participatedCount;
            currentStreak = (int) participatedCount;
        }

        return new UserContestStatsDto(
                (int) participatedCount,
                (int) conductedCount,
                winsCount,
                currentStreak,
                longestStreak
        );
    }
}
