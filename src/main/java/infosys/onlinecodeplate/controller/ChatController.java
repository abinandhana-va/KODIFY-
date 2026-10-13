package infosys.onlinecodeplate.controller;

import infosys.onlinecodeplate.dto.AppDtos.ChatRequestDto;
import infosys.onlinecodeplate.dto.AppDtos.ChatResponseDto;
import infosys.onlinecodeplate.entity.User;
import infosys.onlinecodeplate.repository.UserRepository;
import infosys.onlinecodeplate.service.ChatService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;
    private final UserRepository userRepository;

    public ChatController(ChatService chatService, UserRepository userRepository) {
        this.chatService = chatService;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<ChatResponseDto> chat(@Valid @RequestBody ChatRequestDto request, Authentication auth) {
        User user = null;
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equalsIgnoreCase(auth.getName())) {
            user = userRepository.findByEmailOrUsername(auth.getName(), auth.getName()).orElse(null);
        }

        ChatResponseDto response = chatService.processChat(request, user);
        return ResponseEntity.ok(response);
    }
}
