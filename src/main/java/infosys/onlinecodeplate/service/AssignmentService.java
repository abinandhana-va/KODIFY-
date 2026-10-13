package infosys.onlinecodeplate.service;

import infosys.onlinecodeplate.dto.AppDtos.*;
import infosys.onlinecodeplate.entity.*;
import infosys.onlinecodeplate.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AssignmentService {

    private final AssignmentRepository assignmentRepo;
    private final AssignmentProblemRepository assignmentProblemRepo;
    private final AssignmentUserRepository assignmentUserRepo;
    private final AssignmentAttemptRepository assignmentAttemptRepo;
    private final ProblemRepository problemRepo;
    private final UserRepository userRepo;
    private final UserSubmissionRepository userSubmissionRepo;
    private final ActivityService activityService;
    private final AssignmentCreatorVerificationService creatorVerificationService;
    private final EmailService emailService;
    private final ExamRecordingRepository examRecordingRepo;
    private final AssignmentExamService assignmentExamService;

    private static final SecureRandom RANDOM = new SecureRandom();

    public AssignmentService(AssignmentRepository assignmentRepo,
                             AssignmentProblemRepository assignmentProblemRepo,
                             AssignmentUserRepository assignmentUserRepo,
                             AssignmentAttemptRepository assignmentAttemptRepo,
                             ProblemRepository problemRepo,
                             UserRepository userRepo,
                             UserSubmissionRepository userSubmissionRepo,
                             ActivityService activityService,
                             AssignmentCreatorVerificationService creatorVerificationService,
                             EmailService emailService,
                             ExamRecordingRepository examRecordingRepo,
                             AssignmentExamService assignmentExamService) {
        this.assignmentRepo = assignmentRepo;
        this.assignmentProblemRepo = assignmentProblemRepo;
        this.assignmentUserRepo = assignmentUserRepo;
        this.assignmentAttemptRepo = assignmentAttemptRepo;
        this.problemRepo = problemRepo;
        this.userRepo = userRepo;
        this.userSubmissionRepo = userSubmissionRepo;
        this.activityService = activityService;
        this.creatorVerificationService = creatorVerificationService;
        this.emailService = emailService;
        this.examRecordingRepo = examRecordingRepo;
        this.assignmentExamService = assignmentExamService;
    }

    private String generateUniqueExamCode() {
        int code = 100000 + RANDOM.nextInt(900000);
        return String.valueOf(code);
    }

    @Transactional
    public AssignmentDto createAssignment(AssignmentRequestDto req, User creator) {
        if (creator == null) {
            throw new RuntimeException("Authentication required to create assignments.");
        }

        // Check Host Verification approval
        boolean isApprovedCreator = creatorVerificationService.isUserApprovedCreator(creator);
        if (!isApprovedCreator) {
            throw new RuntimeException("Host Verification Required. Only users with HOST_VERIFIED status can create assignments.");
        }

        if (req.getTitle() == null || req.getTitle().isBlank()) {
            throw new RuntimeException("Assignment title cannot be empty.");
        }
        if (req.getProblemIds() == null || req.getProblemIds().isEmpty()) {
            throw new RuntimeException("At least one problem must be included in the assignment.");
        }
        if (req.getUserIds() == null || req.getUserIds().isEmpty()) {
            throw new RuntimeException("At least one recipient user must be assigned.");
        }

        LocalDateTime start = req.getStartTime() != null ? req.getStartTime() : LocalDateTime.now();
        LocalDateTime due = req.getDueDate();
        if (due != null && due.isBefore(start)) {
            throw new RuntimeException("Due date cannot be before start date.");
        }

        Assignment assignment = new Assignment(
                req.getTitle().trim(),
                req.getDescription() != null ? req.getDescription().trim() : "",
                creator,
                start,
                due,
                req.getStatus() != null ? req.getStatus().trim().toUpperCase() : "ACTIVE",
                req.getSecureMode() != null ? req.getSecureMode() : false,
                req.getDurationMinutes() != null ? req.getDurationMinutes() : 60
        );
        if (req.getAllowedAttempts() != null) {
            assignment.setAllowedAttempts(req.getAllowedAttempts());
        }
        assignment = assignmentRepo.save(assignment);

        // Save Assignment Problems
        int order = 1;
        if (req.getProblemIds() != null) {
            for (int i = 0; i < req.getProblemIds().size(); i++) {
                Long pId = req.getProblemIds().get(i);
                if (pId == null) continue;
                Problem p = problemRepo.findById(pId).orElse(null);
                if (p != null) {
                    int points = (req.getProblemPoints() != null && i < req.getProblemPoints().size() && req.getProblemPoints().get(i) != null)
                            ? req.getProblemPoints().get(i)
                            : 100;
                    AssignmentProblem ap = new AssignmentProblem(assignment, p, order++, points);
                    assignmentProblemRepo.save(ap);
                }
            }
        }

        // Lookup Creator Org Name from Verification if available
        AssignmentCreatorVerificationDto creatorStatus = creatorVerificationService.getUserVerificationStatus(creator);
        String orgName = (creatorStatus != null && creatorStatus.getOrganizationName() != null)
                ? creatorStatus.getOrganizationName()
                : "KODIFY Assessment";

        // Save Assigned Users with unique exam access codes and dispatch invitation emails
        if (req.getUserIds() != null) {
            for (Long uId : req.getUserIds()) {
                if (uId == null || uId.equals(creator.getId())) continue;
                User targetUser = userRepo.findById(uId).orElse(null);
                if (targetUser != null) {
                    String uniqueCode = generateUniqueExamCode();
                    AssignmentUser au = new AssignmentUser(
                            assignment,
                            targetUser,
                            uniqueCode,
                            LocalDateTime.now(),
                            due
                    );
                    assignmentUserRepo.save(au);

                    // Send email invitation to candidate with unique 6-digit code
                    try {
                        if (emailService != null) {
                            emailService.sendAssignmentInvitationEmail(
                                    targetUser.getId(),
                                    targetUser.getEmail(),
                                    targetUser.getName(),
                                    assignment.getTitle(),
                                    orgName,
                                    start,
                                    due,
                                    assignment.getDurationMinutes(),
                                    uniqueCode,
                                    assignment.getDescription(),
                                    assignment.getId()
                            );
                        }
                    } catch (Exception ignored) {}
                }
            }
        }

        activityService.logActivity(
                creator,
                "Assignment Created",
                "Created assignment '" + assignment.getTitle() + "' with " + req.getProblemIds().size() + " problems."
        );

        return mapToDto(assignment, creator);
    }

    @Transactional
    public ProblemDto createCustomQuestionForAssignment(CreateCustomQuestionDto req, User creator) {
        if (creator == null) {
            throw new RuntimeException("Authentication required to create assignment questions.");
        }

        boolean isApprovedCreator = creatorVerificationService.isUserApprovedCreator(creator);
        if (!isApprovedCreator && !Role.ADMIN.equals(creator.getRole())) {
            throw new RuntimeException("Host Verification Required. Only verified hosts can create custom questions.");
        }

        if (req.getTitle() == null || req.getTitle().isBlank()) {
            throw new RuntimeException("Question title is required.");
        }
        if (req.getDescription() == null || req.getDescription().isBlank()) {
            throw new RuntimeException("Question description is required.");
        }

        String qType = "MCQ".equalsIgnoreCase(req.getQuestionType()) ? "MCQ" : "CODING";
        Problem p = new Problem();
        p.setTitle(req.getTitle().trim());
        p.setDescription(req.getDescription().trim());
        p.setConcept(req.getConcept() != null && !req.getConcept().isBlank() ? req.getConcept().trim() : "General");
        p.setDifficulty(req.getDifficulty() != null ? req.getDifficulty().trim().toUpperCase() : "MEDIUM");
        p.setQuestionType(qType);
        p.setImageUrl(req.getImageUrl() != null && !req.getImageUrl().isBlank() ? req.getImageUrl().trim() : null);
        p.setIsPrivate(true);
        p.setCreatorId(creator.getId());

        if ("MCQ".equalsIgnoreCase(qType)) {
            if (req.getOptions() == null || req.getOptions().size() < 2) {
                throw new RuntimeException("MCQ must have at least 2 options.");
            }
            List<String> cleanedOptions = req.getOptions().stream()
                    .filter(opt -> opt != null && !opt.trim().isEmpty())
                    .map(opt -> opt.trim())
                    .collect(Collectors.toList());
            if (cleanedOptions.size() < 2) {
                throw new RuntimeException("MCQ must have at least 2 non-empty options.");
            }
            if (req.getCorrectOption() == null || req.getCorrectOption().isBlank()) {
                throw new RuntimeException("Correct option must be selected for the MCQ.");
            }
            p.setOptions(cleanedOptions);
            p.setCorrectOption(req.getCorrectOption().trim());
            p.setEditorial(req.getExplanation() != null ? req.getExplanation().trim() : "");
        } else {
            p.setConstraints(req.getConstraints() != null ? req.getConstraints().trim() : "Standard constraints apply.");
            p.setAllowedLanguages(req.getAllowedLanguages());
            p.setStarterCodeC(req.getStarterCodeC());
            p.setStarterCodePython(req.getStarterCodePython());
            p.setStarterCodeJava(req.getStarterCodeJava());
            p.setStarterCodeCpp(req.getStarterCodeCpp());
            p.setStarterCodeJs(req.getStarterCodeJs());
            p.setStarterCodeGo(req.getStarterCodeGo());
            p.setStarterCodeRust(req.getStarterCodeRust());
            p.setSolutionC(req.getSolutionC());
            p.setSolutionPython(req.getSolutionPython());
            p.setSolutionJava(req.getSolutionJava());
            p.setSolutionCpp(req.getSolutionCpp());
            p.setSolutionJs(req.getSolutionJs());
            p.setSolutionGo(req.getSolutionGo());
            p.setSolutionRust(req.getSolutionRust());
            p.setSolution(req.getSolution());
            p.setEditorial(req.getEditorial() != null ? req.getEditorial() : req.getExplanation());

            if (req.getTestCasesList() != null) {
                for (TestCaseDto tcDto : req.getTestCasesList()) {
                    if (tcDto.getInput() != null && !tcDto.getInput().isBlank() &&
                        tcDto.getExpectedOutput() != null && !tcDto.getExpectedOutput().isBlank()) {
                        TestCase tc = new TestCase(tcDto.getInput().trim(), tcDto.getExpectedOutput().trim(), tcDto.getHidden());
                        p.addTestCase(tc);
                    }
                }
            }

            if (req.getHints() != null) {
                int hintOrder = 1;
                for (HintDto hDto : req.getHints()) {
                    if (hDto.getContent() != null && !hDto.getContent().isBlank()) {
                        ProblemHint hint = new ProblemHint(hintOrder++, hDto.getContent().trim());
                        p.addHint(hint);
                    }
                }
            }
        }

        p = problemRepo.save(p);

        ProblemDto dto = new ProblemDto();
        dto.setId(p.getId());
        dto.setTitle(p.getTitle());
        dto.setConcept(p.getConcept());
        dto.setDifficulty(p.getDifficulty());
        dto.setDescription(p.getDescription());
        dto.setConstraints(p.getConstraints());
        dto.setQuestionType(p.getQuestionType());
        dto.setImageUrl(p.getImageUrl());
        dto.setOptions(p.getOptions());
        dto.setCorrectOption(p.getCorrectOption());
        dto.setAllowedLanguages(p.getAllowedLanguages());
        dto.setCreatorId(p.getCreatorId());
        dto.setIsPrivate(p.getIsPrivate());
        return dto;
    }

    @Transactional
    public AssignmentDto updateAssignment(Long id, AssignmentRequestDto req, User currentUser) {
        Assignment assignment = assignmentRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Assignment not found with ID " + id));

        boolean isCreator = currentUser != null && assignment.getCreator() != null && assignment.getCreator().getId().equals(currentUser.getId());

        if (!isCreator) {
            throw new RuntimeException("Access denied. You can only edit assessments that you created.");
        }

        if (req.getTitle() != null && !req.getTitle().isBlank()) {
            assignment.setTitle(req.getTitle().trim());
        }
        if (req.getDescription() != null) {
            assignment.setDescription(req.getDescription().trim());
        }
        if (req.getStartTime() != null) {
            assignment.setStartTime(req.getStartTime());
        }
        if (req.getDueDate() != null) {
            assignment.setDueDate(req.getDueDate());
        }
        if (req.getStatus() != null && !req.getStatus().isBlank()) {
            assignment.setStatus(req.getStatus().trim().toUpperCase());
        }

        // Lifecycle enforcement: prevent modifying questions or marks if any attempts have started
        List<AssignmentAttempt> existingAttempts = assignmentAttemptRepo.findByAssignmentId(id);
        boolean hasStartedAttempts = existingAttempts != null && !existingAttempts.isEmpty();

        // Update problems if provided
        if (req.getProblemIds() != null && !req.getProblemIds().isEmpty()) {
            if (hasStartedAttempts) {
                throw new RuntimeException("Cannot modify assignment questions or scoring after candidates have already started their attempts.");
            }
            assignmentProblemRepo.deleteByAssignmentId(id);
            int order = 1;
            for (int i = 0; i < req.getProblemIds().size(); i++) {
                Long pId = req.getProblemIds().get(i);
                Problem p = problemRepo.findById(pId).orElse(null);
                if (p != null) {
                    int points = (req.getProblemPoints() != null && i < req.getProblemPoints().size())
                            ? req.getProblemPoints().get(i)
                            : 100;
                    AssignmentProblem ap = new AssignmentProblem(assignment, p, order++, points);
                    assignmentProblemRepo.save(ap);
                }
            }
        }

        // Update assigned users if provided
        if (req.getUserIds() != null && !req.getUserIds().isEmpty()) {
            List<AssignmentUser> existingAu = assignmentUserRepo.findByAssignmentId(id);
            Map<Long, AssignmentUser> existingMap = existingAu.stream()
                    .collect(Collectors.toMap(au -> au.getUser().getId(), au -> au, (a, b) -> a));

            Set<Long> newUserIds = new HashSet<>(req.getUserIds());

            // Remove users no longer in list
            for (AssignmentUser au : existingAu) {
                if (!newUserIds.contains(au.getUser().getId())) {
                    assignmentUserRepo.delete(au);
                }
            }

            // Add new users
            for (Long uId : req.getUserIds()) {
                if (!existingMap.containsKey(uId)) {
                    User targetUser = userRepo.findById(uId).orElse(null);
                    if (targetUser != null) {
                        String uniqueCode = generateUniqueExamCode();
                        AssignmentUser au = new AssignmentUser(
                                assignment,
                                targetUser,
                                uniqueCode,
                                LocalDateTime.now(),
                                assignment.getDueDate()
                        );
                        assignmentUserRepo.save(au);

                        try {
                            if (emailService != null) {
                                emailService.sendAssignmentInvitationEmail(
                                        targetUser.getId(),
                                        targetUser.getEmail(),
                                        targetUser.getName(),
                                        assignment.getTitle(),
                                        "KODIFY Assessment",
                                        assignment.getStartTime(),
                                        assignment.getDueDate(),
                                        assignment.getDurationMinutes(),
                                        uniqueCode,
                                        assignment.getDescription(),
                                        assignment.getId()
                                );
                            }
                        } catch (Exception ignored) {}
                    }
                }
            }
        }

        assignment = assignmentRepo.save(assignment);
        return mapToDto(assignment, currentUser);
    }

    @Transactional
    public void deleteAssignment(Long id, User currentUser) {
        Assignment assignment = assignmentRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Assignment not found with ID " + id));

        boolean isCreator = currentUser != null && assignment.getCreator() != null && assignment.getCreator().getId().equals(currentUser.getId());

        if (!isCreator) {
            throw new RuntimeException("Access denied. You can only delete assessments that you created.");
        }

        assignmentProblemRepo.deleteByAssignmentId(id);
        assignmentUserRepo.deleteByAssignmentId(id);
        assignmentRepo.delete(assignment);
    }

    @Transactional(readOnly = true)
    public List<AssignmentDto> getAssignmentsCreatedByUser(User creator) {
        List<Assignment> assignments = assignmentRepo.findByCreatorIdOrderByCreatedAtDesc(creator.getId());
        return assignments.stream().map(a -> mapToDto(a, creator)).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AssignmentDto> getAssignmentsAssignedToUser(User user) {
        List<Assignment> assignments = assignmentRepo.findAssignedToUserId(user.getId());
        List<Long> userSolvedProblemIds = userSubmissionRepo.findSolvedProblemIdsByUserId(user.getId(), "ACCEPTED");
        Set<Long> solvedSet = new HashSet<>(userSolvedProblemIds);

        List<AssignmentDto> dtos = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        for (Assignment a : assignments) {
            AssignmentDto dto = mapToDto(a, user);
            List<AssignmentProblem> apList = assignmentProblemRepo.findByAssignmentIdOrderByProblemOrderAsc(a.getId());
            int total = apList.size();
            int solved = 0;
            for (AssignmentProblem ap : apList) {
                if (ap.getProblem() != null && solvedSet.contains(ap.getProblem().getId())) {
                    solved++;
                }
            }
            Optional<AssignmentAttempt> optAtt = assignmentAttemptRepo.findByAssignmentIdAndUserId(a.getId(), user.getId());
            boolean hasCompletedAttempt = optAtt.isPresent() && ("COMPLETED".equalsIgnoreCase(optAtt.get().getStatus()) || optAtt.get().getSubmittedAt() != null);
            boolean isClosed = "CLOSED".equalsIgnoreCase(a.getStatus()) || (a.getDueDate() != null && a.getDueDate().isBefore(now));
            boolean isAllSolved = total > 0 && solved >= total;

            dto.setProblemCount(total);
            dto.setSolvedCount(solved);
            dto.setProgressPercent(total > 0 ? (solved * 100.0 / total) : 0.0);
            dto.setCompleted(hasCompletedAttempt || isAllSolved || isClosed);
            dtos.add(dto);
        }
        return dtos;
    }

    @Transactional(readOnly = true)
    public List<AssignmentDto> getAllAssignmentsForAdmin() {
        List<Assignment> assignments = assignmentRepo.findAllByOrderByCreatedAtDesc();
        return assignments.stream().map(a -> mapToDto(a, null)).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AssignmentDto getAssignmentPublicInvitationInfo(Long id) {
        Assignment a = assignmentRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Assignment invitation not found with ID " + id));

        AssignmentDto dto = mapToDto(a, null);
        List<AssignmentProblem> apList = assignmentProblemRepo.findByAssignmentIdOrderByProblemOrderAsc(id);
        dto.setProblemCount(apList != null ? apList.size() : 0);
        return dto;
    }

    @Transactional(readOnly = true)
    public AssignmentDetailDto getAssignmentDetail(Long id, User currentUser) {
        Assignment a = assignmentRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Assignment not found with ID " + id));

        boolean isCreator = currentUser != null && a.getCreator() != null && a.getCreator().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser != null && Role.ADMIN.equals(currentUser.getRole());
        boolean isAssigned = currentUser != null && assignmentUserRepo.existsByAssignmentIdAndUserId(id, currentUser.getId());

        if (!isCreator && !isAdmin && !isAssigned) {
            throw new RuntimeException("Access denied. You do not have permission to view this assignment.");
        }

        AssignmentDetailDto detailDto = new AssignmentDetailDto();
        AssignmentDto base = mapToDto(a, currentUser);
        copyDtoFields(base, detailDto);
        detailDto.setCreator(isCreator || isAdmin);

        // Fetch problems
        List<AssignmentProblem> apList = assignmentProblemRepo.findByAssignmentIdOrderByProblemOrderAsc(id);
        List<Long> solvedProblemIds = (currentUser != null)
                ? userSubmissionRepo.findSolvedProblemIdsByUserId(currentUser.getId(), "ACCEPTED")
                : Collections.emptyList();
        Set<Long> solvedSet = new HashSet<>(solvedProblemIds);

        List<AssignmentProblemDto> pDtos = new ArrayList<>();
        int solvedCount = 0;

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

            boolean isSolved = solvedSet.contains(p.getId());
            pDto.setSolved(isSolved);
            if (isSolved) solvedCount++;

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

            List<TestCaseDto> tcList = new ArrayList<>();
            if (p.getTestCasesList() != null) {
                for (TestCase tc : p.getTestCasesList()) {
                    if (tc.getHidden() == null || !tc.getHidden()) {
                        tcList.add(new TestCaseDto(tc.getInput(), tc.getExpectedOutput(), false));
                    }
                }
            }
            pDto.setTestCasesList(tcList);

            List<HintDto> hints = new ArrayList<>();
            if (p.getHintsList() != null) {
                for (ProblemHint h : p.getHintsList()) {
                    hints.add(new HintDto(h.getId(), h.getHintOrder(), h.getContent()));
                }
            }
            pDto.setHints(hints);
            pDto.setQuestionType(p.getQuestionType());
            pDto.setImageUrl(p.getImageUrl());
            pDto.setOptions(p.getOptions());
            if (isCreator || isAdmin) {
                pDto.setCorrectOption(p.getCorrectOption());
            }
            pDto.setExplanation(p.getEditorial());

            pDtos.add(pDto);
        }

        LocalDateTime now = LocalDateTime.now();
        Optional<AssignmentAttempt> optAtt = (currentUser != null)
                ? assignmentAttemptRepo.findByAssignmentIdAndUserId(id, currentUser.getId())
                : Optional.empty();
        boolean hasCompletedAttempt = optAtt.isPresent() && ("COMPLETED".equalsIgnoreCase(optAtt.get().getStatus()) || optAtt.get().getSubmittedAt() != null);
        boolean isClosed = "CLOSED".equalsIgnoreCase(a.getStatus()) || (a.getDueDate() != null && a.getDueDate().isBefore(now));
        boolean isAllSolved = pDtos.size() > 0 && solvedCount >= pDtos.size();

        detailDto.setProblems(pDtos);
        detailDto.setProblemCount(pDtos.size());
        detailDto.setSolvedCount(solvedCount);
        detailDto.setProgressPercent(pDtos.size() > 0 ? (solvedCount * 100.0 / pDtos.size()) : 0.0);
        detailDto.setCompleted(hasCompletedAttempt || isAllSolved || isClosed);
        detailDto.setCreator(isCreator || isAdmin);

        if (optAtt.isPresent() && currentUser != null) {
            try {
                detailDto.setCurrentAttempt(assignmentExamService.getAttemptStatus(id, currentUser));
            } catch (Exception ignored) {}
        }

        // If creator or admin, include participants progress
        if (isCreator || isAdmin) {
            detailDto.setParticipants(getParticipantsProgress(id, apList, isCreator || isAdmin, currentUser));
        }

        return detailDto;
    }

    @Transactional(readOnly = true)
    public List<AssignmentParticipantProgressDto> getAssignmentParticipantsProgress(Long id, User currentUser) {
        Assignment a = assignmentRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Assignment not found with ID " + id));

        boolean isCreator = currentUser != null && a.getCreator() != null && a.getCreator().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser != null && Role.ADMIN.equals(currentUser.getRole());

        if (!isCreator && !isAdmin) {
            throw new RuntimeException("Access denied. Only the assignment creator or admin can view participant progress.");
        }

        List<AssignmentProblem> apList = assignmentProblemRepo.findByAssignmentIdOrderByProblemOrderAsc(id);
        return getParticipantsProgress(id, apList, true, currentUser);
    }

    private List<AssignmentParticipantProgressDto> getParticipantsProgress(Long assignmentId, List<AssignmentProblem> apList, boolean canSeeCodes, User currentUser) {
        List<AssignmentUser> auList = assignmentUserRepo.findByAssignmentId(assignmentId);
        List<Long> targetProblemIds = apList.stream()
                .filter(ap -> ap.getProblem() != null)
                .map(ap -> ap.getProblem().getId())
                .collect(Collectors.toList());

        List<AssignmentParticipantProgressDto> progressList = new ArrayList<>();

        for (AssignmentUser au : auList) {
            User u = au.getUser();
            if (u == null) continue;

            Optional<AssignmentAttempt> optAtt = assignmentAttemptRepo.findByAssignmentIdAndUserId(assignmentId, u.getId());
            List<Long> solved = userSubmissionRepo.findSolvedProblemIdsByUserId(u.getId(), "ACCEPTED");
            Set<Long> userSolvedSet = new HashSet<>(solved);

            int solvedCount = 0;
            int score = 0;
            for (AssignmentProblem ap : apList) {
                if (ap.getProblem() != null && userSolvedSet.contains(ap.getProblem().getId())) {
                    solvedCount++;
                    score += (ap.getPoints() != null ? ap.getPoints() : 100);
                }
            }

            int totalCount = targetProblemIds.size();
            double progressPercent = totalCount > 0 ? (solvedCount * 100.0 / totalCount) : 0.0;
            String computedStatus = (totalCount > 0 && solvedCount >= totalCount) ? "COMPLETED" : (solvedCount > 0 ? "IN_PROGRESS" : "PENDING");

            AssignmentParticipantProgressDto pDto = new AssignmentParticipantProgressDto();
            pDto.setUserId(u.getId());
            pDto.setUsername(u.getUsername());
            pDto.setName(u.getName());
            pDto.setEmail(u.getEmail());
            pDto.setSolvedCount(solvedCount);
            pDto.setTotalCount(totalCount);
            pDto.setProgressPercent(progressPercent);
            pDto.setAssignedAt(au.getAssignedAt());
            pDto.setCompletedAt(au.getCompletedAt());
            pDto.setGender(au.getGender());
            pDto.setExamStatus(au.getStatus());

            // Only expose access code to creator/admin or to the participant themselves
            if (canSeeCodes || (currentUser != null && currentUser.getId().equals(u.getId()))) {
                pDto.setAccessCode(au.getAccessCode());
            }

            if (optAtt.isPresent()) {
                AssignmentAttempt att = optAtt.get();
                pDto.setAttemptId(att.getId());
                pDto.setStatus(att.getStatus());
                pDto.setScore(att.getScore() > 0 ? att.getScore() : score);
                pDto.setIntegrityViolationCount(att.getIntegrityViolationCount());
                pDto.setFlaggedForReview(att.getFlaggedForReview());
            } else {
                pDto.setStatus(computedStatus);
                pDto.setScore(score);
                pDto.setIntegrityViolationCount(0);
                pDto.setFlaggedForReview(false);
            }

            progressList.add(pDto);
        }

        return progressList;
    }

    @Transactional(readOnly = true)
    public AssignmentReportDto getAssignmentReport(Long id, User currentUser) {
        Assignment a = assignmentRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Assignment not found with ID " + id));

        boolean isCreator = currentUser != null && a.getCreator() != null && a.getCreator().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser != null && Role.ADMIN.equals(currentUser.getRole());

        if (!isCreator && !isAdmin) {
            throw new RuntimeException("Access denied. Only the assignment creator or administrator can view this assignment report.");
        }

        List<AssignmentProblem> apList = assignmentProblemRepo.findByAssignmentIdOrderByProblemOrderAsc(id);
        List<AssignmentUser> auList = assignmentUserRepo.findByAssignmentId(id);
        List<AssignmentAttempt> attempts = assignmentAttemptRepo.findByAssignmentIdOrderByStartedAtDesc(id);
        Map<Long, AssignmentAttempt> userAttemptMap = attempts.stream()
                .filter(att -> att.getUser() != null)
                .collect(Collectors.toMap(att -> att.getUser().getId(), att -> att, (att1, att2) -> att1));

        int totalPoints = apList.stream().mapToInt(ap -> ap.getPoints() != null ? ap.getPoints() : 100).sum();
        int totalInvited = auList.size();
        int openedCount = 0;
        int attemptedCount = 0;
        int submittedCount = 0;
        int totalScoresSum = 0;

        // Compute participant details
        List<ParticipantReportDto> participantReportList = new ArrayList<>();
        Map<Long, Integer> questionCorrectCounts = new HashMap<>();
        Map<Long, Integer> questionAttemptCounts = new HashMap<>();

        for (AssignmentProblem ap : apList) {
            if (ap != null && ap.getProblem() != null && ap.getProblem().getId() != null) {
                questionCorrectCounts.put(ap.getProblem().getId(), 0);
                questionAttemptCounts.put(ap.getProblem().getId(), 0);
            }
        }

        for (AssignmentUser au : auList) {
            User u = au.getUser();
            if (u == null) continue;

            AssignmentAttempt att = userAttemptMap.get(u.getId());
            List<Long> userSolved = userSubmissionRepo.findSolvedProblemIdsByUserId(u.getId(), "ACCEPTED");
            Set<Long> userSolvedSet = new HashSet<>(userSolved);

            boolean hasAttempt = (att != null);
            if (hasAttempt) attemptedCount++;
            if (hasAttempt || !"INVITED".equalsIgnoreCase(au.getStatus())) openedCount++;
            boolean isSubmitted = hasAttempt && ("COMPLETED".equalsIgnoreCase(att.getStatus()) || att.getSubmittedAt() != null);
            if (isSubmitted) submittedCount++;

            int candidateAttemptedQ = 0;
            int candidateEarnedScore = 0;
            List<CandidateQuestionResultDto> qResults = new ArrayList<>();

            for (AssignmentProblem ap : apList) {
                Problem prob = ap.getProblem();
                if (prob == null) continue;

                boolean solved = userSolvedSet.contains(prob.getId());
                boolean hasSubmissions = userSubmissionRepo.existsByUserIdAndProblemId(u.getId(), prob.getId());

                String qStatus = "NOT_ATTEMPTED";
                int earned = 0;
                if (solved) {
                    qStatus = "CORRECT";
                    earned = (ap.getPoints() != null ? ap.getPoints() : 100);
                    candidateAttemptedQ++;
                    candidateEarnedScore += earned;
                    questionCorrectCounts.put(prob.getId(), questionCorrectCounts.getOrDefault(prob.getId(), 0) + 1);
                    questionAttemptCounts.put(prob.getId(), questionAttemptCounts.getOrDefault(prob.getId(), 0) + 1);
                } else if (hasSubmissions) {
                    qStatus = "WRONG";
                    candidateAttemptedQ++;
                    questionAttemptCounts.put(prob.getId(), questionAttemptCounts.getOrDefault(prob.getId(), 0) + 1);
                }

                CandidateQuestionResultDto qrDto = new CandidateQuestionResultDto();
                qrDto.setProblemId(prob.getId());
                qrDto.setQuestionOrder(ap.getProblemOrder());
                qrDto.setTitle(prob.getTitle());
                qrDto.setDifficulty(prob.getDifficulty());
                qrDto.setPoints(ap.getPoints() != null ? ap.getPoints() : 100);
                qrDto.setEarnedPoints(earned);
                qrDto.setStatus(qStatus);
                qrDto.setQuestionType(prob.getQuestionType());
                qrDto.setImageUrl(prob.getImageUrl());
                qrDto.setOptions(prob.getOptions());
                qrDto.setCorrectOption(prob.getCorrectOption());
                qrDto.setExplanation(prob.getEditorial() != null && !prob.getEditorial().isBlank() ? prob.getEditorial() : prob.getDescription());

                List<UserSubmission> userSubList = userSubmissionRepo.findByUserIdAndProblemIdOrderByCreatedAtDesc(u.getId(), prob.getId());
                if (!userSubList.isEmpty()) {
                    UserSubmission latestSub = userSubList.get(0);
                    qrDto.setLanguage(latestSub.getLanguage());
                    qrDto.setSubmittedCode(latestSub.getCode());
                    qrDto.setUserResponse(latestSub.getCode());
                    qrDto.setRuntime(latestSub.getRuntime());
                    qrDto.setExecutionTime(latestSub.getRuntime());
                    qrDto.setCompilerOutput(latestSub.getCompilerOutput());
                    qrDto.setPassedTestCases(latestSub.getPassedTestCases());
                    qrDto.setTotalTestCases(latestSub.getTotalTestCases());
                    qrDto.setSolvedAt(latestSub.getCreatedAt());
                }

                qResults.add(qrDto);
            }

            int finalCandidateScore = (hasAttempt && att.getScore() > 0) ? att.getScore() : candidateEarnedScore;
            totalScoresSum += finalCandidateScore;
            double candidatePercent = totalPoints > 0 ? (finalCandidateScore * 100.0 / totalPoints) : 0.0;

            String partStatus = "NOT_ATTEMPTED";
            if (isSubmitted) partStatus = "SUBMITTED";
            else if (hasAttempt) partStatus = "IN_PROGRESS";
            else if (!"INVITED".equalsIgnoreCase(au.getStatus())) partStatus = "OPENED";

            ParticipantReportDto pDto = new ParticipantReportDto();
            pDto.setUserId(u.getId());
            pDto.setName(u.getName());
            pDto.setUsername(u.getUsername());
            pDto.setEmail(u.getEmail());
            pDto.setStatus(partStatus);
            pDto.setStartedAt(att != null ? att.getStartedAt() : au.getStartedAt());
            pDto.setSubmittedAt(att != null ? att.getSubmittedAt() : au.getCompletedAt());
            pDto.setQuestionsAttempted(candidateAttemptedQ);
            pDto.setQuestionsNotAttempted(Math.max(0, apList.size() - candidateAttemptedQ));
            pDto.setTotalQuestions(apList.size());
            pDto.setScore(finalCandidateScore);
            pDto.setTotalPossibleScore(totalPoints);
            pDto.setPercentage(candidatePercent);
            pDto.setCompletionStatus(isSubmitted ? "COMPLETED" : (hasAttempt ? "IN_PROGRESS" : "PENDING"));

            if (att != null) {
                pDto.setCameraStatus(att.getCameraStatus());
                pDto.setCameraPermissionGranted(att.getCameraPermissionGranted());
                pDto.setCameraInitializedAt(att.getCameraInitializedAt());
                pDto.setIntegrityViolationCount(att.getIntegrityViolationCount());
                pDto.setFlaggedForReview(att.getFlaggedForReview());
            } else {
                pDto.setCameraStatus("NOT_INITIALIZED");
                pDto.setCameraPermissionGranted(false);
                pDto.setIntegrityViolationCount(0);
                pDto.setFlaggedForReview(false);
            }

            pDto.setQuestionResults(qResults);
            participantReportList.add(pDto);
        }

        int notAttemptedCount = Math.max(0, totalInvited - attemptedCount);
        double completionPercent = totalInvited > 0 ? (submittedCount * 100.0 / totalInvited) : 0.0;
        double avgScore = attemptedCount > 0 ? (totalScoresSum * 1.0 / attemptedCount) : 0.0;

        // Compute question-wise performance
        List<QuestionPerformanceDto> qPerfList = new ArrayList<>();
        for (AssignmentProblem ap : apList) {
            Problem prob = ap.getProblem();
            if (prob == null) continue;

            int qAttempts = questionAttemptCounts.getOrDefault(prob.getId(), 0);
            int qCorrect = questionCorrectCounts.getOrDefault(prob.getId(), 0);
            int qWrong = Math.max(0, qAttempts - qCorrect);
            int qNotAttempted = Math.max(0, totalInvited - qAttempts);
            double qAccuracy = qAttempts > 0 ? (qCorrect * 100.0 / qAttempts) : 0.0;

            QuestionPerformanceDto qpDto = new QuestionPerformanceDto();
            qpDto.setProblemId(prob.getId());
            qpDto.setQuestionOrder(ap.getProblemOrder());
            qpDto.setTitle(prob.getTitle());
            qpDto.setDifficulty(prob.getDifficulty());
            qpDto.setPoints(ap.getPoints() != null ? ap.getPoints() : 100);
            qpDto.setAttemptedCount(qAttempts);
            qpDto.setCorrectCount(qCorrect);
            qpDto.setWrongCount(qWrong);
            qpDto.setNotAttemptedCount(qNotAttempted);
            qpDto.setAccuracyPercentage(qAccuracy);
            qPerfList.add(qpDto);
        }

        AssignmentReportDto reportDto = new AssignmentReportDto();
        reportDto.setAssignmentId(a.getId());
        reportDto.setTitle(a.getTitle());
        reportDto.setDescription(a.getDescription());
        if (a.getCreator() != null) {
            reportDto.setCreatorId(a.getCreator().getId());
            reportDto.setCreatorName(a.getCreator().getName());
            reportDto.setCreatorUsername(a.getCreator().getUsername());
        }
        reportDto.setCreatedAt(a.getCreatedAt());
        reportDto.setStartTime(a.getStartTime());
        reportDto.setDueDate(a.getDueDate());
        reportDto.setStatus(a.getStatus());
        reportDto.setSecureMode(a.getSecureMode());
        reportDto.setDurationMinutes(a.getDurationMinutes());
        reportDto.setTotalQuestions(apList.size());
        reportDto.setTotalPoints(totalPoints);

        reportDto.setTotalInvited(totalInvited);
        reportDto.setOpenedCount(openedCount);
        reportDto.setAttemptedCount(attemptedCount);
        reportDto.setSubmittedCount(submittedCount);
        reportDto.setNotAttemptedCount(notAttemptedCount);
        reportDto.setCompletionPercentage(completionPercent);
        reportDto.setAverageScore(avgScore);
        reportDto.setAverageAccuracy(totalPoints > 0 ? (avgScore * 100.0 / totalPoints) : 0.0);

        reportDto.setQuestionPerformance(qPerfList);
        reportDto.setParticipants(participantReportList);

        return reportDto;
    }

    @Transactional
    public InviteAllResponseDto inviteAllEligibleUsers(Long assignmentId, User currentUser) {
        Assignment a = assignmentRepo.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found with ID " + assignmentId));

        boolean isCreator = currentUser != null && a.getCreator() != null && a.getCreator().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser != null && Role.ADMIN.equals(currentUser.getRole());

        if (!isCreator && !isAdmin) {
            throw new RuntimeException("Access denied. Only the assignment creator or administrator can invite users.");
        }

        List<User> allUsers = userRepo.findAll();
        List<AssignmentUser> existing = assignmentUserRepo.findByAssignmentId(assignmentId);
        Set<Long> alreadyInvitedUserIds = existing.stream()
                .filter(au -> au.getUser() != null)
                .map(au -> au.getUser().getId())
                .collect(Collectors.toSet());

        // Do not invite the creator themselves unless specifically desired, filter out BLOCKED users
        List<User> eligible = allUsers.stream()
                .filter(u -> !"BLOCKED".equalsIgnoreCase(u.getStatus()))
                .filter(u -> !alreadyInvitedUserIds.contains(u.getId()))
                .collect(Collectors.toList());

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = a.getDueDate() != null ? a.getDueDate() : now.plusDays(7);

        List<AssignmentUser> toSave = new ArrayList<>();
        for (User u : eligible) {
            String code = generateUniqueExamCode();
            AssignmentUser au = new AssignmentUser(a, u, code, now, expiresAt);
            toSave.add(au);
        }

        if (!toSave.isEmpty()) {
            assignmentUserRepo.saveAll(toSave);

            // Send invitations asynchronously / simulated
            for (AssignmentUser au : toSave) {
                try {
                    emailService.sendAssignmentInvitationEmail(
                            au.getUser().getId(),
                            au.getUser().getEmail(),
                            au.getUser().getName() != null ? au.getUser().getName() : au.getUser().getUsername(),
                            a.getTitle(),
                            a.getCreator() != null ? a.getCreator().getName() : "KODIFY Assessment",
                            a.getStartTime(),
                            a.getDueDate(),
                            a.getDurationMinutes(),
                            au.getAccessCode(),
                            a.getDescription(),
                            a.getId()
                    );
                } catch (Exception e) {
                    // Log & continue
                }
            }
        }

        return new InviteAllResponseDto(
                allUsers.size(),
                alreadyInvitedUserIds.size(),
                toSave.size(),
                toSave.size() + " users invited successfully."
        );
    }

    @Transactional(readOnly = true)
    public AssignmentParticipantReviewDto getParticipantAssignmentReview(Long assignmentId, User participant) {
        if (participant == null) {
            throw new RuntimeException("Authentication required to view assignment review.");
        }

        Assignment a = assignmentRepo.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found with ID " + assignmentId));

        boolean isAssigned = assignmentUserRepo.existsByAssignmentIdAndUserId(assignmentId, participant.getId());
        Optional<AssignmentAttempt> optAttempt = assignmentAttemptRepo.findByAssignmentIdAndUserId(assignmentId, participant.getId());

        if (!isAssigned && optAttempt.isEmpty()) {
            throw new RuntimeException("Access denied. You were not enrolled in this assessment.");
        }

        List<AssignmentProblem> apList = assignmentProblemRepo.findByAssignmentIdOrderByProblemOrderAsc(assignmentId);
        List<Long> solvedProblemIds = userSubmissionRepo.findSolvedProblemIdsByUserId(participant.getId(), "ACCEPTED");
        Set<Long> solvedSet = new HashSet<>(solvedProblemIds);

        int totalPoints = apList.stream().mapToInt(ap -> ap.getPoints() != null ? ap.getPoints() : 100).sum();
        int attemptedCount = 0;
        int correctCount = 0;
        int wrongCount = 0;
        int earnedScore = 0;

        List<CandidateQuestionResultDto> qResults = new ArrayList<>();
        for (AssignmentProblem ap : apList) {
            Problem prob = ap.getProblem();
            if (prob == null) continue;

            boolean isSolved = solvedSet.contains(prob.getId());
            boolean hasSubmissions = userSubmissionRepo.existsByUserIdAndProblemId(participant.getId(), prob.getId());

            String qStatus = "NOT_ATTEMPTED";
            int points = ap.getPoints() != null ? ap.getPoints() : 100;
            int earned = 0;

            if (isSolved) {
                qStatus = "CORRECT";
                earned = points;
                correctCount++;
                attemptedCount++;
                earnedScore += earned;
            } else if (hasSubmissions) {
                qStatus = "WRONG";
                attemptedCount++;
                wrongCount++;
            }

            CandidateQuestionResultDto qrDto = new CandidateQuestionResultDto();
            qrDto.setProblemId(prob.getId());
            qrDto.setQuestionOrder(ap.getProblemOrder());
            qrDto.setTitle(prob.getTitle());
            qrDto.setDescription(prob.getDescription());
            qrDto.setConstraints(prob.getConstraints());
            qrDto.setDifficulty(prob.getDifficulty());
            qrDto.setPoints(points);
            qrDto.setEarnedPoints(earned);
            qrDto.setStatus(qStatus);
            qrDto.setQuestionType(prob.getQuestionType());
            qrDto.setImageUrl(prob.getImageUrl());
            qrDto.setOptions(prob.getOptions());
            qrDto.setCorrectOption(prob.getCorrectOption());
            qrDto.setExplanation(prob.getEditorial() != null && !prob.getEditorial().isBlank() ? prob.getEditorial() : prob.getDescription());

            List<UserSubmission> userSubList = userSubmissionRepo.findByUserIdAndProblemIdOrderByCreatedAtDesc(participant.getId(), prob.getId());
            if (!userSubList.isEmpty()) {
                UserSubmission latestSub = userSubList.get(0);
                qrDto.setLanguage(latestSub.getLanguage());
                qrDto.setSubmittedCode(latestSub.getCode());
                qrDto.setUserResponse(latestSub.getCode());
                qrDto.setRuntime(latestSub.getRuntime());
                qrDto.setExecutionTime(latestSub.getRuntime());
                qrDto.setCompilerOutput(latestSub.getCompilerOutput());
                qrDto.setPassedTestCases(latestSub.getPassedTestCases());
                qrDto.setTotalTestCases(latestSub.getTotalTestCases());
                qrDto.setSolvedAt(latestSub.getCreatedAt());
            }

            qResults.add(qrDto);
        }

        int unansweredCount = Math.max(0, apList.size() - attemptedCount);
        int finalScore = optAttempt.map(AssignmentAttempt::getScore).orElse(earnedScore);
        double percentage = totalPoints > 0 ? (finalScore * 100.0 / totalPoints) : 0.0;

        long timeTakenSeconds = 0;
        if (optAttempt.isPresent()) {
            AssignmentAttempt att = optAttempt.get();
            if (att.getStartedAt() != null && att.getSubmittedAt() != null) {
                timeTakenSeconds = Math.max(0, java.time.Duration.between(att.getStartedAt(), att.getSubmittedAt()).getSeconds());
            } else if (att.getStartedAt() != null) {
                timeTakenSeconds = Math.max(0, java.time.Duration.between(att.getStartedAt(), LocalDateTime.now()).getSeconds());
            }
        }

        long minutes = timeTakenSeconds / 60;
        long seconds = timeTakenSeconds % 60;
        String formattedTime = String.format("%02d:%02d", minutes, seconds);

        AssignmentParticipantReviewDto reviewDto = new AssignmentParticipantReviewDto();
        reviewDto.setAssignmentId(a.getId());
        reviewDto.setAssignmentTitle(a.getTitle());
        reviewDto.setAssignmentDescription(a.getDescription());
        reviewDto.setUserId(participant.getId());
        reviewDto.setUsername(participant.getUsername());
        reviewDto.setName(participant.getName() != null && !participant.getName().isBlank() ? participant.getName() : participant.getUsername());
        reviewDto.setEmail(participant.getEmail());
        reviewDto.setScore(finalScore);
        reviewDto.setPercentage(percentage);
        reviewDto.setTotalPoints(totalPoints);
        reviewDto.setQuestionsAttempted(attemptedCount);
        reviewDto.setCorrectCount(correctCount);
        reviewDto.setWrongCount(wrongCount);
        reviewDto.setUnansweredCount(unansweredCount);
        reviewDto.setTimeTakenSeconds(timeTakenSeconds);
        reviewDto.setFormattedTime(formattedTime);

        Optional<AssignmentUser> optAu = assignmentUserRepo.findByAssignmentIdAndUserId(assignmentId, participant.getId());

        if (optAttempt.isPresent()) {
            AssignmentAttempt att = optAttempt.get();
            reviewDto.setAttemptId(att.getId());
            reviewDto.setStartedAt(att.getStartedAt() != null ? att.getStartedAt() : optAu.map(AssignmentUser::getStartedAt).orElse(null));
            reviewDto.setSubmittedAt(att.getSubmittedAt() != null ? att.getSubmittedAt() : optAu.map(AssignmentUser::getCompletedAt).orElse(null));
            reviewDto.setStatus(att.getStatus() != null ? att.getStatus() : "SUBMITTED");
            reviewDto.setCameraStatus(att.getCameraStatus());
            reviewDto.setCameraPermissionGranted(att.getCameraPermissionGranted());
            reviewDto.setIntegrityViolationCount(att.getIntegrityViolationCount());
            reviewDto.setFlaggedForReview(att.getFlaggedForReview());

            IntegrityReportDto integrity = assignmentExamService.getIntegrityReport(att.getId(), participant);
            reviewDto.setIntegrityReport(integrity);
        } else if (optAu.isPresent()) {
            AssignmentUser au = optAu.get();
            reviewDto.setStartedAt(au.getStartedAt());
            reviewDto.setSubmittedAt(au.getCompletedAt());
            reviewDto.setStatus(au.getStatus() != null ? au.getStatus() : (earnedScore > 0 ? "IN_PROGRESS" : "NOT_STARTED"));
            reviewDto.setCameraStatus("NOT_INITIALIZED");
            reviewDto.setCameraPermissionGranted(false);
            reviewDto.setIntegrityViolationCount(0);
            reviewDto.setFlaggedForReview(false);
        } else {
            reviewDto.setStatus("NOT_STARTED");
            reviewDto.setCameraStatus("NOT_INITIALIZED");
            reviewDto.setCameraPermissionGranted(false);
            reviewDto.setIntegrityViolationCount(0);
            reviewDto.setFlaggedForReview(false);
        }

        reviewDto.setQuestions(qResults);
        return reviewDto;
    }

    @Transactional(readOnly = true)
    public AssignmentParticipantReviewDto getParticipantAssignmentReviewForCreator(Long assignmentId, Long userId, User creator) {
        if (creator == null) {
            throw new RuntimeException("Authentication required.");
        }
        Assignment a = assignmentRepo.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found with ID " + assignmentId));

        boolean isCreator = a.getCreator() != null && a.getCreator().getId().equals(creator.getId());
        boolean isAdmin = Role.ADMIN.equals(creator.getRole());
        if (!isCreator && !isAdmin) {
            throw new RuntimeException("Access denied. Only the assignment creator or admin can review candidate attempts.");
        }

        User participant = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("Participant user not found with ID " + userId));

        AssignmentParticipantReviewDto review = getParticipantAssignmentReview(assignmentId, participant);

        // Fetch recordings and integrity events for creator
        Optional<AssignmentAttempt> optAttempt = assignmentAttemptRepo.findByAssignmentIdAndUserId(assignmentId, participant.getId());
        if (optAttempt.isPresent()) {
            AssignmentAttempt att = optAttempt.get();
            List<ExamRecording> recs = examRecordingRepo.findByAttemptId(att.getId());
            List<ExamRecordingDto> recDtos = new ArrayList<>();
            for (ExamRecording r : recs) {
                ExamRecordingDto rDto = new ExamRecordingDto();
                rDto.setId(r.getId());
                rDto.setAttemptId(att.getId());
                rDto.setParticipantId(participant.getId());
                rDto.setParticipantUsername(participant.getUsername());
                rDto.setParticipantName(participant.getName());
                rDto.setAssignmentId(a.getId());
                rDto.setType(r.getType());
                rDto.setStorageReference(r.getStorageReference());
                rDto.setFileSizeBytes(r.getFileSizeBytes());
                rDto.setContentType(r.getContentType());
                rDto.setStartedAt(r.getStartedAt());
                rDto.setEndedAt(r.getEndedAt());
                rDto.setStatus(r.getStatus());
                rDto.setCreatedAt(r.getCreatedAt());
                recDtos.add(rDto);
            }
            review.setRecordings(recDtos);

            IntegrityReportDto integrity = assignmentExamService.getIntegrityReport(att.getId(), creator);
            review.setIntegrityReport(integrity);
        }

        return review;
    }

    private AssignmentDto mapToDto(Assignment a, User currentUser) {
        AssignmentDto dto = new AssignmentDto();
        dto.setId(a.getId());
        dto.setTitle(a.getTitle());
        dto.setDescription(a.getDescription());

        if (a.getCreator() != null) {
            dto.setCreatorId(a.getCreator().getId());
            dto.setCreatorName(a.getCreator().getName());
            dto.setCreatorUsername(a.getCreator().getUsername());
        }

        dto.setStartTime(a.getStartTime());
        dto.setDueDate(a.getDueDate());
        dto.setStatus(a.getStatus());
        dto.setSecureMode(a.getSecureMode());
        dto.setDurationMinutes(a.getDurationMinutes());
        dto.setAllowedAttempts(a.getAllowedAttempts());
        dto.setProblemCount(a.getAssignmentProblems() != null ? a.getAssignmentProblems().size() : 0);
        dto.setAssignedUserCount(a.getAssignedUsers() != null ? a.getAssignedUsers().size() : 0);

        if (assignmentAttemptRepo != null && a.getId() != null) {
            dto.setCompletedAttemptsCount(assignmentAttemptRepo.countCompletedAttemptsByAssignmentId(a.getId()));
            dto.setFlaggedAttemptsCount(assignmentAttemptRepo.countFlaggedAttemptsByAssignmentId(a.getId()));
            Long violations = assignmentAttemptRepo.sumViolationsByAssignmentId(a.getId());
            dto.setViolationCount(violations != null ? violations : 0);
        }

        dto.setCreatedAt(a.getCreatedAt());
        dto.setUpdatedAt(a.getUpdatedAt());

        return dto;
    }

    private void copyDtoFields(AssignmentDto source, AssignmentDetailDto target) {
        target.setId(source.getId());
        target.setTitle(source.getTitle());
        target.setDescription(source.getDescription());
        target.setCreatorId(source.getCreatorId());
        target.setCreatorName(source.getCreatorName());
        target.setCreatorUsername(source.getCreatorUsername());
        target.setStartTime(source.getStartTime());
        target.setDueDate(source.getDueDate());
        target.setStatus(source.getStatus());
        target.setSecureMode(source.getSecureMode());
        target.setDurationMinutes(source.getDurationMinutes());
        target.setAllowedAttempts(source.getAllowedAttempts());
        target.setProblemCount(source.getProblemCount());
        target.setAssignedUserCount(source.getAssignedUserCount());
        target.setCompletedAttemptsCount(source.getCompletedAttemptsCount());
        target.setFlaggedAttemptsCount(source.getFlaggedAttemptsCount());
        target.setViolationCount(source.getViolationCount());
        target.setCreatedAt(source.getCreatedAt());
        target.setUpdatedAt(source.getUpdatedAt());
    }
}

