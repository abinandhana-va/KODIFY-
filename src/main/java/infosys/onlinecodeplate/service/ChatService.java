package infosys.onlinecodeplate.service;

import infosys.onlinecodeplate.dto.AppDtos.*;
import infosys.onlinecodeplate.entity.*;
import infosys.onlinecodeplate.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ChatService {

    private final UserRepository userRepo;
    private final ProblemRepository problemRepo;
    private final UserSubmissionRepository userSubmissionRepo;
    private final AssignmentRepository assignmentRepo;
    private final AssignmentUserRepository assignmentUserRepo;
    private final AssignmentAttemptRepository attemptRepo;
    private final AchievementService achievementService;
    private final CertificateService certificateService;
    private final BadgeService badgeService;
    private final ContestService contestService;
    private final LeaderboardService leaderboardService;

    public ChatService(UserRepository userRepo,
                       ProblemRepository problemRepo,
                       UserSubmissionRepository userSubmissionRepo,
                       AssignmentRepository assignmentRepo,
                       AssignmentUserRepository assignmentUserRepo,
                       AssignmentAttemptRepository attemptRepo,
                       AchievementService achievementService,
                       CertificateService certificateService,
                       BadgeService badgeService,
                       ContestService contestService,
                       LeaderboardService leaderboardService) {
        this.userRepo = userRepo;
        this.problemRepo = problemRepo;
        this.userSubmissionRepo = userSubmissionRepo;
        this.assignmentRepo = assignmentRepo;
        this.assignmentUserRepo = assignmentUserRepo;
        this.attemptRepo = attemptRepo;
        this.achievementService = achievementService;
        this.certificateService = certificateService;
        this.badgeService = badgeService;
        this.contestService = contestService;
        this.leaderboardService = leaderboardService;
    }

    @Transactional(readOnly = true)
    public ChatResponseDto processChat(ChatRequestDto request, User user) {
        String message = request.getMessage() != null ? request.getMessage().trim() : "";
        String lower = message.toLowerCase();
        ChatContextDto context = request.getContext();

        // 1. Strict Server-Side Lockout: Check if user is in an active secure exam
        if (user != null) {
            List<AssignmentAttempt> attempts = attemptRepo.findByUserIdOrderByStartedAtDesc(user.getId());
            for (AssignmentAttempt att : attempts) {
                if ("IN_PROGRESS".equals(att.getStatus())) {
                    LocalDateTime now = LocalDateTime.now();
                    if (att.getExpiresAt() == null || att.getExpiresAt().isAfter(now)) {
                        if (att.getAssignment() != null && Boolean.TRUE.equals(att.getAssignment().getSecureMode())) {
                            return new ChatResponseDto(
                                    "⚠️ Chat assistance is disabled during secure assignments to maintain examination integrity.",
                                    "DISABLED",
                                    true,
                                    Collections.emptyList()
                            );
                        }
                    }
                }
            }
        }

        // 2. Unauthenticated / Public Mode
        if (user == null) {
            return handlePublicChat(lower, message);
        }

        // 3. Authenticated Mode: Problem Page Context (when on /problems/:id)
        if (context != null && context.getProblemId() != null && context.getProblemId() > 0) {
            Optional<Problem> optProb = problemRepo.findById(context.getProblemId());
            if (optProb.isPresent()) {
                if (lower.contains("hint") || lower.contains("clue") || lower.contains("how to start") ||
                    lower.contains("explain this problem") || lower.contains("what is this problem") ||
                    lower.contains("constraint") || lower.contains("complexity") || lower.contains("time complexity") ||
                    lower.contains("why is my code failing") || lower.contains("error") || lower.contains("bug") ||
                    lower.contains("approach this problem") || lower.contains("how should i approach")) {
                    return handleProblemContextChat(lower, message, optProb.get(), context, user);
                }
            }
        }

        // 4. Authenticated Mode: Personalized Context & Free-form Queries
        return handlePersonalizedChat(lower, message, user);
    }

    private ChatResponseDto handlePublicChat(String lower, String rawMessage) {
        // Questions requiring authentication / personal progress
        if (lower.contains("how many problem") || lower.contains("my progress") || lower.contains("my solved") ||
            lower.contains("my assignment") || lower.contains("my certificate") || lower.contains("my badge") ||
            lower.contains("my submission") || lower.contains("my rank") || lower.contains("my score") ||
            lower.contains("am i enrolled")) {
            return new ChatResponseDto(
                    "👋 **Hello!** To view your personal problem stats, active assignments, certificates, and leaderboard rank, please **log in** or create an account.",
                    "PUBLIC",
                    false,
                    List.of("What is KODIFY?", "How does the coding sandbox work?", "Supported programming languages", "How do certificates work?")
            );
        }

        // General DSA / Algorithmic Concept Questions (works in public mode too!)
        ChatResponseDto dsaAnswer = tryAnswerDSAConcepts(lower, false);
        if (dsaAnswer != null) {
            return dsaAnswer;
        }

        // General coding improvement advice
        ChatResponseDto adviceAnswer = tryAnswerCodingAdvice(lower, false);
        if (adviceAnswer != null) {
            return adviceAnswer;
        }

        // Platform Knowledge
        if (lower.contains("what is kodify") || lower.contains("about kodify") || lower.contains("tell me about kodify")) {
            return new ChatResponseDto(
                    "🌟 **KODIFY (கோடிஃபை)** is a modern, culturally rooted algorithmic coding and assessment platform designed for engineers, students, and educators.\n\n" +
                    "**Core Features**:\n" +
                    "• **Real-time Docker Sandbox**: Safe, sandboxed compilation and execution for Python 3, Java 17, and GCC C.\n" +
                    "• **Curated Problem Catalog**: Multi-level challenges (Easy, Medium, Hard) covering Arrays, Trees, DP, Graphs, and Math.\n" +
                    "• **Secure Exam Mode**: Strict full-screen proctoring with blur, tab-switch, and clipboard violation monitoring.\n" +
                    "• **Community Contests**: Timed competitions with live scoring, penalty rules, and leaderboards.\n" +
                    "• **Verifiable Certifications & Badges**: Milestone-based tamper-proof PDF certificates and gamified achievement stickers.",
                    "PUBLIC",
                    false,
                    List.of("How does the coding sandbox work?", "Supported programming languages", "What are assignments?", "How do certificates work?")
            );
        }

        if (lower.contains("sandbox") || lower.contains("docker") || lower.contains("run code") || lower.contains("execute") || lower.contains("how does the coding sandbox work")) {
            return new ChatResponseDto(
                    "⚡ **KODIFY Docker Sandbox Engine**:\n\n" +
                    "Every code run or submission is executed inside an isolated, non-root Docker container with strict resource limits (512MB RAM, CPU throttle, 2.0s execution timeout). " +
                    "This provides a secure, sandboxed environment identical to industry competitive coding platforms.\n\n" +
                    "Supported runtimes: **Python 3.10+**, **OpenJDK 17**, and **C (GCC 11+)**.",
                    "PUBLIC",
                    false,
                    List.of("What is KODIFY?", "Supported programming languages", "What are assignments?")
            );
        }

        if (lower.contains("language") || lower.contains("python") || lower.contains("java") || (lower.contains("c ") || lower.endsWith(" c"))) {
            return new ChatResponseDto(
                    "💻 **Supported Languages on KODIFY**:\n\n" +
                    "1. **Python 3**: Standard Python runtime with fast syntax and built-in standard library.\n" +
                    "2. **Java 17**: OpenJDK 17 with standard `public class Solution` structure.\n" +
                    "3. **C (GCC)**: High-performance GCC 11+ compilation with full standard libraries (`stdio.h`, `stdlib.h`, `string.h`).\n\n" +
                    "You can switch languages seamlessly in the Monaco editor while preserving individual language code drafts.",
                    "PUBLIC",
                    false,
                    List.of("What is KODIFY?", "How does the coding sandbox work?", "What are assignments?")
            );
        }

        if (lower.contains("assignment") || lower.contains("exam") || lower.contains("secure")) {
            return new ChatResponseDto(
                    "📋 **Assignments & Secure Proctored Exam Mode**:\n\n" +
                    "• **Assignments**: Instructors and admins can create curated problem sets, assign specific students, and set deadlines.\n" +
                    "• **Secure Exam Mode**: When enabled, participants enter a locked full-screen environment. Tab switches, window blurs, and copy-paste operations are logged in real-time.\n" +
                    "• **Server-Authoritative Timer**: Ensures exam time expires accurately regardless of browser state.",
                    "PUBLIC",
                    false,
                    List.of("What is KODIFY?", "How do certificates work?", "How do contests work?")
            );
        }

        if (lower.contains("certificate") || lower.contains("badge")) {
            return new ChatResponseDto(
                    "🏆 **Certificates & Badges on KODIFY**:\n\n" +
                    "• **Certificates**: Unlocked automatically upon reaching milestone solved counts (e.g. 5, 10, 25 solved problems). Downloadable as official PDF documents with unique verification codes.\n" +
                    "• **Badges**: Gamified badges awarded for contest participation, milestone speed, and solved streaks.",
                    "PUBLIC",
                    false,
                    List.of("What is KODIFY?", "How do contests work?", "What are assignments?")
            );
        }

        if (lower.contains("contest") || lower.contains("leaderboard")) {
            return new ChatResponseDto(
                    "🏅 **Contests & Global Leaderboards**:\n\n" +
                    "Participate in timed contests, solve challenges under penalty time scoring, maintain your **Contest Streak**, and climb the global KODIFY rankings!",
                    "PUBLIC",
                    false,
                    List.of("What is KODIFY?", "Supported programming languages", "How do certificates work?")
            );
        }

        return new ChatResponseDto(
                "👋 **Welcome to KODIFY!** I am your cultural coding companion. I can help explain platform features, programming concepts (Arrays, Trees, Binary Search, DP), and coding best practices.\n\n" +
                "Feel free to ask any question!",
                "PUBLIC",
                false,
                List.of("What is KODIFY?", "Explain arrays", "Explain binary search", "How can I improve my coding?")
        );
    }

    private ChatResponseDto handlePersonalizedChat(String lower, String rawMessage, User user) {
        long solvedTotal = achievementService.countUniqueSolvedProblems(user.getId());
        long solvedEasy = userSubmissionRepo.countSolvedProblemsByUserIdAndDifficulty(user.getId(), "ACCEPTED", "EASY");
        long solvedMedium = userSubmissionRepo.countSolvedProblemsByUserIdAndDifficulty(user.getId(), "ACCEPTED", "MEDIUM");
        long solvedHard = userSubmissionRepo.countSolvedProblemsByUserIdAndDifficulty(user.getId(), "ACCEPTED", "HARD");
        long totalCatalog = problemRepo.count();

        // 1. Solved Problems & Breakdown
        if (lower.contains("how many problem") || lower.contains("my solved") || lower.contains("problems have i solved") ||
            lower.contains("my progress") || lower.contains("current progress") || (lower.contains("how much") && lower.contains("completed")) ||
            lower.contains("medium problems") || lower.contains("easy problems") || lower.contains("hard problems") ||
            lower.contains("my stats")) {

            if (lower.contains("medium")) {
                return new ChatResponseDto(
                        String.format("🟡 **Medium Problems Solved**: You have solved **%d** medium-difficulty problem(s).", solvedMedium),
                        "PERSONALIZED",
                        false,
                        List.of("Show all my progress", "What should I practice?", "My recent submissions")
                );
            }
            if (lower.contains("easy")) {
                return new ChatResponseDto(
                        String.format("🟢 **Easy Problems Solved**: You have solved **%d** easy-difficulty problem(s).", solvedEasy),
                        "PERSONALIZED",
                        false,
                        List.of("Show all my progress", "What should I practice?", "My assignments")
                );
            }
            if (lower.contains("hard")) {
                return new ChatResponseDto(
                        String.format("🔴 **Hard Problems Solved**: You have solved **%d** hard-difficulty problem(s).", solvedHard),
                        "PERSONALIZED",
                        false,
                        List.of("Show all my progress", "What should I practice?", "My certificates")
                );
            }

            double percent = totalCatalog > 0 ? (solvedTotal * 100.0 / totalCatalog) : 0;
            String breakdown = String.format(
                    "📊 **Your KODIFY Progress (%s)**:\n\n" +
                    "• **Total Solved**: **%d** / %d problems (%.1f%%)\n" +
                    "• 🟢 **Easy**: **%d**\n" +
                    "• 🟡 **Medium**: **%d**\n" +
                    "• 🔴 **Hard**: **%d**\n\n" +
                    "%s",
                    user.getName() != null ? user.getName() : user.getUsername(),
                    solvedTotal, totalCatalog, percent,
                    solvedEasy, solvedMedium, solvedHard,
                    solvedTotal == 0 ? "You haven't solved any problems yet. Head to the **Problems** tab to start your first challenge!" :
                    (solvedTotal >= 10 ? "🔥 Excellent dedication! Keep tackling medium and hard challenges." : "🚀 Great momentum! Continue solving regularly to unlock your next certificate.")
            );
            return new ChatResponseDto(breakdown, "PERSONALIZED", false, List.of("What should I practice?", "My assignments", "My certificates", "My recent submissions"));
        }

        // 2. Enrolled Assignments, Deadlines & Questions remaining
        if (lower.contains("assignment") || lower.contains("deadline") || lower.contains("due") || lower.contains("questions left") || lower.contains("questions remain")) {
            List<AssignmentUser> userAssignments = assignmentUserRepo.findByUserId(user.getId());
            if (userAssignments.isEmpty()) {
                return new ChatResponseDto(
                        "📋 You currently have **no assignments** assigned to your account. You can practice from the open **Problems** catalog or participate in public contests.",
                        "PERSONALIZED",
                        false,
                        List.of("Show my progress", "What should I practice?", "My certificates")
                );
            }

            StringBuilder sb = new StringBuilder("📋 **Your Enrolled Assignments**:\n\n");
            DateTimeFormatter dtf = DateTimeFormatter.ofPattern("MMM dd, yyyy HH:mm");
            for (AssignmentUser au : userAssignments) {
                Assignment a = au.getAssignment();
                if (a == null) continue;
                String dueStr = a.getDueDate() != null ? a.getDueDate().format(dtf) : "No deadline";
                String status = au.getCompletedAt() != null ? "✅ Completed" : "⏳ In Progress";
                int probCount = a.getAssignmentProblems() != null ? a.getAssignmentProblems().size() : 0;
                sb.append(String.format("• **%s** (%d problems) — Status: %s | Due: %s\n", a.getTitle(), probCount, status, dueStr));
            }
            return new ChatResponseDto(sb.toString(), "PERSONALIZED", false, List.of("Show my progress", "My recent submissions", "What should I practice?"));
        }

        // 3. Certificates & Certificate Inquiries ("I solved 5 problems, what certificate can I get?")
        if (lower.contains("certificate") || lower.contains("unlocked cert")) {
            List<CertificateDto> certs = certificateService.getAllCertificatesForUser(user);
            long unlockedCount = certs.stream().filter(CertificateDto::isUnlocked).count();

            StringBuilder sb = new StringBuilder();
            sb.append(String.format("🏆 **Your Certificates**: You have unlocked **%d** of **%d** certificates.\n\n", unlockedCount, certs.size()));
            for (CertificateDto c : certs) {
                if (c.isUnlocked()) {
                    sb.append("• ✅ **").append(c.getName()).append("** (Unlocked) — Verification ID: `").append(c.getCertificateId() != null ? c.getCertificateId() : "AVAILABLE").append("`\n");
                } else {
                    sb.append("• 🔒 **").append(c.getName()).append("** — Progress: ").append(c.getCurrentProgress()).append(" / ").append(c.getTarget()).append(" solved\n");
                }
            }

            if (lower.contains("5 problems") || lower.contains("10 problems") || lower.contains("what certificate can i get")) {
                sb.append("\n💡 *Milestones*: 5 solved problems unlocks **Beginner Coder**, 10 unlocks **Problem Solver**, and 25 unlocks **Coding Champion**!");
            }

            return new ChatResponseDto(sb.toString(), "PERSONALIZED", false, List.of("Show my progress", "My badges", "What should I practice?"));
        }

        // 4. Badges
        if (lower.contains("badge") || lower.contains("stickers")) {
            List<BadgeDto> badges = badgeService.getAllBadgesForUser(user);
            long earnedCount = badges.stream().filter(BadgeDto::isEarned).count();

            StringBuilder sb = new StringBuilder();
            sb.append(String.format("✨ **Your Achievement Badges**: You have earned **%d** badge(s).\n\n", earnedCount));
            for (BadgeDto b : badges) {
                if (b.isEarned()) {
                    sb.append("• 🏅 **").append(b.getName()).append("** — ").append(b.getDescription()).append("\n");
                }
            }
            if (earnedCount == 0) {
                sb.append("Solve problems and participate in contests to earn your first badges!");
            }
            return new ChatResponseDto(sb.toString(), "PERSONALIZED", false, List.of("Show my progress", "My certificates", "What should I practice?"));
        }

        // 5. Recent Submissions & Submission Failure Analysis
        if (lower.contains("recent submission") || lower.contains("my submission") || lower.contains("latest submission") ||
            lower.contains("last submission") || lower.contains("why did my") || lower.contains("why my code failed") || lower.contains("failed submission")) {
            List<UserSubmission> subs = userSubmissionRepo.findByUserIdOrderByCreatedAtDesc(user.getId());
            if (subs.isEmpty()) {
                return new ChatResponseDto(
                        "📝 You have not submitted any solutions yet. Pick a challenge from the **Problems** page to get started!",
                        "PERSONALIZED",
                        false,
                        List.of("What should I practice?", "Show my progress")
                );
            }

            if (lower.contains("why") || lower.contains("failed") || lower.contains("fail")) {
                UserSubmission latestFailed = subs.stream()
                        .filter(s -> !"ACCEPTED".equalsIgnoreCase(s.getStatus()))
                        .findFirst()
                        .orElse(subs.get(0));

                String probTitle = latestFailed.getProblem() != null ? latestFailed.getProblem().getTitle() : "Recent Problem";
                String verdict = latestFailed.getStatus();
                String lang = latestFailed.getLanguage();

                String explanation;
                if ("TIME_LIMIT_EXCEEDED".equalsIgnoreCase(verdict)) {
                    explanation = "Your solution exceeded the 2.0-second time limit. Consider optimizing nested loops from $O(N^2)$ to $O(N)$ or $O(N \\log N)$ using Hash Maps, Two Pointers, or Binary Search.";
                } else if ("WRONG_ANSWER".equalsIgnoreCase(verdict)) {
                    explanation = String.format("Your solution failed test case validation (passed %d/%d test cases). Check edge cases like negative numbers, empty arrays, or integer overflow.",
                            latestFailed.getPassedTestCases() != null ? latestFailed.getPassedTestCases() : 0,
                            latestFailed.getTotalTestCases() != null ? latestFailed.getTotalTestCases() : 0);
                } else if ("RUNTIME_ERROR".equalsIgnoreCase(verdict)) {
                    explanation = "Your program encountered an unhandled exception or non-zero exit code during execution (e.g. `IndexOutOfBoundsException`, `NullPointerException`, or Division by zero).";
                } else if ("COMPILATION_ERROR".equalsIgnoreCase(verdict)) {
                    explanation = "Your code failed compilation. Check for missing semicolons, incorrect method names, or mismatched braces.";
                } else {
                    explanation = "Your latest submission status was: **" + verdict + "**.";
                }

                String resp = String.format(
                        "🔍 **Analysis of Latest Submission on '%s' (%s)**:\n\n" +
                        "• **Status**: `%s`\n" +
                        "• **Diagnostic**: %s\n\n" +
                        "Would you like advice on how to optimize this problem?",
                        probTitle, lang, verdict, explanation
                );
                return new ChatResponseDto(resp, "PERSONALIZED", false, List.of("Give me a hint", "Explain time complexity", "What should I practice?"));
            }

            StringBuilder sb = new StringBuilder("📝 **Your Recent Submissions**:\n\n");
            DateTimeFormatter dtf = DateTimeFormatter.ofPattern("MMM dd, HH:mm");
            for (UserSubmission s : subs.stream().limit(5).collect(Collectors.toList())) {
                String probTitle = s.getProblem() != null ? s.getProblem().getTitle() : "Problem #" + s.getProblem().getId();
                String timeStr = s.getCreatedAt() != null ? s.getCreatedAt().format(dtf) : "";
                String verdictIcon = "ACCEPTED".equalsIgnoreCase(s.getStatus()) ? "✅" : "❌";
                sb.append(String.format("• %s **%s** (%s) — Verdict: **%s** (%s)\n", verdictIcon, probTitle, s.getLanguage(), s.getStatus(), timeStr));
            }
            return new ChatResponseDto(sb.toString(), "PERSONALIZED", false, List.of("Show my progress", "What should I practice?", "My certificates"));
        }

        // 6. Leaderboard Rank
        if (lower.contains("leaderboard") || lower.contains("my rank") || lower.contains("rank")) {
            List<LeaderboardEntryDto> leaderboard = leaderboardService.getLeaderboard("all", "ALL");
            int rank = 0;
            for (int i = 0; i < leaderboard.size(); i++) {
                if (leaderboard.get(i).getUserId().equals(user.getId())) {
                    rank = i + 1;
                    break;
                }
            }
            if (rank > 0) {
                return new ChatResponseDto(
                        String.format("🏆 **Leaderboard Status**: You are currently ranked **#%d** on the global KODIFY leaderboard with **%d** problems solved!", rank, solvedTotal),
                        "PERSONALIZED",
                        false,
                        List.of("Show my progress", "What should I practice?", "My certificates")
                );
            } else {
                return new ChatResponseDto(
                        String.format("🏆 You have solved **%d** problems so far. Solve your next challenge to enter the global leaderboard rankings!", solvedTotal),
                        "PERSONALIZED",
                        false,
                        List.of("What should I practice?", "Show my progress")
                );
            }
        }

        // 7. Practice Recommendations
        if (lower.contains("what should i practice") || lower.contains("recommend") || lower.contains("next problem") || lower.contains("suggest") || lower.contains("practice next")) {
            List<Long> solvedIds = achievementService.getSolvedProblemIds(user.getId());
            Set<Long> solvedSet = new HashSet<>(solvedIds);

            List<Problem> allProbs = problemRepo.findAll();
            List<Problem> unsolved = allProbs.stream().filter(p -> !solvedSet.contains(p.getId())).collect(Collectors.toList());

            if (unsolved.isEmpty()) {
                return new ChatResponseDto(
                        "🎉 **Incredible milestone!** You have solved every challenge in the problem catalog! Look out for upcoming community contests.",
                        "PERSONALIZED",
                        false,
                        List.of("Show my progress", "My certificates")
                );
            }

            String targetDiff = solvedTotal < 3 ? "EASY" : (solvedTotal < 10 ? "MEDIUM" : "HARD");
            List<Problem> suggestions = unsolved.stream()
                    .filter(p -> targetDiff.equalsIgnoreCase(p.getDifficulty()))
                    .limit(3)
                    .collect(Collectors.toList());

            if (suggestions.isEmpty()) {
                suggestions = unsolved.stream().limit(3).collect(Collectors.toList());
            }

            StringBuilder sb = new StringBuilder("💡 **Recommended Next Challenges for You**:\n\n");
            for (Problem p : suggestions) {
                sb.append(String.format("• **#%d. %s** [%s] — Topic: %s\n", p.getId(), p.getTitle(), p.getDifficulty(), p.getConcept() != null ? p.getConcept() : "Algorithms"));
            }
            sb.append("\nPick any problem to continue building your algorithm streak!");
            return new ChatResponseDto(sb.toString(), "PERSONALIZED", false, List.of("Show my progress", "My assignments", "My recent submissions"));
        }

        // 8. DSA / Concept Explanations
        ChatResponseDto dsaAnswer = tryAnswerDSAConcepts(lower, true);
        if (dsaAnswer != null) {
            return dsaAnswer;
        }

        // 9. Coding advice
        ChatResponseDto adviceAnswer = tryAnswerCodingAdvice(lower, true);
        if (adviceAnswer != null) {
            return adviceAnswer;
        }

        // Default friendly personalized response
        return new ChatResponseDto(
                String.format("👋 Hi **%s**! I am your KODIFY coding companion. I have full context on your problem solving progress (%d solved), assignments, certificates, and badges.\n\nWhat would you like to explore?",
                        user.getName() != null ? user.getName() : user.getUsername(), solvedTotal),
                "PERSONALIZED",
                false,
                List.of("Show my progress", "What should I practice?", "My assignments", "My certificates")
        );
    }

    private ChatResponseDto handleProblemContextChat(String lower, String rawMessage, Problem problem, ChatContextDto context, User user) {
        if (lower.contains("explain") || lower.contains("what is this problem") || lower.contains("understand") || lower.contains("approach")) {
            String desc = problem.getDescription() != null ? problem.getDescription() : "No detailed description available.";
            if (desc.length() > 300) desc = desc.substring(0, 300) + "...";

            String response = String.format(
                    "📖 **Problem Overview: #%d. %s** [%s]\n\n" +
                    "**Topics**: %s\n\n" +
                    "**Summary**: %s\n\n" +
                    "**Strategy Tip**: Read the input bounds carefully. For $N \\le 10^5$, aim for an $O(N)$ or $O(N \\log N)$ solution.",
                    problem.getId(), problem.getTitle(), problem.getDifficulty(),
                    problem.getConcept() != null ? problem.getConcept() : "Algorithms",
                    desc
            );
            return new ChatResponseDto(response, "PERSONALIZED", false, List.of("Give me a hint", "Explain the constraints", "What is the expected complexity?"));
        }

        if (lower.contains("hint") || lower.contains("clue") || lower.contains("how to start")) {
            String hintsText = "1. Think about which data structure allows fastest lookup (e.g. Hash Table $O(1)$).\n2. If the data is sorted or can be sorted, consider Two Pointers or Binary Search.\n3. Always handle edge cases like empty inputs or single-element inputs.";
            if (problem.getHintsList() != null && !problem.getHintsList().isEmpty()) {
                hintsText = "• " + problem.getHintsList().get(0).getContent();
            }
            return new ChatResponseDto(
                    "💡 **Conceptual Hint for #" + problem.getId() + " (" + problem.getTitle() + ")**:\n\n" + hintsText + "\n\nTry writing your logic in the editor and click **Run Code** to test sample cases!",
                    "PERSONALIZED",
                    false,
                    List.of("Explain the constraints", "What is the expected complexity?", "Show my progress")
            );
        }

        if (lower.contains("constraint") || lower.contains("complexity") || lower.contains("time complexity")) {
            String constraints = problem.getConstraints() != null && !problem.getConstraints().trim().isEmpty()
                    ? problem.getConstraints()
                    : "Standard constraints: $N \\le 10^5$, 2.0s sandbox timeout.";

            return new ChatResponseDto(
                    "⏱️ **Constraints & Complexity Breakdown for #" + problem.getId() + "**:\n\n" +
                    "• **Given Constraints**: `" + constraints + "`\n" +
                    "• **Optimal Time Complexity**: $O(N)$ or $O(N \\log N)$ to complete within the 2-second Docker timeout.\n" +
                    "• **Space Complexity**: $O(1)$ auxiliary or $O(N)$ memory for hash lookups.\n\n" +
                    "Avoid nested loops ($O(N^2)$) when $N > 10^4$ as they will trigger `TIME_LIMIT_EXCEEDED`.",
                    "PERSONALIZED",
                    false,
                    List.of("Give me a hint", "Explain this problem", "What should I practice?")
            );
        }

        if (lower.contains("error") || lower.contains("compile") || lower.contains("bug") || lower.contains("fail") || lower.contains("why is my code failing")) {
            String lastErr = context.getLastError() != null ? context.getLastError() : "";
            return new ChatResponseDto(
                    "🔍 **Debugging Checklist**:\n\n" +
                    (lastErr.isEmpty() ? "1. Check for array index out of bounds or off-by-one errors.\n2. Ensure all return paths return a valid value.\n3. Verify data types (e.g. 64-bit integer overflow)." : "Reported Error: `" + lastErr + "`.\nCheck variable declaration and bounds before accessing indices.") +
                    "\n\nClick **Run Code** to test against the provided sample inputs.",
                    "PERSONALIZED",
                    false,
                    List.of("Give me a hint", "Explain the constraints", "What is the expected complexity?")
            );
        }

        return new ChatResponseDto(
                "💬 I am assisting you on **#" + problem.getId() + ". " + problem.getTitle() + "** (" + problem.getDifficulty() + "). Ask me for hints, problem breakdown, or complexity analysis!",
                "PERSONALIZED",
                false,
                List.of("Explain this problem", "Give me a hint", "Explain the constraints", "What is the expected complexity?")
        );
    }

    private ChatResponseDto tryAnswerDSAConcepts(String lower, boolean authenticated) {
        String mode = authenticated ? "PERSONALIZED" : "PUBLIC";
        List<String> suggestions = authenticated
                ? List.of("Show my progress", "What should I practice?", "My assignments")
                : List.of("What is KODIFY?", "How does the coding sandbox work?", "Supported programming languages");

        // Binary search & O(log n)
        if (lower.contains("binary search") || lower.contains("o(log n)") || lower.contains("log n")) {
            if (lower.contains("why") || lower.contains("o(log n)") || lower.contains("complexity") || lower.contains("logarithmic")) {
                return new ChatResponseDto(
                        "🔍 **Why Binary Search is $O(\\log N)$**:\n\n" +
                        "1. At each iteration, the search interval is **halved**: $N \\to N/2 \\to N/4 \\to \\dots \\to 1$.\n" +
                        "2. If we start with $N$ elements, after $k$ steps we have $N / 2^k = 1$ elements left.\n" +
                        "3. Solving for $k$: $2^k = N \\implies k = \\log_2 N$.\n\n" +
                        "Thus, for $N = 1,000,000$, binary search takes at most **20 comparisons** compared to 1,000,000 in linear search!",
                        mode, false, suggestions
                );
            }
            return new ChatResponseDto(
                    "🔍 **Binary Search Algorithm**:\n\n" +
                    "An efficient search algorithm that works on sorted collections by repeatedly dividing the search space in half.\n\n" +
                    "```python\ndef binary_search(arr, target):\n    left, right = 0, len(arr) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return -1\n```\n\n" +
                    "• **Time Complexity**: $O(\\log N)$\n• **Space Complexity**: $O(1)$",
                    mode, false, suggestions
            );
        }

        // Arrays & Strings
        if (lower.contains("explain array") || lower.contains("what is an array") || lower.contains("what are arrays") || lower.contains("arrays")) {
            return new ChatResponseDto(
                    "📦 **Arrays & Slices**:\n\n" +
                    "An array is a contiguous block of memory storing elements of the same type.\n\n" +
                    "**Key Characteristics**:\n" +
                    "• **Fast Access**: Direct indexing in $O(1)$ time (`arr[i]`).\n" +
                    "• **Insertion/Deletion**: $O(N)$ time if shifting elements is needed.\n" +
                    "• **Common Patterns**: Two Pointers, Sliding Window, Prefix Sums, Kadane's Algorithm for max subarray.",
                    mode, false, suggestions
            );
        }

        if (lower.contains("explain string") || lower.contains("what is a string") || lower.contains("strings")) {
            return new ChatResponseDto(
                    "🔤 **Strings in Algorithms**:\n\n" +
                    "Strings are sequences of characters. In languages like Python and Java, strings are immutable.\n\n" +
                    "**Key Patterns**:\n" +
                    "• **Two Pointers**: Useful for palindrome checks and reversing.\n" +
                    "• **Frequency Counting**: Using Hash Maps or an array of size 26 for anagram verification.\n" +
                    "• **Sliding Window**: Ideal for finding longest substring without repeating characters.",
                    mode, false, suggestions
            );
        }

        // Hash Maps / Dictionaries
        if (lower.contains("hash map") || lower.contains("hashmap") || lower.contains("hash table") || lower.contains("dictionary")) {
            return new ChatResponseDto(
                    "🗝️ **Hash Maps (Hash Tables / Dictionaries)**:\n\n" +
                    "Data structures mapping keys to values using a hashing function.\n\n" +
                    "• **Average Lookup/Insert/Delete**: $O(1)$\n" +
                    "• **Worst-case**: $O(N)$ (hash collisions)\n" +
                    "• **Classic Application**: Two Sum problem (trading $O(N)$ space to reduce time from $O(N^2)$ to $O(N)$).",
                    mode, false, suggestions
            );
        }

        // Linked Lists
        if (lower.contains("linked list") || lower.contains("linkedlist")) {
            return new ChatResponseDto(
                    "🔗 **Linked Lists**:\n\n" +
                    "A linear collection of data nodes where each node points to the next via reference/pointer.\n\n" +
                    "• **Insertion/Deletion at head**: $O(1)$\n" +
                    "• **Access by index**: $O(N)$\n" +
                    "• **Essential Techniques**: Fast & Slow Pointers (Floyd's Cycle Detection), Dummy Head Node for edge cases.",
                    mode, false, suggestions
            );
        }

        // Trees & Graphs
        if (lower.contains("tree") || lower.contains("binary tree") || lower.contains("bst")) {
            return new ChatResponseDto(
                    "🌳 **Trees & Binary Search Trees (BST)**:\n\n" +
                    "Hierarchical non-linear data structures consisting of nodes connected by edges without cycles.\n\n" +
                    "• **Traversals**: In-order, Pre-order, Post-order (DFS), and Level-order (BFS).\n" +
                    "• **BST Property**: Left subtree values $<$ Root value $<$ Right subtree values.\n" +
                    "• **Balanced BST Operations**: Search, Insert, Delete in $O(\\log N)$.",
                    mode, false, suggestions
            );
        }

        if (lower.contains("graph") || lower.contains("dfs") || lower.contains("bfs") || lower.contains("dijkstra")) {
            return new ChatResponseDto(
                    "🕸️ **Graphs & Graph Algorithms**:\n\n" +
                    "A network of vertices ($V$) connected by edges ($E$), either directed or undirected, weighted or unweighted.\n\n" +
                    "• **Breadth-First Search (BFS)**: Uses a Queue; finds shortest path in unweighted graphs in $O(V + E)$.\n" +
                    "• **Depth-First Search (DFS)**: Uses Recursion/Stack; ideal for topological sort, connected components, and cycle detection.",
                    mode, false, suggestions
            );
        }

        // Dynamic Programming & Recursion
        if (lower.contains("dynamic programming") || lower.contains(" dp ") || lower.endsWith(" dp") || lower.contains("memoization")) {
            return new ChatResponseDto(
                    "💡 **Dynamic Programming (DP)**:\n\n" +
                    "An algorithmic technique that solves complex problems by breaking them down into simpler, overlapping subproblems.\n\n" +
                    "**3 Steps to Solve DP**:\n" +
                    "1. **Define State**: What does `dp[i]` represent?\n" +
                    "2. **State Transition**: How does `dp[i]` relate to `dp[i-1]`, `dp[i-2]`?\n" +
                    "3. **Base Cases**: Initialize starting conditions (e.g. `dp[0] = 1`).",
                    mode, false, suggestions
            );
        }

        if (lower.contains("two pointer") || lower.contains("sliding window")) {
            return new ChatResponseDto(
                    "👉👈 **Two Pointers & Sliding Window**:\n\n" +
                    "• **Two Pointers**: Uses two indices (e.g. `left` and `right`) moving towards each other or in parallel to process arrays in $O(N)$ time.\n" +
                    "• **Sliding Window**: Maintains a dynamic window `[start, end]` to find optimal contiguous subarrays without recomputing overlapping elements.",
                    mode, false, suggestions
            );
        }

        // Time Complexity / Big O
        if (lower.contains("time complexity") || lower.contains("big o") || lower.contains("space complexity")) {
            return new ChatResponseDto(
                    "⏱️ **Big-O Notation & Complexity Guide**:\n\n" +
                    "• $O(1)$: Constant time (array index access, hash map lookup)\n" +
                    "• $O(\\log N)$: Logarithmic time (binary search, balanced BST)\n" +
                    "• $O(N)$: Linear time (single loop iteration over array)\n" +
                    "• $O(N \\log N)$: Linearithmic time (Merge Sort, Quick Sort, heap operations)\n" +
                    "• $O(N^2)$: Quadratic time (nested loops, Bubble Sort)\n" +
                    "• $O(2^N)$: Exponential time (naive recursive subsets/combinations)",
                    mode, false, suggestions
            );
        }

        return null;
    }

    private ChatResponseDto tryAnswerCodingAdvice(String lower, boolean authenticated) {
        String mode = authenticated ? "PERSONALIZED" : "PUBLIC";
        List<String> suggestions = authenticated
                ? List.of("What should I practice?", "Show my progress", "My assignments")
                : List.of("What is KODIFY?", "How does the coding sandbox work?", "Supported programming languages");

        if (lower.contains("improve my coding") || lower.contains("get better at coding") || lower.contains("how to practice") ||
            lower.contains("interview preparation") || lower.contains("prepare for interview") || lower.contains("coding tips")) {
            return new ChatResponseDto(
                    "🚀 **How to Improve Your Algorithmic Coding on KODIFY**:\n\n" +
                    "1. **Master Core Patterns**: Don't memorize solutions; understand patterns like Two Pointers, Sliding Window, DFS/BFS, and Hash Map lookups.\n" +
                    "2. **Analyze Constraints First**: Look at input bounds ($N$) before coding to determine target complexity ($O(N)$ vs $O(N \\log N)$).\n" +
                    "3. **Write Clean, Modular Code**: Choose descriptive variable names and handle edge cases (empty lists, negative numbers) upfront.\n" +
                    "4. **Consistency Over Cramming**: Solve 1–2 challenges daily to build your problem-solving intuition.",
                    mode, false, suggestions
            );
        }
        return null;
    }
}
