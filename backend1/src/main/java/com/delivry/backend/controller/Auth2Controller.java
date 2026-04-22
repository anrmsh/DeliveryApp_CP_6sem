package com.delivry.backend.controller;

import com.delivry.backend.domain.entity.User;
import com.delivry.backend.domain.repository.RoleRepository;
import com.delivry.backend.domain.repository.UserRepository;
import com.delivry.backend.domain.repository.UserStatusRepository;
import com.delivry.backend.infrastructure.security.JwtTokenUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.view.RedirectView;

import java.util.Collections;

@RestController
@RequestMapping("/api/auth/oauth2")
public class Auth2Controller {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserStatusRepository userStatusRepository;
    private final JwtTokenUtil jwtTokenUtil;


    public Auth2Controller(UserRepository userRepository,
                           RoleRepository roleRepository,
                           UserStatusRepository userStatusRepository,
                           JwtTokenUtil jwtTokenUtil) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.userStatusRepository = userStatusRepository;
        this.jwtTokenUtil = jwtTokenUtil;
    }

    @GetMapping("/success")
    public ResponseEntity<?> oauthSuccess(@AuthenticationPrincipal OAuth2User oauthUser) {

        String email = oauthUser.getAttribute("email");
        String name  = oauthUser.getAttribute("name");

        if (email == null) {
            return ResponseEntity.badRequest().body("Email не получен от провайдера");
        }

        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User newUser = new User();
            newUser.setEmail(email);
            newUser.setFullName(name != null ? name : email);
            newUser.setPasswordHash("");
            newUser.setOauthProvider("google");
            newUser.setRole(
                    roleRepository.findByName("CLIENT")
                            .orElseThrow(() -> new RuntimeException("Роль 'Клиент' не найдена"))
            );
            newUser.setStatus(
                    userStatusRepository.findByName("Активен")
                            .orElseThrow(() -> new RuntimeException("Статус не найден"))
            );
            return userRepository.save(newUser);
        });

        String token = jwtTokenUtil.generateToken(
                user.getEmail(),
                Collections.singletonList(
                        new SimpleGrantedAuthority("ROLE_" + user.getRole().getName())
                )
        );

        return ResponseEntity.ok(new OAuthResponse(token, user.getFullName(), user.getEmail()));
    }

    @GetMapping("/failure")
    public RedirectView oauthFailure() {
        return new RedirectView("http://localhost:5173/login?oauthError=1");
    }

    @GetMapping("/login")
    public ResponseEntity<?> oauthLoginInfo() {
        return ResponseEntity.ok(new OAuthLoginInfo(
                "Перейдите по ссылке для входа через Google",
                "/oauth2/authorization/google"
        ));
    }
}


record OAuthResponse(String token, String fullName, String email) {}
record OAuthLoginInfo(String message, String redirectUrl) {}
