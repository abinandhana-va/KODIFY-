package infosys.onlinecodeplate.controller;

import infosys.onlinecodeplate.dto.AppDtos.LeaderboardEntryDto;
import infosys.onlinecodeplate.service.LeaderboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/leaderboard")
public class LeaderboardController {

    private final LeaderboardService leaderboardService;

    public LeaderboardController(LeaderboardService leaderboardService) {
        this.leaderboardService = leaderboardService;
    }

    @GetMapping
    public ResponseEntity<List<LeaderboardEntryDto>> getLeaderboard(
            @RequestParam(value = "type", defaultValue = "global") String type,
            @RequestParam(value = "language", required = false) String language) {
        return ResponseEntity.ok(leaderboardService.getLeaderboard(type, language));
    }

    @GetMapping("/global")
    public ResponseEntity<List<LeaderboardEntryDto>> getGlobalLeaderboard(
            @RequestParam(value = "language", required = false) String language) {
        return ResponseEntity.ok(leaderboardService.getLeaderboard("global", language));
    }

    @GetMapping("/weekly")
    public ResponseEntity<List<LeaderboardEntryDto>> getWeeklyLeaderboard(
            @RequestParam(value = "language", required = false) String language) {
        return ResponseEntity.ok(leaderboardService.getLeaderboard("weekly", language));
    }
}
