package infosys.onlinecodeplate.controller;

import infosys.onlinecodeplate.dto.AppDtos.*;
import infosys.onlinecodeplate.entity.User;
import infosys.onlinecodeplate.repository.UserRepository;
import infosys.onlinecodeplate.service.ContestService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/contests")
public class ContestController {

    private final ContestService contestService;
    private final UserRepository userRepository;

    public ContestController(ContestService contestService, UserRepository userRepository) {
        this.contestService = contestService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<List<ContestDto>> getAllContests(
            @RequestParam(required = false, defaultValue = "ALL") String filter,
            @RequestParam(required = false) String search,
            Authentication auth) {
        User user = (auth != null) ? userRepository.findByEmailOrUsername(auth.getName(), auth.getName()).orElse(null) : null;
        return ResponseEntity.ok(contestService.getAllContests(user, filter, search));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ContestDetailDto> getContestDetail(@PathVariable Long id, Authentication auth) {
        User user = (auth != null) ? userRepository.findByEmailOrUsername(auth.getName(), auth.getName()).orElse(null) : null;
        return ResponseEntity.ok(contestService.getContestDetail(id, user));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> createContest(@Valid @RequestBody ContestRequestDto req, Authentication auth) {
        try {
            User user = userRepository.findByEmailOrUsername(auth.getName(), auth.getName()).orElseThrow();
            return ResponseEntity.ok(contestService.createContest(req, user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> updateContest(@PathVariable Long id, @Valid @RequestBody ContestRequestDto req, Authentication auth) {
        try {
            User user = userRepository.findByEmailOrUsername(auth.getName(), auth.getName()).orElseThrow();
            return ResponseEntity.ok(contestService.updateContest(id, req, user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/register")
    public ResponseEntity<?> registerForContest(@PathVariable Long id, Authentication auth) {
        try {
            User user = userRepository.findByEmailOrUsername(auth.getName(), auth.getName()).orElseThrow();
            contestService.registerForContest(id, user);
            return ResponseEntity.ok(Map.of("message", "Successfully registered for contest!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{id}/registration-status")
    public ResponseEntity<?> getRegistrationStatus(@PathVariable Long id, Authentication auth) {
        try {
            User user = (auth != null) ? userRepository.findByEmailOrUsername(auth.getName(), auth.getName()).orElse(null) : null;
            return ResponseEntity.ok(contestService.getRegistrationStatus(id, user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/confirm-rules")
    public ResponseEntity<?> confirmRules(@PathVariable Long id, Authentication auth) {
        try {
            User user = userRepository.findByEmailOrUsername(auth.getName(), auth.getName()).orElseThrow();
            contestService.confirmContestRules(id, user);
            return ResponseEntity.ok(Map.of("message", "Contest rules confirmed successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/security/check")
    public ResponseEntity<?> submitSecurityCheck(
            @PathVariable Long id,
            @RequestBody(required = false) ContestSecurityCheckDto checkDto,
            Authentication auth) {
        try {
            User user = userRepository.findByEmailOrUsername(auth.getName(), auth.getName()).orElseThrow();
            return ResponseEntity.ok(contestService.submitContestSecurityCheck(id, checkDto, user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/security/event")
    public ResponseEntity<?> recordSecurityEvent(
            @PathVariable Long id,
            @RequestBody(required = false) ContestSecurityEventDto eventDto,
            @RequestParam(value = "eventType", required = false) String paramEventType,
            Authentication auth) {
        try {
            User user = userRepository.findByEmailOrUsername(auth.getName(), auth.getName()).orElseThrow();
            String eventType = (eventDto != null && eventDto.getEventType() != null && !eventDto.getEventType().isBlank())
                    ? eventDto.getEventType()
                    : paramEventType;
            String details = eventDto != null ? eventDto.getDetails() : "";
            return ResponseEntity.ok(contestService.recordContestSecurityEvent(id, eventType, details, user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/problems/{problemId}/run")
    public ResponseEntity<?> runSampleSolution(
            @PathVariable Long id,
            @PathVariable Long problemId,
            @Valid @RequestBody SubmissionRequestDto req,
            Authentication auth) {
        try {
            User user = userRepository.findByEmailOrUsername(auth.getName(), auth.getName()).orElseThrow();
            return ResponseEntity.ok(contestService.runContestSampleCode(id, problemId, req, user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/problems/{problemId}/submit")
    public ResponseEntity<?> submitSolution(
            @PathVariable Long id,
            @PathVariable Long problemId,
            @Valid @RequestBody SubmissionRequestDto req,
            Authentication auth) {
        try {
            User user = userRepository.findByEmailOrUsername(auth.getName(), auth.getName()).orElseThrow();
            return ResponseEntity.ok(contestService.submitContestSolution(id, problemId, req, user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/enter-arena")
    public ResponseEntity<?> enterArena(@PathVariable Long id, Authentication auth) {
        try {
            User user = userRepository.findByEmailOrUsername(auth.getName(), auth.getName()).orElseThrow();
            return ResponseEntity.ok(contestService.enterArena(id, user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{id}/result")
    public ResponseEntity<?> getContestResult(@PathVariable Long id, Authentication auth) {
        try {
            User user = (auth != null) ? userRepository.findByEmailOrUsername(auth.getName(), auth.getName()).orElse(null) : null;
            return ResponseEntity.ok(contestService.getContestResult(id, user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{id}/leaderboard")
    public ResponseEntity<List<ContestLeaderboardEntryDto>> getContestLeaderboard(@PathVariable Long id) {
        return ResponseEntity.ok(contestService.getContestLeaderboard(id));
    }
}
