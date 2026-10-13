package infosys.onlinecodeplate.controller;

import infosys.onlinecodeplate.dto.AppDtos.UserActivityDto;
import infosys.onlinecodeplate.entity.User;
import infosys.onlinecodeplate.entity.UserActivity;
import infosys.onlinecodeplate.repository.UserActivityRepository;
import infosys.onlinecodeplate.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/activity")
public class ActivityController {
    private final UserActivityRepository activityRepo;
    private final UserRepository userRepository;

    public ActivityController(UserActivityRepository activityRepo, UserRepository userRepository) {
        this.activityRepo = activityRepo;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<List<UserActivityDto>> getMyActivity(Authentication auth) {
        User user = userRepository.findByEmailOrUsername(auth.getName(), auth.getName()).orElseThrow();
        List<UserActivity> acts = activityRepo.findByUserIdOrderByCreatedAtDesc(user.getId());
        
        List<UserActivityDto> filtered = acts.stream()
                .filter(a -> a.getAction() != null && !a.getAction().equalsIgnoreCase("Viewed Problem"))
                .map(a -> {
                    UserActivityDto d = new UserActivityDto();
                    d.setId(a.getId());
                    d.setAction(a.getAction());
                    d.setDescription(a.getDescription());
                    d.setCreatedAt(a.getCreatedAt());
                    return d;
                }).collect(Collectors.toList());

        return ResponseEntity.ok(filtered);
    }
}
