package infosys.onlinecodeplate.service;
import infosys.onlinecodeplate.entity.UserActivity;
import infosys.onlinecodeplate.entity.User;
import infosys.onlinecodeplate.repository.UserActivityRepository;
import org.springframework.stereotype.Service;

@Service
public class ActivityService {
    private final UserActivityRepository activityRepo;
    public ActivityService(UserActivityRepository activityRepo) { this.activityRepo = activityRepo; }
    
    public void logActivity(User user, String action, String description) {
        UserActivity activity = new UserActivity();
        activity.setUser(user);
        activity.setAction(action);
        activity.setDescription(description);
        activityRepo.save(activity);
    }
}
