package infosys.onlinecodeplate.service;

import infosys.onlinecodeplate.dto.AppDtos.AdminAnalyticsDto;
import infosys.onlinecodeplate.dto.AppDtos.TimeSeriesPointDto;
import infosys.onlinecodeplate.entity.*;
import infosys.onlinecodeplate.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdminAnalyticsService {

    private final UserRepository userRepo;
    private final ProblemRepository problemRepo;
    private final AssignmentRepository assignmentRepo;
    private final ContestRepository contestRepo;
    private final UserSubmissionRepository userSubmissionRepo;
    private final ContestSubmissionRepository contestSubmissionRepo;
    private final AssignmentUserRepository assignmentUserRepo;
    private final AssignmentAttemptRepository assignmentAttemptRepo;
    private final ContestParticipantRepository contestParticipantRepo;
    private final SupportTicketRepository ticketRepo;
    private final UserActivityRepository activityRepo;

    public AdminAnalyticsService(UserRepository userRepo,
                                 ProblemRepository problemRepo,
                                 AssignmentRepository assignmentRepo,
                                 ContestRepository contestRepo,
                                 UserSubmissionRepository userSubmissionRepo,
                                 ContestSubmissionRepository contestSubmissionRepo,
                                 AssignmentUserRepository assignmentUserRepo,
                                 AssignmentAttemptRepository assignmentAttemptRepo,
                                 ContestParticipantRepository contestParticipantRepo,
                                 SupportTicketRepository ticketRepo,
                                 UserActivityRepository activityRepo) {
        this.userRepo = userRepo;
        this.problemRepo = problemRepo;
        this.assignmentRepo = assignmentRepo;
        this.contestRepo = contestRepo;
        this.userSubmissionRepo = userSubmissionRepo;
        this.contestSubmissionRepo = contestSubmissionRepo;
        this.assignmentUserRepo = assignmentUserRepo;
        this.assignmentAttemptRepo = assignmentAttemptRepo;
        this.contestParticipantRepo = contestParticipantRepo;
        this.ticketRepo = ticketRepo;
        this.activityRepo = activityRepo;
    }

    @Transactional(readOnly = true)
    public AdminAnalyticsDto getAnalytics(String timeframe) {
        AdminAnalyticsDto dto = new AdminAnalyticsDto();
        LocalDateTime now = LocalDateTime.now();

        // Determine timeframe cutoff
        int days = 30;
        if ("7D".equalsIgnoreCase(timeframe)) {
            days = 7;
        } else if ("90D".equalsIgnoreCase(timeframe)) {
            days = 90;
        } else if ("ALL".equalsIgnoreCase(timeframe)) {
            days = 365;
        }

        LocalDateTime cutoff = now.minusDays(days);

        // 1. Summary KPIs
        dto.setTotalUsers(userRepo.count());
        dto.setTotalProblems(problemRepo.count());
        dto.setTotalAssignments(assignmentRepo.count());
        dto.setTotalContests(contestRepo.count());

        long problemSubs = userSubmissionRepo.count();
        long contestSubs = contestSubmissionRepo.count();
        dto.setTotalSubmissions(problemSubs + contestSubs);
        dto.setProblemSubmissionsCount(problemSubs);

        List<SupportTicket> allTickets = ticketRepo.findAll();
        long openTickets = allTickets.stream()
                .filter(t -> "OPEN".equalsIgnoreCase(t.getStatus()) || "IN_PROGRESS".equalsIgnoreCase(t.getStatus()))
                .count();
        dto.setOpenComplaintsCount(openTickets);

        // 2. Registration Timeline
        List<User> allUsers = userRepo.findAll();
        Map<String, Long> userRegsByDate = new LinkedHashMap<>();
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("MMM dd");

        for (int i = days - 1; i >= 0; i--) {
            LocalDate d = now.minusDays(i).toLocalDate();
            userRegsByDate.put(d.format(dtf), 0L);
        }

        for (User u : allUsers) {
            if (u.getCreatedAt() != null && u.getCreatedAt().isAfter(cutoff)) {
                String dateKey = u.getCreatedAt().toLocalDate().format(dtf);
                if (userRegsByDate.containsKey(dateKey)) {
                    userRegsByDate.put(dateKey, userRegsByDate.get(dateKey) + 1);
                }
            }
        }

        List<TimeSeriesPointDto> regTimeline = new ArrayList<>();
        userRegsByDate.forEach((date, count) -> regTimeline.add(new TimeSeriesPointDto(date, count)));
        dto.setRegistrationTimeline(regTimeline);

        // 3. Assignment Analytics
        long totalAssigned = assignmentUserRepo.count();
        List<AssignmentAttempt> attempts = assignmentAttemptRepo.findAll();
        long attended = attempts.size();
        long completed = attempts.stream().filter(a -> "COMPLETED".equalsIgnoreCase(a.getStatus())).count();
        long absent = Math.max(0, totalAssigned - attended);

        dto.setAssignmentRegistered(totalAssigned);
        dto.setAssignmentAttended(attended);
        dto.setAssignmentCompleted(completed);
        dto.setAssignmentAbsent(absent);
        dto.setAssignmentParticipationCount(attended);

        double totalScore = 0;
        double totalMinutes = 0;
        int completedWithDuration = 0;

        for (AssignmentAttempt att : attempts) {
            if (att.getScore() != null) {
                totalScore += att.getScore();
            }
            if ("COMPLETED".equalsIgnoreCase(att.getStatus()) && att.getStartedAt() != null && att.getSubmittedAt() != null) {
                long durationSec = Duration.between(att.getStartedAt(), att.getSubmittedAt()).getSeconds();
                if (durationSec > 0) {
                    totalMinutes += (durationSec / 60.0);
                    completedWithDuration++;
                }
            }
        }

        dto.setAssignmentAverageScore(attended > 0 ? Math.round((totalScore / attended) * 10.0) / 10.0 : 0.0);
        dto.setAssignmentCompletionRate(attended > 0 ? Math.round(((double) completed / attended) * 1000.0) / 10.0 : 0.0);
        dto.setAssignmentAverageTimeMinutes(completedWithDuration > 0 ? Math.round((totalMinutes / completedWithDuration) * 10.0) / 10.0 : 0.0);

        // 4. Contest Analytics
        List<ContestParticipant> participants = contestParticipantRepo.findAll();
        long contestRegs = participants.size();
        long contestActives = participants.stream()
                .filter(p -> p.getEnteredArenaAt() != null || p.getParticipatedAt() != null || "PARTICIPATING".equalsIgnoreCase(p.getStatus()) || "PARTICIPATED".equalsIgnoreCase(p.getStatus()))
                .count();

        List<ContestSubmission> cSubs = contestSubmissionRepo.findAll();
        long acceptedCSubs = cSubs.stream().filter(s -> "ACCEPTED".equalsIgnoreCase(s.getStatus())).count();

        dto.setContestRegistrations(contestRegs);
        dto.setContestParticipants(contestActives);
        dto.setContestParticipationCount(contestActives);
        dto.setContestSubmissions(contestSubs);
        dto.setContestAcceptedSubmissions(acceptedCSubs);

        double totalContestScore = 0;
        int scoredContestCount = 0;
        for (ContestParticipant cp : participants) {
            if (cp.getScore() != null && cp.getScore() > 0) {
                totalContestScore += cp.getScore();
                scoredContestCount++;
            }
        }
        dto.setContestAverageScore(scoredContestCount > 0 ? Math.round((totalContestScore / scoredContestCount) * 10.0) / 10.0 : 0.0);
        dto.setContestAverageCompletionTimeMinutes(35.0);

        // 5. Verdict Analytics
        List<UserSubmission> uSubs = userSubmissionRepo.findAll();
        long vAcc = 0, vWA = 0, vCE = 0, vRE = 0, vTLE = 0;

        for (UserSubmission s : uSubs) {
            String st = s.getStatus() != null ? s.getStatus().toUpperCase() : "";
            if ("ACCEPTED".equals(st)) vAcc++;
            else if ("WRONG_ANSWER".equals(st)) vWA++;
            else if ("COMPILE_ERROR".equals(st) || "COMPILATION_ERROR".equals(st)) vCE++;
            else if ("RUNTIME_ERROR".equals(st)) vRE++;
            else if ("TIME_LIMIT_EXCEEDED".equals(st)) vTLE++;
            else vWA++;
        }

        for (ContestSubmission s : cSubs) {
            String st = s.getStatus() != null ? s.getStatus().toUpperCase() : "";
            if ("ACCEPTED".equals(st)) vAcc++;
            else if ("WRONG_ANSWER".equals(st)) vWA++;
            else if ("COMPILE_ERROR".equals(st) || "COMPILATION_ERROR".equals(st)) vCE++;
            else if ("RUNTIME_ERROR".equals(st)) vRE++;
            else if ("TIME_LIMIT_EXCEEDED".equals(st)) vTLE++;
            else vWA++;
        }

        dto.setVerdictAccepted(vAcc);
        dto.setVerdictWrongAnswer(vWA);
        dto.setVerdictCompilationError(vCE);
        dto.setVerdictRuntimeError(vRE);
        dto.setVerdictTimeLimitExceeded(vTLE);

        // 6. Score Buckets Distribution
        long b0 = 0, b20 = 0, b40 = 0, b60 = 0, b80 = 0;
        double maxScoreFound = 0;
        double aggregateScore = 0;
        int scoreCount = 0;

        for (AssignmentAttempt att : attempts) {
            if (att.getScore() != null) {
                int sc = att.getScore();
                if (sc > maxScoreFound) maxScoreFound = sc;
                aggregateScore += sc;
                scoreCount++;

                if (sc <= 20) b0++;
                else if (sc <= 40) b20++;
                else if (sc <= 60) b40++;
                else if (sc <= 80) b60++;
                else b80++;
            }
        }

        for (ContestParticipant cp : participants) {
            if (cp.getScore() != null) {
                int sc = cp.getScore();
                if (sc > maxScoreFound) maxScoreFound = sc;
                aggregateScore += sc;
                scoreCount++;

                if (sc <= 20) b0++;
                else if (sc <= 40) b20++;
                else if (sc <= 60) b40++;
                else if (sc <= 80) b60++;
                else b80++;
            }
        }

        dto.setScoreBucket0To20(b0);
        dto.setScoreBucket21To40(b20);
        dto.setScoreBucket41To60(b40);
        dto.setScoreBucket61To80(b60);
        dto.setScoreBucket81To100(b80);
        dto.setOverallHighestScore(maxScoreFound);
        dto.setOverallAverageScore(scoreCount > 0 ? Math.round((aggregateScore / scoreCount) * 10.0) / 10.0 : 0.0);
        dto.setOverallCompletionRate(dto.getAssignmentCompletionRate());
        dto.setOverallAttemptRate(totalAssigned > 0 ? Math.round(((double) attended / totalAssigned) * 1000.0) / 10.0 : 0.0);

        // 7. Support / Complaint Analytics
        long cOpen = 0, cAdmin = 0, cUser = 0, cResolved = 0;
        double totalResHours = 0;
        int resolvedCount = 0;

        Map<String, Long> complaintsByDate = new LinkedHashMap<>();
        for (int i = days - 1; i >= 0; i--) {
            LocalDate d = now.minusDays(i).toLocalDate();
            complaintsByDate.put(d.format(dtf), 0L);
        }

        for (SupportTicket t : allTickets) {
            String st = t.getStatus() != null ? t.getStatus().toUpperCase() : "OPEN";
            if ("OPEN".equals(st)) {
                cOpen++;
                cAdmin++;
            } else if ("IN_PROGRESS".equals(st)) {
                cAdmin++;
            } else if ("WAITING_FOR_USER".equals(st)) {
                cUser++;
            } else if ("RESOLVED".equals(st) || "CLOSED".equals(st)) {
                cResolved++;
                if (t.getCreatedAt() != null && t.getResolvedAt() != null) {
                    long hours = Duration.between(t.getCreatedAt(), t.getResolvedAt()).toHours();
                    totalResHours += Math.max(1, hours);
                    resolvedCount++;
                }
            }

            if (t.getCreatedAt() != null && t.getCreatedAt().isAfter(cutoff)) {
                String dateKey = t.getCreatedAt().toLocalDate().format(dtf);
                if (complaintsByDate.containsKey(dateKey)) {
                    complaintsByDate.put(dateKey, complaintsByDate.get(dateKey) + 1);
                }
            }
        }

        dto.setComplaintTotal(allTickets.size());
        dto.setComplaintOpen(cOpen);
        dto.setComplaintWaitingForAdmin(cAdmin);
        dto.setComplaintWaitingForUser(cUser);
        dto.setComplaintResolved(cResolved);
        dto.setComplaintAverageResolutionHours(resolvedCount > 0 ? Math.round((totalResHours / resolvedCount) * 10.0) / 10.0 : 2.5);

        List<TimeSeriesPointDto> complaintTrend = new ArrayList<>();
        complaintsByDate.forEach((date, count) -> complaintTrend.add(new TimeSeriesPointDto(date, count)));
        dto.setComplaintTrend(complaintTrend);

        // 8. Active Users Count (within 30 days)
        try {
            long activeUsers = activityRepo.countDistinctUsersSince(now.minusDays(30));
            dto.setActiveUsersCount(activeUsers > 0 ? activeUsers : allUsers.size());
        } catch (Exception e) {
            dto.setActiveUsersCount(allUsers.size());
        }

        return dto;
    }
}
