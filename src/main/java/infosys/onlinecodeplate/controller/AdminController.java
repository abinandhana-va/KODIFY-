package infosys.onlinecodeplate.controller;

import infosys.onlinecodeplate.dto.AppDtos.UserContestStatsDto;
import infosys.onlinecodeplate.dto.Dtos.*;
import infosys.onlinecodeplate.entity.*;
import infosys.onlinecodeplate.repository.*;
import infosys.onlinecodeplate.service.*;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    
    private final UserRepository userRepository;
    private final AuthService authService;
    private final ProblemRepository problemRepo;
    private final UserSubmissionRepository submissionRepo;
    private final AchievementService achievementService;
    private final BadgeService badgeService;
    private final CertificateService certificateService;
    private final ActivityService activityService;
    private final AssignmentUserRepository assignmentUserRepo;
    private final AssignmentAttemptRepository assignmentAttemptRepo;
    private final AssignmentCreatorVerificationRepository verificationRepo;
    private final AssignmentRepository assignmentRepo;
    private final ContestRepository contestRepo;
    private final ContestParticipantRepository contestParticipantRepo;
    private final ContestSubmissionRepository contestSubmissionRepo;
    private final ExamRecordingRepository examRecordingRepo;
    private final IntegrityEventRepository integrityEventRepo;
    private final TestCaseResultRepository testCaseResultRepo;
    private final UserActivityRepository userActivityRepo;
    private final UserBadgeRepository userBadgeRepo;
    private final UserCertificateRepository userCertificateRepo;
    private final AdminAnalyticsService adminAnalyticsService;

    public AdminController(UserRepository userRepository,
                           AuthService authService,
                           ProblemRepository problemRepo,
                           UserSubmissionRepository submissionRepo,
                           AchievementService achievementService,
                           BadgeService badgeService,
                           CertificateService certificateService,
                           ActivityService activityService,
                           AssignmentUserRepository assignmentUserRepo,
                           AssignmentAttemptRepository assignmentAttemptRepo,
                           AssignmentCreatorVerificationRepository verificationRepo,
                           AssignmentRepository assignmentRepo,
                           ContestRepository contestRepo,
                           ContestParticipantRepository contestParticipantRepo,
                           ContestSubmissionRepository contestSubmissionRepo,
                           ExamRecordingRepository examRecordingRepo,
                           IntegrityEventRepository integrityEventRepo,
                           TestCaseResultRepository testCaseResultRepo,
                           UserActivityRepository userActivityRepo,
                           UserBadgeRepository userBadgeRepo,
                           UserCertificateRepository userCertificateRepo,
                           AdminAnalyticsService adminAnalyticsService) {
        this.userRepository = userRepository;
        this.authService = authService;
        this.problemRepo = problemRepo;
        this.submissionRepo = submissionRepo;
        this.achievementService = achievementService;
        this.badgeService = badgeService;
        this.certificateService = certificateService;
        this.activityService = activityService;
        this.assignmentUserRepo = assignmentUserRepo;
        this.assignmentAttemptRepo = assignmentAttemptRepo;
        this.verificationRepo = verificationRepo;
        this.assignmentRepo = assignmentRepo;
        this.contestRepo = contestRepo;
        this.contestParticipantRepo = contestParticipantRepo;
        this.contestSubmissionRepo = contestSubmissionRepo;
        this.examRecordingRepo = examRecordingRepo;
        this.integrityEventRepo = integrityEventRepo;
        this.testCaseResultRepo = testCaseResultRepo;
        this.userActivityRepo = userActivityRepo;
        this.userBadgeRepo = userBadgeRepo;
        this.userCertificateRepo = userCertificateRepo;
        this.adminAnalyticsService = adminAnalyticsService;
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        List<User> users = userRepository.findAll();
        List<UserDto> dtos = users.stream()
                .map(authService::mapToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<?> getUserProfile(@PathVariable Long id) {
        @SuppressWarnings("null")
        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        AdminUserProfileDto dto = new AdminUserProfileDto();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole().name());
        dto.setStatus(user.getStatus());
        dto.setBio(user.getBio());
        dto.setContact(user.getContact());
        dto.setHostVerificationStatus(user.getHostVerificationStatus());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());

        // Solved problem metrics
        long solvedTotal = achievementService.countUniqueSolvedProblems(user.getId());
        long solvedEasy = submissionRepo.countSolvedProblemsByUserIdAndDifficulty(user.getId(), "ACCEPTED", "EASY");
        long solvedMedium = submissionRepo.countSolvedProblemsByUserIdAndDifficulty(user.getId(), "ACCEPTED", "MEDIUM");
        long solvedHard = submissionRepo.countSolvedProblemsByUserIdAndDifficulty(user.getId(), "ACCEPTED", "HARD");
        dto.setSolvedCount(solvedTotal);
        dto.setEasySolved(solvedEasy);
        dto.setMediumSolved(solvedMedium);
        dto.setHardSolved(solvedHard);

        // Contest performance
        UserContestStatsDto contestStats = achievementService.getUserContestStats(user.getId());
        dto.setContestsParticipated(contestStats.getParticipatedCount());
        dto.setContestsConducted(contestStats.getConductedCount());
        dto.setContestWins(contestStats.getWinsCount());
        dto.setCurrentStreak(contestStats.getCurrentStreak());
        dto.setLongestStreak(contestStats.getLongestStreak());

        // Achievements
        dto.setBadges(badgeService.getAllBadgesForUser(user));
        dto.setCertificates(certificateService.getAllCertificatesForUser(user));

        // Recent submissions
        List<UserSubmission> submissions = submissionRepo.findByUserIdOrderByCreatedAtDesc(user.getId());
        List<AdminUserSubmissionDto> submissionDtos = submissions.stream()
                .limit(20)
                .map(s -> {
                    AdminUserSubmissionDto subDto = new AdminUserSubmissionDto();
                    subDto.setId(s.getId());
                    if (s.getProblem() != null) {
                        subDto.setProblemId(s.getProblem().getId());
                        subDto.setProblemTitle(s.getProblem().getTitle());
                        subDto.setProblemDifficulty(s.getProblem().getDifficulty());
                    }
                    subDto.setStatus(s.getStatus());
                    subDto.setLanguage(s.getLanguage());
                    subDto.setRuntime(s.getRuntime());
                    subDto.setPassedTestCases(s.getPassedTestCases());
                    subDto.setTotalTestCases(s.getTotalTestCases());
                    subDto.setCreatedAt(s.getCreatedAt());
                    return subDto;
                })
                .collect(Collectors.toList());
        dto.setRecentSubmissions(submissionDtos);

        // Assignments
        List<AssignmentUser> userAssignments = assignmentUserRepo.findByUserId(user.getId());
        List<AdminUserAssignmentDto> assignmentDtos = userAssignments.stream()
                .map(au -> {
                    AdminUserAssignmentDto aDto = new AdminUserAssignmentDto();
                    if (au.getAssignment() != null) {
                        aDto.setAssignmentId(au.getAssignment().getId());
                        aDto.setAssignmentTitle(au.getAssignment().getTitle());
                    }
                    aDto.setStatus(au.getStatus());
                    aDto.setAccessCode(au.getAccessCode());
                    aDto.setAssignedAt(au.getAssignedAt());
                    aDto.setCompletedAt(au.getCompletedAt());
                    
                    if (au.getAssignment() != null) {
                        assignmentAttemptRepo.findByAssignmentIdAndUserId(au.getAssignment().getId(), user.getId())
                                .ifPresent(att -> aDto.setScore(att.getScore()));
                    }
                    return aDto;
                })
                .collect(Collectors.toList());
        dto.setAssignments(assignmentDtos);

        // Creator verification
        verificationRepo.findTopByUserIdOrderBySubmittedAtDesc(user.getId()).ifPresent(v -> {
            AdminUserVerificationDto vDto = new AdminUserVerificationDto();
            vDto.setId(v.getId());
            vDto.setOrganizationName(v.getOrganizationName());
            vDto.setMaskedPan(v.getMaskedPan());
            vDto.setMaskedAadhaar(v.getMaskedAadhaar());
            vDto.setGovernmentId1FileReference(v.getGovernmentId1FileReference());
            vDto.setGovernmentId2FileReference(v.getGovernmentId2FileReference());
            vDto.setMemberProofFileReference(v.getMemberProofFileReference());
            vDto.setStatus(v.getStatus());
            vDto.setSubmittedAt(v.getSubmittedAt());
            vDto.setReviewedAt(v.getReviewedAt());
            vDto.setReviewedBy(v.getReviewedBy());
            vDto.setAdminComment(v.getAdminComment());
            dto.setCreatorVerification(vDto);
        });

        return ResponseEntity.ok(dto);
    }

    @PatchMapping("/users/{id}/status")
    public ResponseEntity<?> updateUserStatus(@PathVariable Long id,
                                              @Valid @RequestBody UserStatusUpdateRequest request,
                                              Authentication authentication) {
        @SuppressWarnings("null")
        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        // Self and Admin Protection
        String callerUsername = authentication.getName();
        if (user.getRole() == Role.ADMIN || user.getEmail().equalsIgnoreCase(callerUsername) || user.getUsername().equalsIgnoreCase(callerUsername)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Cannot modify the status of an administrator account."));
        }

        String targetStatus = request.getStatus().trim().toUpperCase();
        if (!"ACTIVE".equals(targetStatus) && !"BLOCKED".equals(targetStatus)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid status. Supported statuses: ACTIVE, BLOCKED"));
        }

        user.setStatus(targetStatus);
        userRepository.save(user);

        activityService.logActivity(user, "Status Changed", "Account status updated to " + targetStatus + " by Administrator");

        return ResponseEntity.ok(authService.mapToDto(user));
    }

    @SuppressWarnings("null")
    @DeleteMapping("/users/{id}")
    @Transactional
    public ResponseEntity<?> deleteUser(@PathVariable Long id, Authentication authentication) {
        @SuppressWarnings("null")
        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        // Self and Admin Protection
        String callerUsername = authentication.getName();
        if (user.getRole() == Role.ADMIN || user.getEmail().equalsIgnoreCase(callerUsername) || user.getUsername().equalsIgnoreCase(callerUsername)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Cannot delete an administrator account."));
        }

        // 1. Reassign created assignments and contests to default admin so system assets & shared problems remain intact
        User adminFallback = userRepository.findByEmail("kodifyofficial@gmail.com")
                .or(() -> userRepository.findByEmail("admin@123"))
                .orElseGet(() -> userRepository.findByEmail(callerUsername).orElse(null));

        if (adminFallback != null) {
            List<Assignment> createdAssignments = assignmentRepo.findByCreatorIdOrderByCreatedAtDesc(id);
            for (Assignment a : createdAssignments) {
                a.setCreator(adminFallback);
                assignmentRepo.save(a);
            }

            List<Contest> createdContests = contestRepo.findByOrganizerIdOrderByStartTimeDesc(id);
            for (Contest c : createdContests) {
                c.setOrganizer(adminFallback);
                contestRepo.save(c);
            }
        }

        // 2. Controlled cleanup of dependent user records
        List<UserSubmission> submissions = submissionRepo.findByUserId(id);
        for (UserSubmission s : submissions) {
            List<TestCaseResult> tcResults = testCaseResultRepo.findBySubmissionId(s.getId());
            if (!tcResults.isEmpty()) {
                testCaseResultRepo.deleteAll(tcResults);
            }
        }
        submissionRepo.deleteAll(submissions);

        examRecordingRepo.deleteAll(examRecordingRepo.findByParticipantId(id));
        integrityEventRepo.deleteAll(integrityEventRepo.findByUserIdOrderByTimestampDesc(id));
        assignmentAttemptRepo.deleteAll(assignmentAttemptRepo.findByUserIdOrderByStartedAtDesc(id));
        assignmentUserRepo.deleteAll(assignmentUserRepo.findByUserId(id));

        contestSubmissionRepo.deleteAll(contestSubmissionRepo.findByUserIdOrderByCreatedAtDesc(id));
        contestParticipantRepo.deleteAll(contestParticipantRepo.findByUserId(id));

        userBadgeRepo.deleteAll(userBadgeRepo.findByUserId(id));
        userCertificateRepo.deleteAll(userCertificateRepo.findByUserId(id));
        userActivityRepo.deleteAll(userActivityRepo.findByUserIdOrderByCreatedAtDesc(id));
        verificationRepo.deleteAll(verificationRepo.findByUserIdOrderBySubmittedAtDesc(id));

        // 3. Delete user account
        userRepository.delete(user);

        return ResponseEntity.ok(Map.of("message", "User deleted successfully."));
    }

    @GetMapping("/analytics")
    public ResponseEntity<infosys.onlinecodeplate.dto.AppDtos.AdminAnalyticsDto> getAnalytics(
            @RequestParam(required = false, defaultValue = "30D") String timeframe) {
        return ResponseEntity.ok(adminAnalyticsService.getAnalytics(timeframe));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("totalProblems", problemRepo.count());
        stats.put("totalSubmissions", submissionRepo.count());
        return ResponseEntity.ok(stats);
    }
}
