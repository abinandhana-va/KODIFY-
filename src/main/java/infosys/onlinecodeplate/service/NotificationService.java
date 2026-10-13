package infosys.onlinecodeplate.service;

import infosys.onlinecodeplate.dto.AppDtos.UserNotificationDto;
import infosys.onlinecodeplate.entity.User;
import infosys.onlinecodeplate.entity.UserNotification;
import infosys.onlinecodeplate.repository.UserNotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    private final UserNotificationRepository notificationRepo;

    public NotificationService(UserNotificationRepository notificationRepo) {
        this.notificationRepo = notificationRepo;
    }

    @Transactional
    public UserNotification createNotification(User user, String title, String message, String type, String link) {
        if (user == null) return null;
        UserNotification notification = new UserNotification(user, title, message, type, link);
        return notificationRepo.save(notification);
    }

    @Transactional(readOnly = true)
    public List<UserNotificationDto> getUserNotifications(User user) {
        if (user == null) return List.of();
        return notificationRepo.findTop20ByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(User user) {
        if (user == null) return 0;
        return notificationRepo.countByUserIdAndIsReadFalse(user.getId());
    }

    @Transactional
    public void markAsRead(Long notificationId, User user) {
        if (user == null || notificationId == null) return;
        notificationRepo.findById(notificationId).ifPresent(n -> {
            if (n.getUser() != null && n.getUser().getId().equals(user.getId())) {
                n.setIsRead(true);
                notificationRepo.save(n);
            }
        });
    }

    @Transactional
    public void markAllAsRead(User user) {
        if (user == null) return;
        List<UserNotification> list = notificationRepo.findByUserIdOrderByCreatedAtDesc(user.getId());
        for (UserNotification n : list) {
            if (!Boolean.TRUE.equals(n.getIsRead())) {
                n.setIsRead(true);
            }
        }
        notificationRepo.saveAll(list);
    }

    private UserNotificationDto mapToDto(UserNotification n) {
        UserNotificationDto dto = new UserNotificationDto();
        dto.setId(n.getId());
        dto.setTitle(n.getTitle());
        dto.setMessage(n.getMessage());
        dto.setType(n.getType());
        dto.setLink(n.getLink());
        dto.setIsRead(n.getIsRead());
        dto.setCreatedAt(n.getCreatedAt());
        return dto;
    }
}
