package infosys.onlinecodeplate.controller;

import infosys.onlinecodeplate.dto.AppDtos.AdminContestParticipantDto;
import infosys.onlinecodeplate.dto.AppDtos.ContestDto;
import infosys.onlinecodeplate.dto.AppDtos.ContestRequestDto;
import infosys.onlinecodeplate.entity.User;
import infosys.onlinecodeplate.repository.UserRepository;
import infosys.onlinecodeplate.service.ContestService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/contests")
public class AdminContestController {

    private final ContestService contestService;
    private final UserRepository userRepository;

    public AdminContestController(ContestService contestService, UserRepository userRepository) {
        this.contestService = contestService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<List<ContestDto>> getAllContests() {
        return ResponseEntity.ok(contestService.getAllContestsForAdmin());
    }

    @PostMapping
    public ResponseEntity<?> createContest(@Valid @RequestBody ContestRequestDto req, Authentication auth) {
        try {
            User admin = userRepository.findByEmailOrUsername(auth.getName(), auth.getName()).orElseThrow();
            return ResponseEntity.ok(contestService.createContest(req, admin));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateContest(@PathVariable Long id, @Valid @RequestBody ContestRequestDto req, Authentication auth) {
        try {
            User admin = userRepository.findByEmailOrUsername(auth.getName(), auth.getName()).orElseThrow();
            return ResponseEntity.ok(contestService.updateContest(id, req, admin));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteContest(@PathVariable Long id) {
        try {
            contestService.deleteContest(id);
            return ResponseEntity.ok(Map.of("message", "Contest deleted successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{id}/participants")
    public ResponseEntity<List<AdminContestParticipantDto>> getParticipants(@PathVariable Long id) {
        return ResponseEntity.ok(contestService.getParticipantsForContest(id));
    }

    @PostMapping("/{id}/participants")
    public ResponseEntity<?> addParticipant(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            Long userId = null;
            if (body.get("userId") != null) {
                userId = Long.valueOf(body.get("userId").toString());
            } else if (body.get("username") != null) {
                String uname = body.get("username").toString();
                User u = userRepository.findByEmailOrUsername(uname, uname)
                        .orElseThrow(() -> new RuntimeException("User not found: " + uname));
                userId = u.getId();
            } else {
                throw new RuntimeException("userId or username is required.");
            }
            contestService.addParticipant(id, userId);
            return ResponseEntity.ok(Map.of("message", "Participant added successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}/participants/{userId}")
    public ResponseEntity<?> removeParticipant(@PathVariable Long id, @PathVariable Long userId) {
        try {
            contestService.removeParticipant(id, userId);
            return ResponseEntity.ok(Map.of("message", "Participant removed successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
