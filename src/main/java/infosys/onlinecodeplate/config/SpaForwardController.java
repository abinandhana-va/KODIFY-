package infosys.onlinecodeplate.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaForwardController {

    @GetMapping(value = {
            "/login",
            "/signup",
            "/dashboard",
            "/profile",
            "/leaderboard",
            "/problems",
            "/problems/**",
            "/contests",
            "/contests/**",
            "/assignments",
            "/assignments/**",
            "/submissions",
            "/activity",
            "/certificates",
            "/certificate",
            "/badges",
            "/admin/**"
    })
    public String forwardSpaRoutes() {
        return "forward:/index.html";
    }
}
