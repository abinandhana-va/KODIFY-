package infosys.onlinecodeplate.service;

import infosys.onlinecodeplate.dto.AppDtos.*;
import infosys.onlinecodeplate.entity.*;
import infosys.onlinecodeplate.repository.*;
import infosys.onlinecodeplate.service.DockerSandboxService.EvaluationResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ContestService {

    private final ContestRepository contestRepo;
    private final ContestProblemRepository contestProblemRepo;
    private final ContestParticipantRepository contestParticipantRepo;
    private final ContestSubmissionRepository contestSubmissionRepo;
    private final ProblemRepository problemRepo;
    private final UserRepository userRepo;
    private final DockerSandboxService dockerSandboxService;
    private final ActivityService activityService;
    private final BadgeService badgeService;
    private final EmailService emailService;
    private final NotificationService notificationService;
    private final CertificateService certificateService;

    @Autowired
    public ContestService(ContestRepository contestRepo,
                          ContestProblemRepository contestProblemRepo,
                          ContestParticipantRepository contestParticipantRepo,
                          ContestSubmissionRepository contestSubmissionRepo,
                          ProblemRepository problemRepo,
                          UserRepository userRepo,
                          DockerSandboxService dockerSandboxService,
                          ActivityService activityService,
                          BadgeService badgeService,
                          EmailService emailService,
                          NotificationService notificationService,
                          CertificateService certificateService) {
        this.contestRepo = contestRepo;
        this.contestProblemRepo = contestProblemRepo;
        this.contestParticipantRepo = contestParticipantRepo;
        this.contestSubmissionRepo = contestSubmissionRepo;
        this.problemRepo = problemRepo;
        this.userRepo = userRepo;
        this.dockerSandboxService = dockerSandboxService;
        this.activityService = activityService;
        this.badgeService = badgeService;
        this.emailService = emailService;
        this.notificationService = notificationService;
        this.certificateService = certificateService;
    }

    public ContestService(ContestRepository contestRepo,
                          ContestProblemRepository contestProblemRepo,
                          ContestParticipantRepository contestParticipantRepo,
                          ContestSubmissionRepository contestSubmissionRepo,
                          ProblemRepository problemRepo,
                          UserRepository userRepo,
                          DockerSandboxService dockerSandboxService,
                          ActivityService activityService,
                          BadgeService badgeService,
                          EmailService emailService,
                          NotificationService notificationService) {
        this(contestRepo, contestProblemRepo, contestParticipantRepo, contestSubmissionRepo, problemRepo, userRepo, dockerSandboxService, activityService, badgeService, emailService, notificationService, null);
    }

    @Transactional(readOnly = true)
    public List<ContestDto> getAllContests(User currentUser, String filter, String searchQuery) {
        List<Contest> contests = contestRepo.findPublicContests();
        LocalDateTime now = LocalDateTime.now();

        // Update ongoing / completed statuses on the fly for accurate filtering
        for (Contest c : contests) {
            updateDynamicStatus(c, now);
        }

        List<ContestDto> dtos = new ArrayList<>();
        for (Contest c : contests) {
            if ("CANCELLED".equalsIgnoreCase(c.getStatus()) || "DRAFT".equalsIgnoreCase(c.getStatus())) {
                continue;
            }

            // Filter logic
            if (filter != null && !filter.isBlank() && !"ALL".equalsIgnoreCase(filter)) {
                String dynamicStatus = computeDynamicStatus(c, now);
                if (!dynamicStatus.equalsIgnoreCase(filter.trim())) {
                    continue;
                }
            }

            if (searchQuery != null && !searchQuery.isBlank()) {
                String q = searchQuery.trim().toLowerCase();
                boolean matchTitle = c.getTitle() != null && c.getTitle().toLowerCase().contains(q);
                boolean matchOrgName = c.getOrganizationName() != null && c.getOrganizationName().toLowerCase().contains(q);
                boolean matchDesc = c.getDescription() != null && c.getDescription().toLowerCase().contains(q);
                boolean matchOrg = c.getOrganizer() != null && (
                        (c.getOrganizer().getName() != null && c.getOrganizer().getName().toLowerCase().contains(q)) ||
                        (c.getOrganizer().getUsername() != null && c.getOrganizer().getUsername().toLowerCase().contains(q))
                );
                if (!matchTitle && !matchOrgName && !matchDesc && !matchOrg) {
                    continue;
                }
            }

            dtos.add(mapToDto(c, currentUser, now));
        }

        return dtos;
    }

    @Transactional(readOnly = true)
    public ContestDetailDto getContestDetail(Long contestId, User currentUser) {
        Contest contest = contestRepo.findById(contestId)
                .orElseThrow(() -> new RuntimeException("Contest not found with ID " + contestId));

        LocalDateTime now = LocalDateTime.now();
        updateDynamicStatus(contest, now);

        boolean isOrganizer = currentUser != null && contest.getOrganizer() != null && contest.getOrganizer().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser != null && Role.ADMIN.equals(currentUser.getRole());
        boolean isInvited = currentUser != null && contestParticipantRepo.existsByContestIdAndUserId(contestId, currentUser.getId());

        // Access control for private contests
        if (contest.isPrivate() && !isOrganizer && !isAdmin && !isInvited) {
            throw new RuntimeException("Access denied. This is a private contest open only to invited participants.");
        }

        ContestDetailDto dto = new ContestDetailDto();
        copyDtoFields(mapToDto(contest, currentUser, now), dto);

        boolean hasStarted = !now.isBefore(contest.getStartTime());

        List<ContestProblem> cpList = contestProblemRepo.findByContestIdOrderByQuestionOrderAsc(contestId);
        List<ContestQuestionDto> qDtos = new ArrayList<>();

        List<Long> solvedProblemIds = (currentUser != null)
                ? contestSubmissionRepo.findSolvedProblemIdsInContest(contestId, currentUser.getId(), "ACCEPTED")
                : Collections.emptyList();

        int totalUserScore = 0;
        int solvedCount = solvedProblemIds.size();

        for (ContestProblem cp : cpList) {
            Problem p = cp.getProblem();
            if (p == null) continue;

            ContestQuestionDto qDto = new ContestQuestionDto();
            qDto.setProblemId(p.getId());
            qDto.setTitle(p.getTitle());
            qDto.setDifficulty(p.getDifficulty());
            qDto.setConcept(p.getConcept());
            qDto.setPoints(cp.getPoints());
            qDto.setQuestionOrder(cp.getQuestionOrder());

            boolean isSolved = solvedProblemIds.contains(p.getId());
            qDto.setSolved(isSolved);
            if (isSolved) {
                totalUserScore += cp.getPoints();
            }

            // Only expose problem statement & test cases if contest has started or user is organizer/admin
            if (hasStarted || isOrganizer || isAdmin) {
                qDto.setDescription(p.getDescription());
                qDto.setConstraints(p.getConstraints());
                qDto.setStarterCodeC(p.getStarterCodeC());
                qDto.setStarterCodePython(p.getStarterCodePython());
                qDto.setStarterCodeJava(p.getStarterCodeJava());
                qDto.setStarterCodeCpp(p.getStarterCodeCpp());
                qDto.setStarterCodeJs(p.getStarterCodeJs());
                qDto.setStarterCodeGo(p.getStarterCodeGo());
                qDto.setStarterCodeRust(p.getStarterCodeRust());
                qDto.setAllowedLanguages(p.getAllowedLanguages());

                List<TestCaseDto> tcList = new ArrayList<>();
                if (p.getTestCasesList() != null) {
                    for (TestCase tc : p.getTestCasesList()) {
                        if (tc.getHidden() == null || !tc.getHidden()) {
                            tcList.add(new TestCaseDto(tc.getInput(), tc.getExpectedOutput(), false));
                        }
                    }
                }
                qDto.setTestCasesList(tcList);

                List<HintDto> hints = new ArrayList<>();
                if (p.getHintsList() != null) {
                    for (ProblemHint h : p.getHintsList()) {
                        hints.add(new HintDto(h.getId(), h.getHintOrder(), h.getContent()));
                    }
                }
                qDto.setHints(hints);
            }

            qDtos.add(qDto);
        }

        dto.setQuestions(qDtos);
        dto.setUserScore(totalUserScore);
        dto.setUserProblemsSolved(solvedCount);

        return dto;
    }

    @Transactional
    public ContestDto createContest(ContestRequestDto req, User organizer) {
        if (req.getStartTime() == null || req.getEndTime() == null) {
            throw new RuntimeException("Contest start and end time are required.");
        }
        if (!req.getEndTime().isAfter(req.getStartTime())) {
            throw new RuntimeException("Contest end time must be after start time.");
        }

        LocalDateTime requiredCutoff = req.getStartTime().minusMinutes(30);
        LocalDateTime regDeadline = req.getRegistrationDeadline();
        if ("SCHEDULED".equalsIgnoreCase(req.getContestType())) {
            if (regDeadline == null || regDeadline.isAfter(requiredCutoff)) {
                regDeadline = requiredCutoff;
            }
        } else {
            if (regDeadline == null) {
                regDeadline = req.getEndTime();
            }
        }

        Contest contest = new Contest();
        contest.setTitle(req.getTitle().trim());
        contest.setOrganizationName(req.getOrganizationName() != null ? req.getOrganizationName().trim() : "KODIFY");
        contest.setDescription(req.getDescription() != null ? req.getDescription().trim() : "");
        contest.setOrganizer(organizer);
        contest.setStartTime(req.getStartTime());
        contest.setEndTime(req.getEndTime());
        contest.setRegistrationStartTime(req.getRegistrationStartTime());
        contest.setRegistrationDeadline(regDeadline);
        contest.setAccessMode(req.getAccessMode() != null ? req.getAccessMode().trim().toUpperCase() : "PUBLIC");

        if (req.getDurationMinutes() != null && req.getDurationMinutes() > 0) {
            contest.setDurationMinutes(req.getDurationMinutes());
        } else {
            contest.setDurationMinutes((int) Duration.between(req.getStartTime(), req.getEndTime()).toMinutes());
        }

        contest.setBannerUrl(req.getBannerUrl());
        contest.setMaxParticipants(req.getMaxParticipants());
        contest.setContestType(req.getContestType() != null ? req.getContestType().trim().toUpperCase() : "SCHEDULED");
        contest.setStatus(req.getStatus() != null ? req.getStatus().trim().toUpperCase() : "PUBLISHED");
        contest.setReminderMinutes(req.getReminderMinutes() != null ? req.getReminderMinutes() : 10);
        contest.setScoringMethod(req.getScoringMethod() != null ? req.getScoringMethod() : "ACM_ICPC");

        contest = contestRepo.save(contest);

        // Associate problems if provided
        if (req.getProblemIds() != null && !req.getProblemIds().isEmpty()) {
            int order = 1;
            for (int i = 0; i < req.getProblemIds().size(); i++) {
                Long pId = req.getProblemIds().get(i);
                Problem p = problemRepo.findById(pId).orElse(null);
                if (p != null) {
                    int points = (req.getProblemPoints() != null && i < req.getProblemPoints().size())
                            ? req.getProblemPoints().get(i)
                            : 100;
                    ContestProblem cp = new ContestProblem(contest, p, order++, points);
                    contestProblemRepo.save(cp);
                }
            }
        }

        boolean isPublished = "PUBLISHED".equalsIgnoreCase(contest.getStatus());

        // Handle private contest invited users: pre-enroll them so no separate registration step is required
        if (contest.isPrivate()) {
            if (req.getInvitedUserIds() != null && !req.getInvitedUserIds().isEmpty()) {
                final Contest savedContest = contest;
                for (Long invitedUserId : req.getInvitedUserIds()) {
                    userRepo.findById(invitedUserId).ifPresent(invitedUser -> {
                        if (!contestParticipantRepo.existsByContestIdAndUserId(savedContest.getId(), invitedUser.getId())) {
                            ContestParticipant cp = new ContestParticipant(savedContest, invitedUser);
                            cp.setAgreedToRules(false);
                            cp.setStatus("REGISTERED");
                            contestParticipantRepo.save(cp);

                            if (isPublished) {
                                try {
                                    if (notificationService != null) {
                                        notificationService.createNotification(
                                                invitedUser,
                                                "Contest Invitation 🎯",
                                                "You have been invited to participate in '" + savedContest.getTitle() + "' on " + savedContest.getStartTime() + ". No registration is required.",
                                                "CONTEST",
                                                "/contests/" + savedContest.getId()
                                        );
                                    }
                                    if (emailService != null && invitedUser.getEmail() != null) {
                                        emailService.sendContestPrivateInvitationEmail(
                                                invitedUser.getId(),
                                                invitedUser.getEmail(),
                                                invitedUser.getName() != null ? invitedUser.getName() : invitedUser.getUsername(),
                                                savedContest.getTitle(),
                                                savedContest.getOrganizationName(),
                                                savedContest.getStartTime(),
                                                savedContest.getEndTime(),
                                                savedContest.getDescription(),
                                                savedContest.getId()
                                        );
                                    }
                                } catch (Exception ignored) {}
                            }
                        }
                    });
                }
            }
        } else {
            // Public Contest: send notification to all registered platform users once on publish
            if (isPublished && !Boolean.TRUE.equals(contest.isPublicNotificationSent())) {
                contest.setPublicNotificationSent(true);
                contestRepo.save(contest);

                List<User> allUsers = userRepo.findAll();
                for (User u : allUsers) {
                    if ("BLOCKED".equalsIgnoreCase(u.getStatus())) continue;
                    try {
                        if (notificationService != null) {
                            notificationService.createNotification(
                                    u,
                                    "New Contest Available 🏆",
                                    "'" + contest.getTitle() + "' is now open for registration! Register before " + contest.getRegistrationDeadline() + " and participate on " + contest.getStartTime(),
                                    "CONTEST",
                                    "/contests/" + contest.getId()
                            );
                        }
                        if (emailService != null && u.getEmail() != null) {
                            emailService.sendContestPublishedEmail(
                                    u.getId(),
                                    u.getEmail(),
                                    u.getName() != null ? u.getName() : u.getUsername(),
                                    contest.getTitle(),
                                    contest.getOrganizationName(),
                                    contest.getStartTime(),
                                    contest.getEndTime(),
                                    contest.getRegistrationDeadline(),
                                    contest.getDescription(),
                                    contest.getId()
                            );
                        }
                    } catch (Exception ignored) {}
                }
            }
        }

        activityService.logActivity(
                organizer,
                "Contest Created",
                "Created contest '" + contest.getTitle() + "' scheduled for " + contest.getStartTime()
        );

        if (badgeService != null) {
            try {
                badgeService.awardEligibleBadges(organizer);
            } catch (Exception ignored) {}
        }

        return mapToDto(contest, organizer, LocalDateTime.now());
    }

    @Transactional
    public ContestDto updateContest(Long contestId, ContestRequestDto req, User currentUser) {
        Contest contest = contestRepo.findById(contestId)
                .orElseThrow(() -> new RuntimeException("Contest not found."));

        boolean isOrganizer = contest.getOrganizer() != null && contest.getOrganizer().getId().equals(currentUser.getId());
        boolean isAdmin = Role.ADMIN.equals(currentUser.getRole());

        if (!isOrganizer && !isAdmin) {
            throw new RuntimeException("Permission denied. You can only modify your own contests.");
        }

        LocalDateTime now = LocalDateTime.now();
        if (!isAdmin && now.isAfter(contest.getStartTime())) {
            throw new RuntimeException("Cannot edit contest once it has already started.");
        }

        if (req.getStartTime() != null && req.getEndTime() != null) {
            if (!req.getEndTime().isAfter(req.getStartTime())) {
                throw new RuntimeException("Contest end time must be after start time.");
            }
            contest.setStartTime(req.getStartTime());
            contest.setEndTime(req.getEndTime());

            LocalDateTime regDeadline = req.getRegistrationDeadline();
            if (regDeadline == null) {
                regDeadline = "OPEN".equalsIgnoreCase(contest.getContestType()) ? req.getEndTime() : req.getStartTime().minusMinutes(30);
            }
            contest.setRegistrationDeadline(regDeadline);
        }

        if (req.getRegistrationStartTime() != null) {
            contest.setRegistrationStartTime(req.getRegistrationStartTime());
        }

        if (req.getTitle() != null && !req.getTitle().isBlank()) {
            contest.setTitle(req.getTitle().trim());
        }
        if (req.getOrganizationName() != null) {
            contest.setOrganizationName(req.getOrganizationName().trim());
        }
        if (req.getDescription() != null) {
            contest.setDescription(req.getDescription().trim());
        }
        if (req.getDurationMinutes() != null) {
            contest.setDurationMinutes(req.getDurationMinutes());
        }
        if (req.getBannerUrl() != null) {
            contest.setBannerUrl(req.getBannerUrl().trim());
        }
        if (req.getMaxParticipants() != null) {
            contest.setMaxParticipants(req.getMaxParticipants());
        }
        if (req.getStatus() != null && !req.getStatus().isBlank()) {
            contest.setStatus(req.getStatus().trim().toUpperCase());
        }
        if (req.getReminderMinutes() != null) {
            contest.setReminderMinutes(req.getReminderMinutes());
        }
        if (req.getScoringMethod() != null) {
            contest.setScoringMethod(req.getScoringMethod());
        }
        if (req.getAccessMode() != null && !req.getAccessMode().isBlank()) {
            contest.setAccessMode(req.getAccessMode().trim().toUpperCase());
        }

        // Update problems if provided
        if (req.getProblemIds() != null) {
            contestProblemRepo.deleteByContestId(contestId);
            int order = 1;
            for (int i = 0; i < req.getProblemIds().size(); i++) {
                Long pId = req.getProblemIds().get(i);
                Problem p = problemRepo.findById(pId).orElse(null);
                if (p != null) {
                    int points = (req.getProblemPoints() != null && i < req.getProblemPoints().size())
                            ? req.getProblemPoints().get(i)
                            : 100;
                    ContestProblem cp = new ContestProblem(contest, p, order++, points);
                    contestProblemRepo.save(cp);
                }
            }
        }

        contest = contestRepo.save(contest);

        // Check if transition to PUBLISHED for public contest notification
        if ("PUBLISHED".equalsIgnoreCase(contest.getStatus()) && !contest.isPrivate() && !Boolean.TRUE.equals(contest.isPublicNotificationSent())) {
            contest.setPublicNotificationSent(true);
            contestRepo.save(contest);

            List<User> allUsers = userRepo.findAll();
            for (User u : allUsers) {
                if ("BLOCKED".equalsIgnoreCase(u.getStatus())) continue;
                try {
                    if (notificationService != null) {
                        notificationService.createNotification(
                                u,
                                "New Contest Available 🏆",
                                "'" + contest.getTitle() + "' is now open for registration! Register before " + contest.getRegistrationDeadline() + " and participate on " + contest.getStartTime(),
                                "CONTEST",
                                "/contests/" + contest.getId()
                        );
                    }
                    if (emailService != null && u.getEmail() != null) {
                        emailService.sendContestPublishedEmail(
                                u.getId(),
                                u.getEmail(),
                                u.getName() != null ? u.getName() : u.getUsername(),
                                contest.getTitle(),
                                contest.getOrganizationName(),
                                contest.getStartTime(),
                                contest.getEndTime(),
                                contest.getRegistrationDeadline(),
                                contest.getDescription(),
                                contest.getId()
                        );
                    }
                } catch (Exception ignored) {}
            }
        }

        return mapToDto(contest, currentUser, now);
    }

    @Transactional
    public void deleteContest(Long contestId) {
        Contest contest = contestRepo.findById(contestId)
                .orElseThrow(() -> new RuntimeException("Contest not found with ID " + contestId));
        contestSubmissionRepo.deleteByContestId(contestId);
        contestParticipantRepo.deleteByContestId(contestId);
        contestProblemRepo.deleteByContestId(contestId);
        contestRepo.delete(contest);
    }

    @Transactional
    public void registerForContest(Long contestId, User user) {
        if (user == null) {
            throw new RuntimeException("User must be authenticated to register for contests.");
        }

        Contest contest = contestRepo.findById(contestId)
                .orElseThrow(() -> new RuntimeException("Contest not found."));

        if ("CANCELLED".equalsIgnoreCase(contest.getStatus()) || "DRAFT".equalsIgnoreCase(contest.getStatus())) {
            throw new RuntimeException("Cannot register for this contest as it is not open.");
        }

        if (contest.isPrivate()) {
            boolean isInvited = contestParticipantRepo.existsByContestIdAndUserId(contestId, user.getId());
            if (!isInvited) {
                throw new RuntimeException("This is a private contest. Only invited users can participate.");
            }
            // Already invited and pre-registered
            return;
        }

        if (contestParticipantRepo.existsByContestIdAndUserId(contestId, user.getId())) {
            throw new RuntimeException("You are already registered for this contest.");
        }

        LocalDateTime now = LocalDateTime.now();

        // Check registration start time if configured
        if (contest.getRegistrationStartTime() != null && now.isBefore(contest.getRegistrationStartTime())) {
            throw new RuntimeException("Registration has not opened yet. Registration opens on " + contest.getRegistrationStartTime());
        }

        LocalDateTime deadline = contest.getRegistrationDeadline() != null
                ? contest.getRegistrationDeadline()
                : ("OPEN".equalsIgnoreCase(contest.getContestType()) ? contest.getEndTime() : contest.getStartTime().minusMinutes(30));

        if (now.isAfter(deadline)) {
            throw new RuntimeException("Registration closed for this contest.");
        }

        if (contest.getMaxParticipants() != null && contest.getMaxParticipants() > 0) {
            long currentCount = contestParticipantRepo.countByContestId(contestId);
            if (currentCount >= contest.getMaxParticipants()) {
                throw new RuntimeException("Contest participant capacity has been reached.");
            }
        }

        ContestParticipant participant = new ContestParticipant(contest, user);
        participant.setAgreedToRules(false);
        contestParticipantRepo.save(participant);

        activityService.logActivity(
                user,
                "Contest Registered",
                "Registered for contest '" + contest.getTitle() + "'"
        );

        // Dispatch in-app notification & confirmation email
        try {
            if (notificationService != null) {
                notificationService.createNotification(
                        user,
                        "Contest Registration Confirmed ✓",
                        "You have successfully registered for '" + contest.getTitle() + "'. Mark your calendar for " + contest.getStartTime(),
                        "CONTEST",
                        "/contests/" + contest.getId()
                );
            }
            if (emailService != null && user.getEmail() != null) {
                emailService.sendContestRegistrationConfirmedEmail(
                        user.getId(),
                        user.getEmail(),
                        user.getName() != null ? user.getName() : user.getUsername(),
                        contest.getTitle(),
                        contest.getOrganizationName(),
                        contest.getStartTime(),
                        contest.getEndTime(),
                        contest.getDurationMinutes(),
                        contest.getId()
                );
            }
        } catch (Exception ignored) {}
    }

    @Transactional
    public void addParticipant(Long contestId, Long userId) {
        Contest contest = contestRepo.findById(contestId)
                .orElseThrow(() -> new RuntimeException("Contest not found."));
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID " + userId));

        if (contestParticipantRepo.existsByContestIdAndUserId(contestId, userId)) {
            throw new RuntimeException("User is already registered for this contest.");
        }

        ContestParticipant participant = new ContestParticipant(contest, user);
        participant.setStatus("REGISTERED");
        contestParticipantRepo.save(participant);

        // Dispatch Contest Invitation email & notification
        try {
            if (notificationService != null) {
                notificationService.createNotification(
                        user,
                        "Contest Invitation 🎯",
                        "You have been invited to participate in '" + contest.getTitle() + "' on " + contest.getStartTime() + ". No registration is required.",
                        "CONTEST",
                        "/contests/" + contest.getId()
                );
            }
            if (emailService != null && user.getEmail() != null) {
                emailService.sendContestPrivateInvitationEmail(
                        user.getId(),
                        user.getEmail(),
                        user.getName() != null ? user.getName() : user.getUsername(),
                        contest.getTitle(),
                        contest.getOrganizationName(),
                        contest.getStartTime(),
                        contest.getEndTime(),
                        contest.getDurationMinutes(),
                        contest.getDescription(),
                        contest.getId()
                );
            }
        } catch (Exception ignored) {}
    }

    @Transactional
    public void removeParticipant(Long contestId, Long userId) {
        ContestParticipant cp = contestParticipantRepo.findByContestIdAndUserId(contestId, userId)
                .orElseThrow(() -> new RuntimeException("Participant record not found."));
        contestParticipantRepo.delete(cp);
    }

    @Transactional(readOnly = true)
    public List<AdminContestParticipantDto> getParticipantsForContest(Long contestId) {
        List<ContestParticipant> participants = contestParticipantRepo.findByContestId(contestId);
        List<ContestSubmission> submissions = contestSubmissionRepo.findByContestIdOrderByCreatedAtDesc(contestId);
        List<ContestProblem> cpList = contestProblemRepo.findByContestIdOrderByQuestionOrderAsc(contestId);
        Map<Long, Integer> problemPointsMap = cpList.stream().collect(Collectors.toMap(cp -> cp.getProblem().getId(), ContestProblem::getPoints, (a, b) -> a));

        Map<Long, List<ContestSubmission>> subsByUser = submissions.stream()
                .filter(s -> s.getUser() != null)
                .collect(Collectors.groupingBy(s -> s.getUser().getId()));

        List<AdminContestParticipantDto> dtos = new ArrayList<>();
        for (ContestParticipant p : participants) {
            User u = p.getUser();
            if (u == null) continue;

            List<ContestSubmission> userSubs = subsByUser.getOrDefault(u.getId(), Collections.emptyList());
            Set<Long> solvedProblemIds = new HashSet<>();
            int totalScore = 0;

            for (ContestSubmission s : userSubs) {
                if ("ACCEPTED".equalsIgnoreCase(s.getStatus()) && s.getProblem() != null) {
                    if (!solvedProblemIds.contains(s.getProblem().getId())) {
                        solvedProblemIds.add(s.getProblem().getId());
                        int pts = problemPointsMap.getOrDefault(s.getProblem().getId(), 100);
                        totalScore += pts;
                    }
                }
            }

            AdminContestParticipantDto dto = new AdminContestParticipantDto();
            dto.setUserId(u.getId());
            dto.setUsername(u.getUsername());
            dto.setName(u.getName());
            dto.setEmail(u.getEmail());
            dto.setRegisteredAt(p.getRegisteredAt());
            dto.setParticipatedAt(p.getParticipatedAt());
            dto.setStatus(p.getStatus());
            dto.setProblemsSolved(solvedProblemIds.size());
            dto.setScore(totalScore);

            dtos.add(dto);
        }

        return dtos;
    }

    @Transactional
    public void confirmContestRules(Long contestId, User user) {
        if (user == null) {
            throw new RuntimeException("Authentication required.");
        }
        ContestParticipant cp = contestParticipantRepo.findByContestIdAndUserId(contestId, user.getId())
                .orElseThrow(() -> new RuntimeException("You must be registered for this contest to confirm rules."));
        cp.setAgreedToRules(true);
        contestParticipantRepo.save(cp);
    }

    @Transactional
    public ContestSecurityStatusDto submitContestSecurityCheck(Long contestId, ContestSecurityCheckDto checkDto, User user) {
        if (user == null) {
            throw new RuntimeException("Authentication required.");
        }
        ContestParticipant cp = contestParticipantRepo.findByContestIdAndUserId(contestId, user.getId())
                .orElseThrow(() -> new RuntimeException("You must be registered for this contest."));

        if (checkDto != null) {
            if (checkDto.getCameraGranted() != null) cp.setCameraPermissionGranted(checkDto.getCameraGranted());
            if (checkDto.getMicGranted() != null) cp.setMicPermissionGranted(checkDto.getMicGranted());
            if (Boolean.TRUE.equals(checkDto.getFullscreenReady())) {
                cp.setAgreedToRules(true);
            }
        }
        cp = contestParticipantRepo.save(cp);

        boolean isTerminated = "DISQUALIFIED".equalsIgnoreCase(cp.getStatus()) || (cp.getFullscreenViolations() != null && cp.getFullscreenViolations() >= 3);
        ContestSecurityStatusDto statusDto = new ContestSecurityStatusDto();
        statusDto.setTerminated(isTerminated);
        statusDto.setViolations(cp.getFullscreenViolations() != null ? cp.getFullscreenViolations() : 0);
        statusDto.setMaxAllowed(3);
        statusDto.setReason(cp.getTerminationReason());
        statusDto.setCameraGranted(cp.getCameraPermissionGranted());
        statusDto.setMicGranted(cp.getMicPermissionGranted());
        return statusDto;
    }

    @Transactional
    public ContestSecurityStatusDto recordContestSecurityEvent(Long contestId, String eventType, String details, User user) {
        if (user == null) {
            throw new RuntimeException("Authentication required.");
        }
        ContestParticipant cp = contestParticipantRepo.findByContestIdAndUserId(contestId, user.getId())
                .orElseThrow(() -> new RuntimeException("Contest participant record not found."));

        if ("FULLSCREEN_EXIT".equalsIgnoreCase(eventType) || "WINDOW_BLUR".equalsIgnoreCase(eventType) || "TAB_SWITCH".equalsIgnoreCase(eventType)) {
            int currentViolations = (cp.getFullscreenViolations() != null ? cp.getFullscreenViolations() : 0) + 1;
            cp.setFullscreenViolations(currentViolations);

            if (currentViolations >= 3) {
                cp.setStatus("DISQUALIFIED");
                cp.setTerminatedAt(LocalDateTime.now());
                cp.setTerminationReason("Contest terminated: Maximum allowed fullscreen exits (3 violations) exceeded.");
                contestParticipantRepo.save(cp);

                activityService.logActivity(
                        user,
                        "Contest Security Disqualification",
                        "Disqualified from contest ID " + contestId + " due to exceeding fullscreen exit limit."
                );

                return new ContestSecurityStatusDto(
                        true,
                        currentViolations,
                        3,
                        "Contest terminated due to security violations.",
                        cp.getTerminationReason()
                );
            } else {
                contestParticipantRepo.save(cp);
                int remaining = 3 - currentViolations;
                String warningMsg = "Warning " + currentViolations + " of 3: Fullscreen exit detected. Returning to fullscreen is required. " + remaining + " warning(s) remaining before termination.";
                return new ContestSecurityStatusDto(
                        false,
                        currentViolations,
                        3,
                        warningMsg,
                        null
                );
            }
        }

        boolean isTerminated = "DISQUALIFIED".equalsIgnoreCase(cp.getStatus()) || (cp.getFullscreenViolations() != null && cp.getFullscreenViolations() >= 3);
        return new ContestSecurityStatusDto(
                isTerminated,
                cp.getFullscreenViolations() != null ? cp.getFullscreenViolations() : 0,
                3,
                null,
                cp.getTerminationReason()
        );
    }

    public SubmissionResponseDto runContestSampleCode(Long contestId, Long problemId, SubmissionRequestDto req, User user) {
        Contest contest = contestRepo.findById(contestId)
                .orElseThrow(() -> new RuntimeException("Contest not found."));

        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(contest.getStartTime()) && (user == null || (!Role.ADMIN.equals(user.getRole()) && (contest.getOrganizer() == null || !contest.getOrganizer().getId().equals(user.getId()))))) {
            throw new RuntimeException("Contest has not started yet.");
        }

        if (user != null) {
            ContestParticipant cp = contestParticipantRepo.findByContestIdAndUserId(contestId, user.getId()).orElse(null);
            if (cp != null && ("DISQUALIFIED".equalsIgnoreCase(cp.getStatus()) || "TERMINATED".equalsIgnoreCase(cp.getStatus()) || (cp.getFullscreenViolations() != null && cp.getFullscreenViolations() >= 3))) {
                throw new RuntimeException("Contest session terminated due to security violations. Code execution is rejected.");
            }
        }

        ContestProblem cp = contestProblemRepo.findByContestIdAndProblemId(contestId, problemId)
                .orElseThrow(() -> new RuntimeException("Problem does not belong to this contest."));

        Problem problem = cp.getProblem();

        String requestedLang = req.getLanguage();
        if (!infosys.onlinecodeplate.model.LanguageRegistry.isSupported(requestedLang)) {
            throw new RuntimeException("Unsupported programming language: " + requestedLang);
        }
        if (!problem.isLanguageAllowed(requestedLang)) {
            throw new RuntimeException("Selected programming language is not allowed for this question.");
        }

        List<TestCase> sampleTestCases = (problem.getTestCasesList() != null)
                ? problem.getTestCasesList().stream().filter(tc -> tc.getHidden() == null || !tc.getHidden()).collect(Collectors.toList())
                : Collections.emptyList();

        UserSubmission dummySub = new UserSubmission();
        dummySub.setLanguage(req.getLanguage());
        dummySub.setCode(req.getCode());

        EvaluationResult evalResult = dockerSandboxService.evaluateSubmission(dummySub, sampleTestCases);

        List<TestCaseResultDto> resultDtos = new ArrayList<>();
        Map<Long, TestCase> tcMap = sampleTestCases.stream().collect(Collectors.toMap(TestCase::getId, tc -> tc, (a, b) -> a));

        for (DockerSandboxService.TestCaseResultItem item : evalResult.getTestCaseResults()) {
            TestCase tc = tcMap.get(item.getTestCaseId());
            if (tc != null) {
                resultDtos.add(new TestCaseResultDto(
                        tc.getId(),
                        item.isPassed(),
                        item.getRuntime(),
                        item.getStatus(),
                        item.getActualOutput(),
                        tc.getInput(),
                        tc.getExpectedOutput(),
                        false
                ));
            }
        }

        boolean isAccepted = "ACCEPTED".equalsIgnoreCase(evalResult.getStatus());
        SubmissionResponseDto response = new SubmissionResponseDto(0L, evalResult.getStatus(), evalResult.getMessage(), isAccepted, now);
        response.setRuntime(evalResult.getAggregateRuntime());
        response.setPassedTestCases(evalResult.getPassedTestCases());
        response.setTotalTestCases(evalResult.getTotalTestCases());
        response.setCompilerOutput(evalResult.getCompilerOutput());
        response.setTestCaseResults(resultDtos);

        return response;
    }

    @Transactional
    public SubmissionResponseDto submitContestSolution(Long contestId, Long problemId, SubmissionRequestDto req, User user) {
        Contest contest = contestRepo.findById(contestId)
                .orElseThrow(() -> new RuntimeException("Contest not found."));

        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(contest.getStartTime())) {
            throw new RuntimeException("Contest has not started yet.");
        }
        if (now.isAfter(contest.getEndTime())) {
            throw new RuntimeException("Contest has already ended.");
        }

        ContestParticipant participant = contestParticipantRepo.findByContestIdAndUserId(contestId, user.getId())
                .orElseThrow(() -> new RuntimeException("You must be registered for this contest to submit solutions."));

        if ("DISQUALIFIED".equalsIgnoreCase(participant.getStatus())
                || "TERMINATED".equalsIgnoreCase(participant.getStatus())
                || (participant.getFullscreenViolations() != null && participant.getFullscreenViolations() >= 3)) {
            throw new RuntimeException("Contest session terminated due to security violations. Submissions are rejected.");
        }

        ContestProblem cp = contestProblemRepo.findByContestIdAndProblemId(contestId, problemId)
                .orElseThrow(() -> new RuntimeException("Problem does not belong to this contest."));

        Problem problem = cp.getProblem();

        String requestedLang = req.getLanguage();
        if (!infosys.onlinecodeplate.model.LanguageRegistry.isSupported(requestedLang)) {
            throw new RuntimeException("Unsupported programming language: " + requestedLang);
        }
        if (!problem.isLanguageAllowed(requestedLang)) {
            throw new RuntimeException("Selected programming language is not allowed for this question.");
        }

        // 1. Save submission record
        ContestSubmission submission = new ContestSubmission();
        submission.setContest(contest);
        submission.setUser(user);
        submission.setProblem(problem);
        submission.setLanguage(req.getLanguage());
        submission.setCode(req.getCode());
        submission.setStatus("PENDING");
        submission = contestSubmissionRepo.save(submission);

        // 2. Mark participant actual participation timestamp (for streak / statistics)
        if (participant.getParticipatedAt() == null) {
            participant.setParticipatedAt(now);
            participant.setStatus("PARTICIPATED");
            contestParticipantRepo.save(participant);
        }

        // 3. Evaluate solution using Docker sandbox service
        List<TestCase> problemTestCases = problem.getTestCasesList();
        UserSubmission dummySub = new UserSubmission();
        dummySub.setId(submission.getId());
        dummySub.setLanguage(req.getLanguage());
        dummySub.setCode(req.getCode());

        EvaluationResult evalResult = dockerSandboxService.evaluateSubmission(dummySub, problemTestCases);

        submission.setStatus(evalResult.getStatus());
        submission.setRuntime(evalResult.getAggregateRuntime());
        submission.setPassedTestCases(evalResult.getPassedTestCases());
        submission.setTotalTestCases(evalResult.getTotalTestCases());

        boolean isSolved = "ACCEPTED".equalsIgnoreCase(evalResult.getStatus());
        if (isSolved) {
            submission.setPointsAwarded(cp.getPoints());
        } else {
            submission.setPointsAwarded(0);
        }
        contestSubmissionRepo.save(submission);

        if (isSolved) {
            activityService.logActivity(
                    user,
                    "Contest Problem Solved",
                    "Solved Problem '" + problem.getTitle() + "' in contest '" + contest.getTitle() + "' (+" + cp.getPoints() + " pts)!"
            );
            if (badgeService != null) {
                try {
                    badgeService.awardEligibleBadges(user);
                } catch (Exception ignored) {}
            }
        }

        List<TestCaseResultDto> resultDtos = new ArrayList<>();
        Map<Long, TestCase> tcMap = problemTestCases.stream().collect(Collectors.toMap(TestCase::getId, tc -> tc, (a, b) -> a));

        for (DockerSandboxService.TestCaseResultItem item : evalResult.getTestCaseResults()) {
            TestCase tc = tcMap.get(item.getTestCaseId());
            if (tc != null) {
                boolean isHidden = tc.getHidden() != null && tc.getHidden();
                resultDtos.add(new TestCaseResultDto(
                        tc.getId(),
                        item.isPassed(),
                        item.getRuntime(),
                        item.getStatus(),
                        isHidden ? null : item.getActualOutput(),
                        isHidden ? null : tc.getInput(),
                        isHidden ? null : tc.getExpectedOutput(),
                        isHidden
                ));
            }
        }

        SubmissionResponseDto response = new SubmissionResponseDto(submission.getId(), evalResult.getStatus(), evalResult.getMessage(), isSolved, now);
        response.setRuntime(evalResult.getAggregateRuntime());
        response.setPassedTestCases(evalResult.getPassedTestCases());
        response.setTotalTestCases(evalResult.getTotalTestCases());
        response.setCompilerOutput(evalResult.getCompilerOutput());
        response.setTestCaseResults(resultDtos);

        return response;
    }

    @Transactional(readOnly = true)
    public List<ContestLeaderboardEntryDto> getContestLeaderboard(Long contestId) {
        Contest contest = contestRepo.findById(contestId)
                .orElseThrow(() -> new RuntimeException("Contest not found."));

        List<ContestParticipant> participants = contestParticipantRepo.findByContestId(contestId);
        List<ContestSubmission> submissions = contestSubmissionRepo.findByContestIdOrderByCreatedAtDesc(contestId);
        List<ContestProblem> cpList = contestProblemRepo.findByContestIdOrderByQuestionOrderAsc(contestId);
        Map<Long, Integer> problemPointsMap = cpList.stream().collect(Collectors.toMap(cp -> cp.getProblem().getId(), ContestProblem::getPoints, (a, b) -> a));

        Map<Long, List<ContestSubmission>> subsByUser = submissions.stream()
                .filter(s -> s.getUser() != null)
                .collect(Collectors.groupingBy(s -> s.getUser().getId()));

        List<ContestLeaderboardEntryDto> entries = new ArrayList<>();

        for (ContestParticipant p : participants) {
            User u = p.getUser();
            if (u == null) continue;

            List<ContestSubmission> userSubs = subsByUser.getOrDefault(u.getId(), Collections.emptyList());
            Set<Long> solvedProblemIds = new HashSet<>();
            int totalScore = 0;
            long maxSubmissionElapsedSeconds = 0;

            for (ContestSubmission s : userSubs) {
                if ("ACCEPTED".equalsIgnoreCase(s.getStatus()) && s.getProblem() != null) {
                    if (!solvedProblemIds.contains(s.getProblem().getId())) {
                        solvedProblemIds.add(s.getProblem().getId());
                        int pts = problemPointsMap.getOrDefault(s.getProblem().getId(), 100);
                        totalScore += pts;

                        if (s.getCreatedAt() != null && contest.getStartTime() != null) {
                            long diffSeconds = Math.max(0, Duration.between(contest.getStartTime(), s.getCreatedAt()).getSeconds());
                            if (diffSeconds > maxSubmissionElapsedSeconds) {
                                maxSubmissionElapsedSeconds = diffSeconds;
                            }
                        }
                    }
                }
            }

            long minutes = maxSubmissionElapsedSeconds / 60;
            long seconds = maxSubmissionElapsedSeconds % 60;
            String formattedTime = String.format("%02d:%02d", minutes, seconds);

            entries.add(new ContestLeaderboardEntryDto(
                    0,
                    u.getId(),
                    u.getUsername(),
                    u.getName(),
                    solvedProblemIds.size(),
                    totalScore,
                    maxSubmissionElapsedSeconds,
                    formattedTime
            ));
        }

        // Sorting rule:
        // 1. Solved problems count DESC
        // 2. Score DESC
        // 3. Submission / penalty time ASC
        // 4. Username ASC
        entries.sort((a, b) -> {
            int cmpSolved = Integer.compare(b.getProblemsSolved(), a.getProblemsSolved());
            if (cmpSolved != 0) return cmpSolved;

            int cmpScore = Integer.compare(b.getScore(), a.getScore());
            if (cmpScore != 0) return cmpScore;

            int cmpTime = Long.compare(a.getTotalTimeSeconds(), b.getTotalTimeSeconds());
            if (cmpTime != 0) return cmpTime;

            String u1 = a.getUsername() != null ? a.getUsername().toLowerCase() : "";
            String u2 = b.getUsername() != null ? b.getUsername().toLowerCase() : "";
            return u1.compareTo(u2);
        });

        for (int i = 0; i < entries.size(); i++) {
            entries.get(i).setRank(i + 1);
        }

        return entries;
    }

    @Transactional
    public ContestDetailDto enterArena(Long contestId, User user) {
        if (user == null) {
            throw new RuntimeException("Authentication required to enter contest arena.");
        }

        Contest contest = contestRepo.findById(contestId)
                .orElseThrow(() -> new RuntimeException("Contest not found with ID " + contestId));

        LocalDateTime now = LocalDateTime.now();
        updateDynamicStatus(contest, now);

        String type = contest.getContestType() != null ? contest.getContestType().toUpperCase() : "SCHEDULED";
        boolean isOrganizer = contest.getOrganizer() != null && contest.getOrganizer().getId().equals(user.getId());
        boolean isAdmin = Role.ADMIN.equals(user.getRole());

        ContestParticipant participant = contestParticipantRepo.findByContestIdAndUserId(contestId, user.getId())
                .orElse(null);

        if (participant == null && !isOrganizer && !isAdmin) {
            if (contest.isPrivate()) {
                throw new RuntimeException("Access denied. You are not invited to this private contest.");
            } else {
                throw new RuntimeException("You must register for this contest first.");
            }
        }

        if ("SCHEDULED".equals(type)) {
            // Waiting Room check
            if (now.isBefore(contest.getStartTime()) && !isOrganizer && !isAdmin) {
                ContestDetailDto waitingDto = new ContestDetailDto();
                copyDtoFields(mapToDto(contest, user, now), waitingDto);
                waitingDto.setWaitingRoom(true);
                waitingDto.setArenaUnlocked(false);
                waitingDto.setRemainingSeconds(Duration.between(now, contest.getStartTime()).getSeconds());
                waitingDto.setServerTime(now);

                // Populate questions basic info without test cases or solution hints
                List<ContestProblem> cpList = contestProblemRepo.findByContestIdOrderByQuestionOrderAsc(contestId);
                List<ContestQuestionDto> qDtos = new ArrayList<>();
                for (ContestProblem cp : cpList) {
                    Problem p = cp.getProblem();
                    if (p == null) continue;
                    ContestQuestionDto q = new ContestQuestionDto();
                    q.setProblemId(p.getId());
                    q.setTitle(p.getTitle());
                    q.setDifficulty(p.getDifficulty());
                    q.setConcept(p.getConcept());
                    q.setPoints(cp.getPoints());
                    q.setQuestionOrder(cp.getQuestionOrder());
                    qDtos.add(q);
                }
                waitingDto.setQuestions(qDtos);
                return waitingDto;
            }

            // Live or organizer preview
            if (participant != null) {
                if (participant.getEnteredArenaAt() == null) {
                    participant.setEnteredArenaAt(now);
                }
                if (participant.getStartedAt() == null) {
                    participant.setStartedAt(now.isBefore(contest.getStartTime()) ? contest.getStartTime() : now);
                }
                if (participant.getStatus() == null || "REGISTERED".equalsIgnoreCase(participant.getStatus())) {
                    participant.setStatus("PARTICIPATING");
                }
                contestParticipantRepo.save(participant);
            }
        } else {
            // OPEN Contest Mode
            if (now.isBefore(contest.getStartTime()) && !isOrganizer && !isAdmin) {
                ContestDetailDto waitingDto = new ContestDetailDto();
                copyDtoFields(mapToDto(contest, user, now), waitingDto);
                waitingDto.setWaitingRoom(true);
                waitingDto.setArenaUnlocked(false);
                waitingDto.setRemainingSeconds(Duration.between(now, contest.getStartTime()).getSeconds());
                waitingDto.setServerTime(now);
                return waitingDto;
            }

            if (now.isAfter(contest.getEndTime()) && !isOrganizer && !isAdmin) {
                throw new RuntimeException("This contest has ended.");
            }

            if (participant != null) {
                if (participant.getEnteredArenaAt() == null) {
                    participant.setEnteredArenaAt(now);
                }
                if (participant.getStartedAt() == null) {
                    participant.setStartedAt(now);
                }
                if (participant.getStatus() == null || "REGISTERED".equalsIgnoreCase(participant.getStatus())) {
                    participant.setStatus("PARTICIPATING");
                }
                contestParticipantRepo.save(participant);
            }
        }

        ContestDetailDto detailDto = getContestDetail(contestId, user);
        detailDto.setServerTime(now);
        detailDto.setWaitingRoom(false);

        // Compute authoritative remaining seconds
        long remainingSec = 0;
        if ("SCHEDULED".equals(type)) {
            if (now.isBefore(contest.getEndTime())) {
                remainingSec = Math.max(0, Duration.between(now, contest.getEndTime()).getSeconds());
            }
        } else {
            // OPEN Mode: participant individual duration
            if (participant != null && participant.getStartedAt() != null) {
                long durationSec = (contest.getDurationMinutes() != null && contest.getDurationMinutes() > 0)
                        ? contest.getDurationMinutes() * 60L
                        : Duration.between(contest.getStartTime(), contest.getEndTime()).getSeconds();
                LocalDateTime userExpiresAt = participant.getStartedAt().plusSeconds(durationSec);
                if (userExpiresAt.isAfter(contest.getEndTime())) {
                    userExpiresAt = contest.getEndTime();
                }
                remainingSec = Math.max(0, Duration.between(now, userExpiresAt).getSeconds());
            } else {
                remainingSec = (contest.getDurationMinutes() != null ? contest.getDurationMinutes() * 60L : 3600);
            }
        }

        detailDto.setRemainingSeconds(remainingSec);
        detailDto.setArenaUnlocked(remainingSec > 0 || isOrganizer || isAdmin);
        return detailDto;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getRegistrationStatus(Long contestId, User user) {
        if (user == null) {
            return Map.of("registered", false, "agreedToRules", false);
        }
        Optional<ContestParticipant> cpOpt = contestParticipantRepo.findByContestIdAndUserId(contestId, user.getId());
        if (cpOpt.isPresent()) {
            ContestParticipant cp = cpOpt.get();
            Map<String, Object> map = new HashMap<>();
            map.put("registered", true);
            map.put("agreedToRules", Boolean.TRUE.equals(cp.getAgreedToRules()));
            map.put("cameraGranted", Boolean.TRUE.equals(cp.getCameraPermissionGranted()));
            map.put("micGranted", Boolean.TRUE.equals(cp.getMicPermissionGranted()));
            map.put("fullscreenViolations", cp.getFullscreenViolations() != null ? cp.getFullscreenViolations() : 0);
            map.put("status", cp.getStatus() != null ? cp.getStatus() : "REGISTERED");
            map.put("registeredAt", cp.getRegisteredAt() != null ? cp.getRegisteredAt().toString() : "");
            map.put("disqualified", "DISQUALIFIED".equalsIgnoreCase(cp.getStatus()) || (cp.getFullscreenViolations() != null && cp.getFullscreenViolations() >= 3));
            map.put("terminationReason", cp.getTerminationReason() != null ? cp.getTerminationReason() : "");
            map.put("terminatedAt", cp.getTerminatedAt() != null ? cp.getTerminatedAt().toString() : "");
            return map;
        }
        return Map.of("registered", false, "agreedToRules", false);
    }

    @Transactional(readOnly = true)
    public ContestResultDto getContestResult(Long contestId, User user) {
        Contest contest = contestRepo.findById(contestId)
                .orElseThrow(() -> new RuntimeException("Contest not found."));

        List<ContestLeaderboardEntryDto> leaderboard = getContestLeaderboard(contestId);
        List<ContestProblem> cpList = contestProblemRepo.findByContestIdOrderByQuestionOrderAsc(contestId);
        List<ContestSubmission> submissions = (user != null)
                ? contestSubmissionRepo.findByContestIdOrderByCreatedAtDesc(contestId)
                : Collections.emptyList();

        List<ContestSubmission> userSubmissions = submissions.stream()
                .filter(s -> s.getUser() != null && user != null && s.getUser().getId().equals(user.getId()))
                .collect(Collectors.toList());

        Map<Long, List<ContestSubmission>> subsByProblem = userSubmissions.stream()
                .filter(s -> s.getProblem() != null)
                .collect(Collectors.groupingBy(s -> s.getProblem().getId()));

        ContestParticipant participant = (user != null)
                ? contestParticipantRepo.findByContestIdAndUserId(contestId, user.getId()).orElse(null)
                : null;

        ContestResultDto result = new ContestResultDto();
        result.setContestId(contest.getId());
        result.setContestTitle(contest.getTitle());

        if (participant != null) {
            boolean isDisq = "DISQUALIFIED".equalsIgnoreCase(participant.getStatus())
                    || (participant.getFullscreenViolations() != null && participant.getFullscreenViolations() >= 3);
            result.setDisqualified(isDisq);
            result.setTerminationReason(participant.getTerminationReason());
            result.setTerminatedAt(participant.getTerminatedAt());
            result.setFullscreenViolations(participant.getFullscreenViolations() != null ? participant.getFullscreenViolations() : 0);
        }

        // Find user rank from leaderboard
        int userRank = 0;
        int userScore = 0;
        int solvedCount = 0;
        int attemptedCount = 0;
        int wrongCount = 0;
        long timeTakenSeconds = 0;

        if (user != null) {
            for (ContestLeaderboardEntryDto entry : leaderboard) {
                if (entry.getUserId() != null && entry.getUserId().equals(user.getId())) {
                    userRank = entry.getRank();
                    userScore = entry.getScore();
                    solvedCount = entry.getProblemsSolved();
                    timeTakenSeconds = entry.getTotalTimeSeconds();
                    break;
                }
            }
        }

        result.setRank(userRank > 0 ? userRank : leaderboard.size() + 1);
        result.setScore(userScore);
        result.setSolvedCount(solvedCount);
        result.setTotalQuestions(cpList.size());
        result.setTimeTakenSeconds(timeTakenSeconds);

        long mins = timeTakenSeconds / 60;
        long secs = timeTakenSeconds % 60;
        result.setFormattedTime(String.format("%02d:%02d", mins, secs));

        int totalPossibleScore = 0;
        List<ContestProblemResultDto> problemResults = new ArrayList<>();

        for (ContestProblem cp : cpList) {
            Problem p = cp.getProblem();
            if (p == null) continue;

            totalPossibleScore += cp.getPoints();
            List<ContestSubmission> pSubs = subsByProblem.getOrDefault(p.getId(), Collections.emptyList());

            ContestProblemResultDto prDto = new ContestProblemResultDto();
            prDto.setProblemId(p.getId());
            prDto.setQuestionOrder(cp.getQuestionOrder());
            prDto.setTitle(p.getTitle());
            prDto.setDifficulty(p.getDifficulty());
            prDto.setMaxPoints(cp.getPoints());

            if (pSubs.isEmpty()) {
                prDto.setStatus("NOT_ATTEMPTED");
                prDto.setEarnedPoints(0);
            } else {
                attemptedCount++;
                ContestSubmission acceptedSub = pSubs.stream()
                        .filter(s -> "ACCEPTED".equalsIgnoreCase(s.getStatus()))
                        .findFirst().orElse(null);

                if (acceptedSub != null) {
                    prDto.setStatus("ACCEPTED");
                    prDto.setEarnedPoints(cp.getPoints());
                    prDto.setLanguage(acceptedSub.getLanguage());
                    prDto.setSubmittedCode(acceptedSub.getCode());
                    prDto.setRuntime(acceptedSub.getRuntime());
                    prDto.setPassedTestCases(acceptedSub.getPassedTestCases());
                    prDto.setTotalTestCases(acceptedSub.getTotalTestCases());
                } else {
                    wrongCount++;
                    ContestSubmission latestSub = pSubs.get(0);
                    prDto.setStatus("WRONG_ANSWER");
                    prDto.setEarnedPoints(0);
                    prDto.setLanguage(latestSub.getLanguage());
                    prDto.setSubmittedCode(latestSub.getCode());
                    prDto.setRuntime(latestSub.getRuntime());
                    prDto.setPassedTestCases(latestSub.getPassedTestCases());
                    prDto.setTotalTestCases(latestSub.getTotalTestCases());
                }
            }

            problemResults.add(prDto);
        }

        result.setTotalPossibleScore(totalPossibleScore);
        result.setAttemptedCount(attemptedCount);
        result.setWrongCount(wrongCount);
        result.setUnansweredCount(Math.max(0, cpList.size() - attemptedCount));
        result.setProblemResults(problemResults);
        result.setFinalLeaderboard(leaderboard.stream().limit(50).collect(Collectors.toList()));

        return result;
    }

    @Transactional(readOnly = true)
    public List<ContestDto> getAllContestsForAdmin() {
        List<Contest> contests = contestRepo.findAllByOrderByStartTimeDesc();
        LocalDateTime now = LocalDateTime.now();
        return contests.stream().map(c -> mapToDto(c, null, now)).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public WhatsNewDto getWhatsNew() {
        WhatsNewDto dto = new WhatsNewDto();
        LocalDateTime now = LocalDateTime.now();

        List<Contest> latestContests = contestRepo.findLatestPublishedContests();
        dto.setNewContests(latestContests.stream().limit(3).map(c -> mapToDto(c, null, now)).collect(Collectors.toList()));

        return dto;
    }

    private void updateDynamicStatus(Contest c, LocalDateTime now) {
        if ("CANCELLED".equalsIgnoreCase(c.getStatus()) || "DRAFT".equalsIgnoreCase(c.getStatus())) {
            return;
        }
        c.setStatus(computeDynamicStatus(c, now));
    }

    private String computeDynamicStatus(Contest c, LocalDateTime now) {
        if ("CANCELLED".equalsIgnoreCase(c.getStatus()) || "DRAFT".equalsIgnoreCase(c.getStatus())) {
            return c.getStatus();
        }
        if (now.isAfter(c.getEndTime())) {
            return "COMPLETED";
        }
        if (!now.isBefore(c.getStartTime()) && !now.isAfter(c.getEndTime())) {
            return "LIVE";
        }
        // Before start time
        LocalDateTime deadline = c.getRegistrationDeadline() != null
                ? c.getRegistrationDeadline()
                : ("OPEN".equalsIgnoreCase(c.getContestType()) ? c.getEndTime() : c.getStartTime().minusMinutes(30));
        if (now.isAfter(deadline)) {
            return "REGISTRATION CLOSED";
        }
        if (c.getRegistrationStartTime() != null && now.isBefore(c.getRegistrationStartTime())) {
            return "UPCOMING";
        }
        return "REGISTRATION OPEN";
    }

    private ContestDto mapToDto(Contest c, User currentUser, LocalDateTime now) {
        ContestDto dto = new ContestDto();
        dto.setId(c.getId());
        dto.setTitle(c.getTitle());
        dto.setOrganizationName(c.getOrganizationName() != null ? c.getOrganizationName() : "KODIFY");
        dto.setDescription(c.getDescription());
        dto.setContestType(c.getContestType() != null ? c.getContestType() : "SCHEDULED");
        dto.setAccessMode(c.getAccessMode() != null ? c.getAccessMode() : "PUBLIC");

        if (c.getOrganizer() != null) {
            dto.setOrganizerId(c.getOrganizer().getId());
            dto.setOrganizerName(c.getOrganizer().getName());
            dto.setOrganizerUsername(c.getOrganizer().getUsername());
            dto.setOrganizerRole(c.getOrganizer().getRole() != null ? c.getOrganizer().getRole().name() : "ADMIN");
        }

        dto.setStartTime(c.getStartTime());
        dto.setEndTime(c.getEndTime());
        dto.setRegistrationStartTime(c.getRegistrationStartTime());
        dto.setRegistrationDeadline(c.getRegistrationDeadline());

        if (c.getDurationMinutes() != null && c.getDurationMinutes() > 0) {
            dto.setDurationMinutes(c.getDurationMinutes());
        } else if (c.getStartTime() != null && c.getEndTime() != null) {
            dto.setDurationMinutes(Duration.between(c.getStartTime(), c.getEndTime()).toMinutes());
        }

        dto.setBannerUrl(c.getBannerUrl());
        dto.setMaxParticipants(c.getMaxParticipants());
        dto.setStatus(computeDynamicStatus(c, now));
        dto.setParticipantCount(contestParticipantRepo.countByContestId(c.getId()));
        dto.setQuestionCount(c.getContestProblems() != null ? c.getContestProblems().size() : 0);
        dto.setCreatedAt(c.getCreatedAt());
        dto.setServerTime(now);
        dto.setReminderMinutes(c.getReminderMinutes() != null ? c.getReminderMinutes() : 10);
        dto.setScoringMethod(c.getScoringMethod() != null ? c.getScoringMethod() : "ACM_ICPC");

        boolean isRegistered = false;
        boolean agreedToRules = false;
        if (currentUser != null) {
            Optional<ContestParticipant> cpOpt = contestParticipantRepo.findByContestIdAndUserId(c.getId(), currentUser.getId());
            if (cpOpt.isPresent()) {
                ContestParticipant cp = cpOpt.get();
                isRegistered = true;
                agreedToRules = Boolean.TRUE.equals(cp.getAgreedToRules());
                dto.setParticipantStatus(cp.getStatus());
                dto.setFullscreenViolations(cp.getFullscreenViolations() != null ? cp.getFullscreenViolations() : 0);
                dto.setTerminationReason(cp.getTerminationReason());
                dto.setCameraPermissionGranted(cp.isCameraPermissionGranted());
                dto.setMicPermissionGranted(cp.isMicPermissionGranted());
            }
        }
        dto.setRegistered(isRegistered);
        dto.setAgreedToRules(agreedToRules);

        LocalDateTime effectiveDeadline = c.getRegistrationDeadline() != null
                ? c.getRegistrationDeadline()
                : ("OPEN".equalsIgnoreCase(c.getContestType()) ? c.getEndTime() : c.getStartTime().minusMinutes(30));

        boolean isCutoffPassed = now.isAfter(effectiveDeadline);
        boolean isNotStartedYet = c.getRegistrationStartTime() != null && now.isBefore(c.getRegistrationStartTime());
        dto.setRegistrationClosed(isCutoffPassed);

        if (c.isPrivate()) {
            // For private contests, invited users are already registered and participate directly
            dto.setCanRegister(false);
        } else {
            dto.setCanRegister(!isRegistered && !isCutoffPassed && !isNotStartedYet && !"CANCELLED".equalsIgnoreCase(c.getStatus()) && !"COMPLETED".equalsIgnoreCase(c.getStatus()));
        }

        dto.setHasStarted(!now.isBefore(c.getStartTime()));
        dto.setHasEnded(now.isAfter(c.getEndTime()));

        boolean isScheduled = "SCHEDULED".equalsIgnoreCase(dto.getContestType());
        if (isScheduled) {
            if (now.isBefore(c.getStartTime())) {
                dto.setWaitingRoom(true);
                dto.setArenaUnlocked(false);
                dto.setRemainingSeconds(Duration.between(now, c.getStartTime()).getSeconds());
            } else if (!now.isAfter(c.getEndTime())) {
                dto.setWaitingRoom(false);
                dto.setArenaUnlocked(true);
                dto.setRemainingSeconds(Duration.between(now, c.getEndTime()).getSeconds());
            } else {
                dto.setWaitingRoom(false);
                dto.setArenaUnlocked(false);
                dto.setRemainingSeconds(0);
            }
        } else {
            // OPEN Mode
            if (now.isBefore(c.getStartTime())) {
                dto.setWaitingRoom(true);
                dto.setArenaUnlocked(false);
                dto.setRemainingSeconds(Duration.between(now, c.getStartTime()).getSeconds());
            } else if (!now.isAfter(c.getEndTime())) {
                dto.setWaitingRoom(false);
                dto.setArenaUnlocked(true);
                long durationSec = (c.getDurationMinutes() != null && c.getDurationMinutes() > 0) ? c.getDurationMinutes() * 60L : 3600;
                dto.setRemainingSeconds(durationSec);
            } else {
                dto.setWaitingRoom(false);
                dto.setArenaUnlocked(false);
                dto.setRemainingSeconds(0);
            }
        }

        return dto;
    }

    private void copyDtoFields(ContestDto source, ContestDto target) {
        target.setId(source.getId());
        target.setTitle(source.getTitle());
        target.setOrganizationName(source.getOrganizationName());
        target.setDescription(source.getDescription());
        target.setContestType(source.getContestType());
        target.setAccessMode(source.getAccessMode());
        target.setOrganizerId(source.getOrganizerId());
        target.setOrganizerName(source.getOrganizerName());
        target.setOrganizerUsername(source.getOrganizerUsername());
        target.setOrganizerRole(source.getOrganizerRole());
        target.setStartTime(source.getStartTime());
        target.setEndTime(source.getEndTime());
        target.setRegistrationStartTime(source.getRegistrationStartTime());
        target.setRegistrationDeadline(source.getRegistrationDeadline());
        target.setDurationMinutes(source.getDurationMinutes());
        target.setBannerUrl(source.getBannerUrl());
        target.setMaxParticipants(source.getMaxParticipants());
        target.setStatus(source.getStatus());
        target.setParticipantCount(source.getParticipantCount());
        target.setQuestionCount(source.getQuestionCount());
        target.setRegistered(source.isRegistered());
        target.setRegistrationClosed(source.isRegistrationClosed());
        target.setCanRegister(source.isCanRegister());
        target.setHasStarted(source.isHasStarted());
        target.setHasEnded(source.isHasEnded());
        target.setCreatedAt(source.getCreatedAt());
        target.setServerTime(source.getServerTime());
        target.setRemainingSeconds(source.getRemainingSeconds());
        target.setWaitingRoom(source.isWaitingRoom());
        target.setArenaUnlocked(source.isArenaUnlocked());
        target.setUserRank(source.getUserRank());
        target.setReminderMinutes(source.getReminderMinutes());
        target.setScoringMethod(source.getScoringMethod());
        target.setAgreedToRules(source.isAgreedToRules());
    }

    @Scheduled(fixedRate = 30000)
    @Transactional
    public void dispatchContestRemindersAndTriggers() {
        LocalDateTime now = LocalDateTime.now();
        List<Contest> contests = contestRepo.findAll();

        for (Contest contest : contests) {
            if ("CANCELLED".equalsIgnoreCase(contest.getStatus()) || "DRAFT".equalsIgnoreCase(contest.getStatus())) {
                continue;
            }

            Long contestId = contest.getId();
            int reminderMins = (contest.getReminderMinutes() != null && contest.getReminderMinutes() > 0)
                    ? contest.getReminderMinutes()
                    : 10;

            // 1. 10-Minute (or configured minutes) pre-contest reminder
            if (!Boolean.TRUE.equals(contest.isReminderSent())
                    && contest.getStartTime() != null
                    && now.isAfter(contest.getStartTime().minusMinutes(reminderMins))
                    && now.isBefore(contest.getStartTime())) {

                contest.setReminderSent(true);
                contestRepo.save(contest);

                List<ContestParticipant> participants = contestParticipantRepo.findByContestId(contestId);
                for (ContestParticipant cp : participants) {
                    User u = cp.getUser();
                    if (u != null) {
                        try {
                            if (notificationService != null) {
                                notificationService.createNotification(
                                        u,
                                        "Contest Starting Soon ⏳",
                                        "Contest '" + contest.getTitle() + "' starts in " + reminderMins + " minutes. Enter the waiting area now!",
                                        "CONTEST",
                                        "/contests/" + contestId
                                );
                            }
                            if (emailService != null && u.getEmail() != null) {
                                emailService.sendContest10MinReminderEmail(
                                        u.getId(),
                                        u.getEmail(),
                                        u.getName() != null ? u.getName() : u.getUsername(),
                                        contest.getTitle(),
                                        contest.getStartTime(),
                                        contest.getDurationMinutes(),
                                        contest.getId()
                                );
                            }
                        } catch (Exception ignored) {}
                    }
                }
            }

            // 2. Contest Started notification
            if (!Boolean.TRUE.equals(contest.isStartNotificationSent())
                    && contest.getStartTime() != null
                    && !now.isBefore(contest.getStartTime())
                    && now.isBefore(contest.getEndTime())) {

                contest.setStartNotificationSent(true);
                contestRepo.save(contest);

                List<ContestParticipant> participants = contestParticipantRepo.findByContestId(contestId);
                for (ContestParticipant cp : participants) {
                    User u = cp.getUser();
                    if (u != null) {
                        try {
                            if (notificationService != null) {
                                notificationService.createNotification(
                                        u,
                                        "Contest Live Now! 🚀",
                                        "Contest '" + contest.getTitle() + "' is now live! Enter the arena now to start solving.",
                                        "CONTEST",
                                        "/contests/" + contestId
                                );
                            }
                            if (emailService != null && u.getEmail() != null) {
                                emailService.sendContestStartedEmail(
                                        u.getId(),
                                        u.getEmail(),
                                        u.getName() != null ? u.getName() : u.getUsername(),
                                        contest.getTitle(),
                                        contest.getEndTime(),
                                        contest.getDurationMinutes(),
                                        contest.getId()
                                );
                            }
                        } catch (Exception ignored) {}
                    }
                }
            }

            // 3. Contest Ended / Results Available notification + Rank 1 Certificate Generation
            if (!Boolean.TRUE.equals(contest.isResultNotificationSent())
                    && contest.getEndTime() != null
                    && !now.isBefore(contest.getEndTime())) {

                contest.setResultNotificationSent(true);
                contestRepo.save(contest);

                List<ContestLeaderboardEntryDto> leaderboard = getContestLeaderboard(contestId);
                Map<Long, ContestLeaderboardEntryDto> entryByUser = leaderboard.stream()
                        .filter(e -> e.getUserId() != null)
                        .collect(Collectors.toMap(ContestLeaderboardEntryDto::getUserId, e -> e, (a, b) -> a));

                List<ContestParticipant> participants = contestParticipantRepo.findByContestId(contestId);
                for (ContestParticipant cp : participants) {
                    User u = cp.getUser();
                    if (u != null) {
                        ContestLeaderboardEntryDto entry = entryByUser.get(u.getId());
                        int rank = (entry != null && entry.getRank() > 0) ? entry.getRank() : leaderboard.size() + 1;
                        int score = (entry != null) ? entry.getScore() : 0;
                        int solved = (entry != null) ? entry.getProblemsSolved() : 0;

                        // update participant entity with final score & stats
                        cp.setScore(score);
                        cp.setRank(rank);
                        cp.setCorrectAnswers(solved);
                        if (cp.getParticipatedAt() != null) {
                            cp.setStatus("COMPLETED");
                        }
                        contestParticipantRepo.save(cp);

                        try {
                            if (notificationService != null) {
                                notificationService.createNotification(
                                        u,
                                        "Contest Results Published 🏆",
                                        "Contest '" + contest.getTitle() + "' results are available! Your Rank: #" + rank + ", Score: " + score,
                                        "CONTEST",
                                        "/contests/" + contestId + "/result"
                                );
                            }
                            if (emailService != null && u.getEmail() != null) {
                                emailService.sendContestResultAvailableEmail(
                                        u.getId(),
                                        u.getEmail(),
                                        u.getName() != null ? u.getName() : u.getUsername(),
                                        contest.getTitle(),
                                        rank,
                                        score,
                                        solved,
                                        contest.getId()
                                );
                            }
                        } catch (Exception ignored) {}
                    }
                }

                // Automatically generate Rank 1 Certificate for the contest winner once results are finalized
                if (!Boolean.TRUE.equals(contest.isCertificateIssued())) {
                    contest.setCertificateIssued(true);
                    contestRepo.save(contest);

                    if (!leaderboard.isEmpty()) {
                        ContestLeaderboardEntryDto rank1 = leaderboard.stream()
                                .filter(e -> e.getRank() == 1)
                                .findFirst()
                                .orElse(null);

                        if (rank1 != null && rank1.getUserId() != null && certificateService != null) {
                            userRepo.findById(rank1.getUserId()).ifPresent(winner -> {
                                try {
                                    certificateService.issueContestRank1Certificate(
                                            winner,
                                            contest,
                                            rank1.getScore(),
                                            rank1.getProblemsSolved()
                                    );
                                } catch (Exception ex) {
                                    System.err.println("Failed to issue Rank 1 contest certificate: " + ex.getMessage());
                                }
                            });
                        }
                    }
                }
            }
        }
    }
}
