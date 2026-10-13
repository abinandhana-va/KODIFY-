package infosys.onlinecodeplate.service;

import infosys.onlinecodeplate.dto.AppDtos.*;
import infosys.onlinecodeplate.entity.*;
import infosys.onlinecodeplate.repository.*;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AssignmentExamService {

    private final AssignmentRepository assignmentRepo;
    private final AssignmentProblemRepository assignmentProblemRepo;
    private final AssignmentUserRepository assignmentUserRepo;
    private final AssignmentAttemptRepository attemptRepo;
    private final IntegrityEventRepository integrityRepo;
    private final ExamRecordingRepository examRecordingRepo;
    private final ProblemRepository problemRepo;
    private final UserSubmissionRepository userSubmissionRepo;
    private final ActivityService activityService;
    private final FileStorageService fileStorageService;
    private final AssignmentCreatorVerificationRepository creatorVerificationRepo;
    private final NotificationService notificationService;

    public AssignmentExamService(AssignmentRepository assignmentRepo,
                                 AssignmentProblemRepository assignmentProblemRepo,
                                 AssignmentUserRepository assignmentUserRepo,
                                 AssignmentAttemptRepository attemptRepo,
                                 IntegrityEventRepository integrityRepo,
                                 ExamRecordingRepository examRecordingRepo,
                                 ProblemRepository problemRepo,
                                 UserSubmissionRepository userSubmissionRepo,
                                 ActivityService activityService,
                                 FileStorageService fileStorageService,
                                 AssignmentCreatorVerificationRepository creatorVerificationRepo,
                                 NotificationService notificationService) {
        this.assignmentRepo = assignmentRepo;
        this.assignmentProblemRepo = assignmentProblemRepo;
        this.assignmentUserRepo = assignmentUserRepo;
        this.attemptRepo = attemptRepo;
        this.integrityRepo = integrityRepo;
        this.examRecordingRepo = examRecordingRepo;
        this.problemRepo = problemRepo;
        this.userSubmissionRepo = userSubmissionRepo;
        this.activityService = activityService;
        this.fileStorageService = fileStorageService;
        this.creatorVerificationRepo = creatorVerificationRepo;
        this.notificationService = notificationService;
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) return email;
        String[] parts = email.split("@");
        String name = parts[0];
        String domain = parts[1];
        if (name.length() <= 2) {
            return name.charAt(0) + "***@" + domain;
        }
        return name.charAt(0) + "***" + name.charAt(name.length() - 1) + "@" + domain;
    }

    @Transactional
    public ExamCodeVerificationResponseDto verifyExamAccessCode(Long assignmentId, String code, User user) {
        if (code == null || code.trim().isEmpty()) {
            throw new RuntimeException("Assignment code is required.");
        }

        Assignment assignment = assignmentRepo.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found with ID " + assignmentId));

        boolean isAdmin = user != null && Role.ADMIN.equals(user.getRole());
        boolean isCreator = user != null && assignment.getCreator() != null && assignment.getCreator().getId().equals(user.getId());

        if (isCreator) {
            throw new RuntimeException("You are the creator of this assignment. Creators cannot enter as participants; please use the Assignment Review console.");
        }

        String inputCode = code.trim().toUpperCase();

        if (assignment.getDueDate() != null && LocalDateTime.now().isAfter(assignment.getDueDate())) {
            throw new RuntimeException("This assignment has expired and is no longer accepting submissions.");
        }
        if ("CLOSED".equalsIgnoreCase(assignment.getStatus()) || "CANCELLED".equalsIgnoreCase(assignment.getStatus())) {
            throw new RuntimeException("This assignment is no longer active.");
        }

        Optional<AssignmentUser> optAu = Optional.empty();
        if (user != null) {
            optAu = assignmentUserRepo.findByAssignmentIdAndUserId(assignmentId, user.getId());
            if (!optAu.isPresent() && !isAdmin) {
                Optional<AssignmentUser> codeOwner = assignmentUserRepo.findByAssignmentIdAndAccessCode(assignmentId, inputCode);
                if (codeOwner.isPresent()) {
                    throw new RuntimeException("This assignment invitation belongs to a different KODIFY account (" + maskEmail(codeOwner.get().getUser().getEmail()) + ").");
                } else {
                    throw new RuntimeException("This assignment invitation belongs to a different KODIFY account.");
                }
            }
        } else {
            optAu = assignmentUserRepo.findByAssignmentIdAndAccessCode(assignmentId, inputCode);
            if (optAu.isEmpty()) {
                throw new RuntimeException("Invalid assignment code. Please verify the unique code from your invitation.");
            }
        }

        if (optAu.isPresent()) {
            AssignmentUser au = optAu.get();
            if (au.getAccessCode() != null && !au.getAccessCode().equalsIgnoreCase(inputCode)) {
                throw new RuntimeException("Invalid assignment code. Please verify the unique code from your invitation.");
            }
            if (au.getCodeExpiresAt() != null && LocalDateTime.now().isAfter(au.getCodeExpiresAt())) {
                throw new RuntimeException("This assignment invitation code has expired.");
            }
            if (user != null) {
                au.setStatus("CODE_VERIFIED");
                assignmentUserRepo.save(au);
            }
        }

        String orgName = "KODIFY Assessment";
        if (assignment.getCreator() != null) {
            Optional<AssignmentCreatorVerification> creatorVer = creatorVerificationRepo.findTopByUserIdOrderBySubmittedAtDesc(assignment.getCreator().getId());
            if (creatorVer.isPresent() && creatorVer.get().getOrganizationName() != null) {
                orgName = creatorVer.get().getOrganizationName();
            }
        }

        String targetUsername = user != null ? user.getUsername() : (optAu.map(au -> au.getUser().getUsername()).orElse(null));
        String targetEmail = user != null ? user.getEmail() : (optAu.map(au -> maskEmail(au.getUser().getEmail())).orElse(null));

        return new ExamCodeVerificationResponseDto(
                true,
                "Assignment code verified successfully.",
                assignment.getId(),
                assignment.getTitle(),
                orgName,
                targetUsername,
                targetEmail
        );
    }

    @Transactional
    public ParticipantIdentityVerificationResponseDto verifyParticipantIdentity(Long assignmentId,
                                                                                String username,
                                                                                String email,
                                                                                String gender,
                                                                                User user) {
        if (user == null) {
            throw new RuntimeException("Authentication required for participant verification.");
        }

        Assignment assignment = assignmentRepo.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found with ID " + assignmentId));

        boolean isCreator = assignment.getCreator() != null && assignment.getCreator().getId().equals(user.getId());
        if (isCreator) {
            throw new RuntimeException("Assignment creators cannot enter or participate in their own assignments.");
        }

        boolean usernameMatch = username != null && username.trim().equalsIgnoreCase(user.getUsername());
        boolean emailMatch = email != null && email.trim().equalsIgnoreCase(user.getEmail());

        if (!usernameMatch || !emailMatch) {
            // Log security failure
            Optional<AssignmentAttempt> optAtt = attemptRepo.findByAssignmentIdAndUserId(assignmentId, user.getId());
            if (optAtt.isPresent()) {
                IntegrityEvent event = new IntegrityEvent(
                        optAtt.get(),
                        user,
                        assignment,
                        "IDENTITY_VERIFICATION_FAILED",
                        "Entered credentials did not match authenticated user account.",
                        "CRITICAL"
                );
                integrityRepo.save(event);
            }
            throw new RuntimeException("Participant details do not match this assignment invitation.");
        }

        Optional<AssignmentUser> optAu = assignmentUserRepo.findByAssignmentIdAndUserId(assignmentId, user.getId());
        if (optAu.isPresent()) {
            AssignmentUser au = optAu.get();
            au.setGender(gender != null ? gender.trim() : "Prefer not to say");
            au.setStatus("IDENTITY_VERIFIED");
            assignmentUserRepo.save(au);
        }

        return new ParticipantIdentityVerificationResponseDto(
                true,
                "Participant identity verified successfully.",
                null
        );
    }

    @Transactional
    public AssignmentAttemptDto startOrResumeAttempt(Long assignmentId, User user) {
        Assignment assignment = assignmentRepo.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found with ID " + assignmentId));

        boolean isCreator = assignment.getCreator() != null && assignment.getCreator().getId().equals(user.getId());
        if (isCreator) {
            throw new RuntimeException("Assignment creators cannot participate in their own assignments. Please use the Assignment Review and Management interface.");
        }

        boolean isAssigned = assignmentUserRepo.existsByAssignmentIdAndUserId(assignmentId, user.getId());
        boolean isAdmin = Role.ADMIN.equals(user.getRole());

        if (!isAssigned && !isAdmin) {
            throw new RuntimeException("Access denied. You are not enrolled in this assessment.");
        }

        List<AssignmentProblem> apList = assignmentProblemRepo.findByAssignmentIdOrderByProblemOrderAsc(assignmentId);
        int totalQuestions = apList.size();

        Optional<AssignmentAttempt> optAttempt = attemptRepo.findByAssignmentIdAndUserId(assignmentId, user.getId());
        AssignmentAttempt attempt;

        LocalDateTime now = LocalDateTime.now();

        if (optAttempt.isPresent()) {
            attempt = optAttempt.get();
            // Check for server-authoritative time expiry
            if ("IN_PROGRESS".equals(attempt.getStatus()) && attempt.getExpiresAt() != null && now.isAfter(attempt.getExpiresAt())) {
                attempt.setStatus("TIME_EXPIRED");
                finalizeAttemptScore(attempt, apList, user);
                attempt = attemptRepo.save(attempt);
            }
        } else {
            int durationMins = (assignment.getDurationMinutes() != null && assignment.getDurationMinutes() > 0)
                    ? assignment.getDurationMinutes()
                    : 60;
            LocalDateTime startedAt = now;
            LocalDateTime expiresAt = startedAt.plusMinutes(durationMins);

            if (assignment.getDueDate() != null && assignment.getDueDate().isBefore(expiresAt)) {
                expiresAt = assignment.getDueDate();
            }

            attempt = new AssignmentAttempt(assignment, user, startedAt, expiresAt, totalQuestions);
            attempt = attemptRepo.save(attempt);

            // Update AssignmentUser status and startedAt
            Optional<AssignmentUser> optAu = assignmentUserRepo.findByAssignmentIdAndUserId(assignmentId, user.getId());
            if (optAu.isPresent()) {
                AssignmentUser au = optAu.get();
                au.setStatus("IN_PROGRESS");
                au.setStartedAt(startedAt);
                assignmentUserRepo.save(au);
            }

            activityService.logActivity(
                    user,
                    "Secure Exam Started",
                    "Started assessment attempt for '" + assignment.getTitle() + "'."
            );
        }

        return mapToAttemptDto(attempt, apList, user);
    }

    @Transactional
    public AssignmentAttemptDto recordIntegrityEvent(Long attemptId, IntegrityEventDto req, User user) {
        AssignmentAttempt attempt = attemptRepo.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("Assessment attempt not found with ID " + attemptId));

        if (!attempt.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Access denied. Attempt does not belong to current user.");
        }

        if (!"IN_PROGRESS".equals(attempt.getStatus())) {
            return mapToAttemptDto(attempt, null, user);
        }

        String eventType = req.getEventType() != null ? req.getEventType().trim().toUpperCase() : "UNKNOWN";
        String severity = req.getSeverity() != null ? req.getSeverity().trim().toUpperCase() : "WARNING";

        IntegrityEvent event = new IntegrityEvent(
                attempt,
                user,
                attempt.getAssignment(),
                eventType,
                req.getMetadata(),
                severity
        );
        integrityRepo.save(event);

        int currentViolations = attempt.getIntegrityViolationCount() + 1;
        attempt.setIntegrityViolationCount(currentViolations);

        // Three-strike violation rule: >= 3 violations flags attempt for review
        if (currentViolations >= 3) {
            boolean wasFlagged = Boolean.TRUE.equals(attempt.getFlaggedForReview());
            attempt.setFlaggedForReview(true);
            // Update AssignmentUser
            Optional<AssignmentUser> optAu = assignmentUserRepo.findByAssignmentIdAndUserId(attempt.getAssignment().getId(), user.getId());
            if (optAu.isPresent()) {
                AssignmentUser au = optAu.get();
                au.setStatus("FLAGGED_FOR_REVIEW");
                assignmentUserRepo.save(au);
            }
            if (!wasFlagged && notificationService != null && attempt.getAssignment().getCreator() != null) {
                try {
                    String participantName = user.getName() != null && !user.getName().isBlank() ? user.getName() : user.getUsername();
                    String flagMsg = "Participant " + participantName + " was flagged during '" + attempt.getAssignment().getTitle() + "'. View security report.";
                    notificationService.createNotification(
                            attempt.getAssignment().getCreator(),
                            "Security Alert: Participant Flagged",
                            flagMsg,
                            "SECURITY_ALERT",
                            "/assignments/" + attempt.getAssignment().getId()
                    );
                } catch (Exception ignored) {}
            }
        }

        attempt = attemptRepo.save(attempt);

        List<AssignmentProblem> apList = assignmentProblemRepo.findByAssignmentIdOrderByProblemOrderAsc(attempt.getAssignment().getId());
        return mapToAttemptDto(attempt, apList, user);
    }

    @Transactional
    public AssignmentAttemptDto submitAttempt(Long attemptId, User user) {
        AssignmentAttempt attempt = attemptRepo.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("Assessment attempt not found with ID " + attemptId));

        if (!attempt.getUser().getId().equals(user.getId()) && !Role.ADMIN.equals(user.getRole())) {
            throw new RuntimeException("Access denied. Attempt does not belong to current user.");
        }

        List<AssignmentProblem> apList = assignmentProblemRepo.findByAssignmentIdOrderByProblemOrderAsc(attempt.getAssignment().getId());
        finalizeAttemptScore(attempt, apList, attempt.getUser());
        attempt.setSubmittedAt(LocalDateTime.now());
        attempt.setStatus("COMPLETED");
        attempt = attemptRepo.save(attempt);

        // Update AssignmentUser completedAt and status
        Optional<AssignmentUser> optAu = assignmentUserRepo.findByAssignmentIdAndUserId(attempt.getAssignment().getId(), attempt.getUser().getId());
        if (optAu.isPresent()) {
            AssignmentUser au = optAu.get();
            au.setCompletedAt(LocalDateTime.now());
            au.setStatus("COMPLETED");
            assignmentUserRepo.save(au);
        }

        if (notificationService != null && attempt.getAssignment().getCreator() != null) {
            try {
                String candidateName = attempt.getUser().getName() != null && !attempt.getUser().getName().isBlank()
                        ? attempt.getUser().getName()
                        : attempt.getUser().getUsername();
                String compMsg = "Participant " + candidateName + " completed assessment '" + attempt.getAssignment().getTitle() + "' with score " + attempt.getScore() + ".";
                notificationService.createNotification(
                        attempt.getAssignment().getCreator(),
                        "Assessment Completed",
                        compMsg,
                        "ASSIGNMENT_COMPLETED",
                        "/assignments/" + attempt.getAssignment().getId()
                );
            } catch (Exception ignored) {}
        }

        activityService.logActivity(
                attempt.getUser(),
                "Secure Exam Submitted",
                "Submitted assessment '" + attempt.getAssignment().getTitle() + "' with score " + attempt.getScore() + "."
        );

        return mapToAttemptDto(attempt, apList, user);
    }

    @Transactional(readOnly = true)
    public AssignmentAttemptDto getAttemptStatus(Long assignmentId, User user) {
        AssignmentAttempt attempt = attemptRepo.findByAssignmentIdAndUserId(assignmentId, user.getId())
                .orElse(null);

        if (attempt == null) {
            return null;
        }

        List<AssignmentProblem> apList = assignmentProblemRepo.findByAssignmentIdOrderByProblemOrderAsc(assignmentId);
        return mapToAttemptDto(attempt, apList, user);
    }

    @Transactional
    public ExamRecordingDto saveExamRecording(Long attemptId, String type, MultipartFile file, User user) {
        AssignmentAttempt attempt = attemptRepo.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("Assessment attempt not found with ID " + attemptId));

        if (!attempt.getUser().getId().equals(user.getId()) && !Role.ADMIN.equals(user.getRole())) {
            throw new RuntimeException("Access denied. Attempt does not belong to current user.");
        }

        String storageRef = fileStorageService.storeExamRecording(file, attemptId, type);

        ExamRecording recording = new ExamRecording(
                attempt,
                attempt.getUser(),
                attempt.getAssignment(),
                type,
                storageRef,
                file.getSize(),
                file.getContentType()
        );
        recording = examRecordingRepo.save(recording);

        return mapToRecordingDto(recording);
    }

    @Transactional(readOnly = true)
    public List<ExamRecordingDto> getAttemptRecordings(Long attemptId, User currentUser) {
        AssignmentAttempt attempt = attemptRepo.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("Attempt not found with ID " + attemptId));

        Assignment assignment = attempt.getAssignment();
        boolean isCreator = assignment.getCreator() != null && assignment.getCreator().getId().equals(currentUser.getId());
        boolean isAdmin = Role.ADMIN.equals(currentUser.getRole());

        if (!isCreator && !isAdmin) {
            throw new RuntimeException("Access denied. Only the assignment host or administrator can view participant recordings.");
        }

        List<ExamRecording> recordings = examRecordingRepo.findByAttemptId(attemptId);
        return recordings.stream().map(this::mapToRecordingDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Resource getRecordingStreamResource(Long recordingId, User currentUser) {
        ExamRecording recording = examRecordingRepo.findById(recordingId)
                .orElseThrow(() -> new RuntimeException("Recording not found with ID " + recordingId));

        Assignment assignment = recording.getAssignment();
        boolean isCreator = assignment.getCreator() != null && assignment.getCreator().getId().equals(currentUser.getId());
        boolean isAdmin = Role.ADMIN.equals(currentUser.getRole());

        if (!isCreator && !isAdmin) {
            throw new RuntimeException("Access denied. Only the assignment host or administrator can stream recordings.");
        }

        return fileStorageService.loadAsResource(recording.getStorageReference());
    }

    @Transactional(readOnly = true)
    public IntegrityReportDto getIntegrityReport(Long attemptId, User currentUser) {
        if (currentUser == null) {
            throw new RuntimeException("Authentication required.");
        }
        AssignmentAttempt attempt = attemptRepo.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("Attempt not found with ID " + attemptId));

        Assignment assignment = attempt.getAssignment();
        boolean isOwner = attempt.getUser() != null && attempt.getUser().getId().equals(currentUser.getId());
        boolean isCreator = assignment != null && assignment.getCreator() != null && assignment.getCreator().getId().equals(currentUser.getId());
        boolean isAdmin = Role.ADMIN.equals(currentUser.getRole());

        if (!isOwner && !isCreator && !isAdmin) {
            throw new RuntimeException("Access denied. Only the candidate, assignment creator, or administrator can view integrity reports.");
        }

        List<IntegrityEvent> events = integrityRepo.findByAttemptIdOrderByTimestampAsc(attemptId);

        IntegrityReportDto report = new IntegrityReportDto();
        report.setAttemptId(attempt.getId());
        report.setAssignmentId(assignment.getId());
        report.setAssignmentTitle(assignment.getTitle());
        report.setUserId(attempt.getUser().getId());
        report.setUsername(attempt.getUser().getUsername());
        report.setName(attempt.getUser().getName());
        report.setStartedAt(attempt.getStartedAt());
        report.setSubmittedAt(attempt.getSubmittedAt());
        report.setAttemptStatus(attempt.getStatus());
        report.setScore(attempt.getScore());
        report.setFlaggedForReview(attempt.getFlaggedForReview());

        int fsExits = 0;
        int tabSwitches = 0;
        int blurs = 0;
        int pasteAttempts = 0;
        int copyAttempts = 0;
        int other = 0;

        List<IntegrityEventDto> timeline = new ArrayList<>();
        for (IntegrityEvent e : events) {
            IntegrityEventDto eDto = new IntegrityEventDto();
            eDto.setId(e.getId());
            eDto.setAttemptId(attemptId);
            eDto.setUserId(e.getUser().getId());
            eDto.setUsername(e.getUser().getUsername());
            eDto.setAssignmentId(assignment.getId());
            eDto.setEventType(e.getEventType());
            eDto.setTimestamp(e.getTimestamp());
            eDto.setMetadata(e.getMetadata());
            eDto.setSeverity(e.getSeverity());
            timeline.add(eDto);

            String type = e.getEventType() != null ? e.getEventType().toUpperCase() : "";
            if (type.contains("FULLSCREEN")) fsExits++;
            else if (type.contains("TAB")) tabSwitches++;
            else if (type.contains("BLUR")) blurs++;
            else if (type.contains("PASTE")) pasteAttempts++;
            else if (type.contains("COPY") || type.contains("CUT")) copyAttempts++;
            else other++;
        }

        report.setFullscreenExits(fsExits);
        report.setTabSwitches(tabSwitches);
        report.setWindowBlurs(blurs);
        report.setPasteAttempts(pasteAttempts);
        report.setCopyAttempts(copyAttempts);
        report.setOtherViolations(other);
        report.setTotalViolations(events.size());
        report.setTimeline(timeline);

        return report;
    }

    private void finalizeAttemptScore(AssignmentAttempt attempt, List<AssignmentProblem> apList, User user) {
        List<Long> solved = userSubmissionRepo.findSolvedProblemIdsByUserId(user.getId(), "ACCEPTED");
        Set<Long> userSolvedSet = new HashSet<>(solved);

        int solvedCount = 0;
        int totalScore = 0;
        for (AssignmentProblem ap : apList) {
            if (ap.getProblem() != null && userSolvedSet.contains(ap.getProblem().getId())) {
                solvedCount++;
                totalScore += (ap.getPoints() != null ? ap.getPoints() : 100);
            }
        }
        attempt.setCompletedQuestions(solvedCount);
        attempt.setScore(totalScore);
    }

    private AssignmentAttemptDto mapToAttemptDto(AssignmentAttempt a, List<AssignmentProblem> apList, User user) {
        AssignmentAttemptDto dto = new AssignmentAttemptDto();
        dto.setId(a.getId());
        dto.setAssignmentId(a.getAssignment().getId());
        dto.setAssignmentTitle(a.getAssignment().getTitle());
        dto.setUserId(a.getUser().getId());
        dto.setUsername(a.getUser().getUsername());
        dto.setUserName(a.getUser().getName());
        dto.setStartedAt(a.getStartedAt());
        dto.setExpiresAt(a.getExpiresAt());
        dto.setSubmittedAt(a.getSubmittedAt());
        dto.setStatus(a.getStatus());
        dto.setScore(a.getScore());
        dto.setCompletedQuestions(a.getCompletedQuestions());
        dto.setTotalQuestions(a.getTotalQuestions());
        dto.setIntegrityViolationCount(a.getIntegrityViolationCount());
        dto.setFlaggedForReview(a.getFlaggedForReview());
        dto.setSecureMode(a.getAssignment().getSecureMode());

        LocalDateTime now = LocalDateTime.now();
        if (a.getExpiresAt() != null) {
            long remaining = ChronoUnit.SECONDS.between(now, a.getExpiresAt());
            dto.setRemainingSeconds(Math.max(0, remaining));
        } else {
            dto.setRemainingSeconds(3600);
        }

        if (apList != null) {
            List<Long> solvedProblemIds = userSubmissionRepo.findSolvedProblemIdsByUserId(user.getId(), "ACCEPTED");
            Set<Long> solvedSet = new HashSet<>(solvedProblemIds);

            List<AssignmentProblemDto> pDtos = new ArrayList<>();
            for (AssignmentProblem ap : apList) {
                Problem p = ap.getProblem();
                if (p == null) continue;

                AssignmentProblemDto pDto = new AssignmentProblemDto();
                pDto.setProblemId(p.getId());
                pDto.setTitle(p.getTitle());
                pDto.setDifficulty(p.getDifficulty());
                pDto.setConcept(p.getConcept());
                pDto.setPoints(ap.getPoints());
                pDto.setProblemOrder(ap.getProblemOrder());
                pDto.setSolved(solvedSet.contains(p.getId()));
                pDto.setDescription(p.getDescription());
                pDto.setConstraints(p.getConstraints());
                pDto.setStarterCodeC(p.getStarterCodeC());
                pDto.setStarterCodePython(p.getStarterCodePython());
                pDto.setStarterCodeJava(p.getStarterCodeJava());
                pDto.setStarterCodeCpp(p.getStarterCodeCpp());
                pDto.setStarterCodeJs(p.getStarterCodeJs());
                pDto.setStarterCodeGo(p.getStarterCodeGo());
                pDto.setStarterCodeRust(p.getStarterCodeRust());
                pDto.setAllowedLanguages(p.getAllowedLanguages());
                pDto.setQuestionType(p.getQuestionType());
                pDto.setImageUrl(p.getImageUrl());
                pDto.setOptions(p.getOptions());

                List<TestCaseDto> tcList = new ArrayList<>();
                if (p.getTestCasesList() != null) {
                    for (TestCase tc : p.getTestCasesList()) {
                        if (tc.getHidden() == null || !tc.getHidden()) {
                            tcList.add(new TestCaseDto(tc.getInput(), tc.getExpectedOutput(), false));
                        }
                    }
                }
                pDto.setTestCasesList(tcList);

                pDtos.add(pDto);
            }
            dto.setProblems(pDtos);
        }

        return dto;
    }

    private ExamRecordingDto mapToRecordingDto(ExamRecording r) {
        ExamRecordingDto dto = new ExamRecordingDto();
        dto.setId(r.getId());
        dto.setAttemptId(r.getAttempt().getId());
        dto.setParticipantId(r.getParticipant().getId());
        dto.setParticipantUsername(r.getParticipant().getUsername());
        dto.setParticipantName(r.getParticipant().getName());
        dto.setAssignmentId(r.getAssignment().getId());
        dto.setType(r.getType());
        dto.setStorageReference(r.getStorageReference());
        dto.setFileSizeBytes(r.getFileSizeBytes());
        dto.setContentType(r.getContentType());
        dto.setStartedAt(r.getStartedAt());
        dto.setEndedAt(r.getEndedAt());
        dto.setStatus(r.getStatus());
        dto.setCreatedAt(r.getCreatedAt());
        return dto;
    }
}
