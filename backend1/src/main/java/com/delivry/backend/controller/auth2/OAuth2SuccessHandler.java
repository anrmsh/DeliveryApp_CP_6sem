package com.delivry.backend.controller.auth2;



import com.delivry.backend.domain.entity.Client;
import com.delivry.backend.domain.entity.Role;
import com.delivry.backend.domain.entity.User;
import com.delivry.backend.domain.enums.UserStatus;
import com.delivry.backend.domain.repository.ClientRepository;
import com.delivry.backend.domain.repository.RoleRepository;
import com.delivry.backend.domain.repository.UserRepository;
import com.delivry.backend.domain.repository.UserStatusRepository;
import com.delivry.backend.infrastructure.security.JwtTokenUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Collections;


@Component
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {
    private static final Logger log = LoggerFactory.getLogger(OAuth2SuccessHandler.class);


    private static final String FRONTEND_REDIRECT = "http://localhost:5173/oauth-callback";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserStatusRepository userStatusRepository;
    private final ClientRepository clientRepository;
    private final JwtTokenUtil jwtTokenUtil;

    public OAuth2SuccessHandler(UserRepository userRepository,
                                RoleRepository roleRepository,
                                UserStatusRepository userStatusRepository,
                                ClientRepository clientRepository,
                                JwtTokenUtil jwtTokenUtil) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.userStatusRepository = userStatusRepository;
        this.clientRepository = clientRepository;
        this.jwtTokenUtil = jwtTokenUtil;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {

        OAuth2User oauthUser = (OAuth2User) authentication.getPrincipal();

        String provider = resolveProvider(authentication);
        String email = resolveEmail(oauthUser, provider);
        String name  = resolveDisplayName(oauthUser);
        String oauthId = resolveOauthId(oauthUser, provider);

        if (email == null) {
            log.error("OAuth2 login failed: provider={} reason=no_email", provider);
            response.sendRedirect(FRONTEND_REDIRECT + "?error=no_email");
            return;
        }

        // Найти существующего или создать нового пользователя
        User user = userRepository.findByEmail(email).orElseGet(() -> {

            // Роль CLIENT
            Role clientRole = roleRepository.findByName("CLIENT")
                    .orElseThrow(() -> new RuntimeException("Роль CLIENT не найдена"));

            UserStatus activeStatus = userStatusRepository.findByName("Активен")
                    .orElseThrow(() -> new RuntimeException("Статус 'Активен' не найден"));

            User newUser = new User();
            newUser.setEmail(email);
            newUser.setFullName(name != null ? name : email);
            newUser.setPasswordHash(""); // пароля нет — вход только через Google
            newUser.setOauthProvider(provider);
            newUser.setOauthId(oauthId);
            newUser.setRole(clientRole);
            newUser.setStatus(activeStatus);
            userRepository.save(newUser);


            Client client = new Client();
            client.setUser(newUser);
            clientRepository.save(client);

            log.info("OAuth2 user registered: provider={} email={} role={}",
                    provider, email, clientRole.getName());
            return newUser;
        });


        if ("Заблокирован".equals(user.getStatus().getName())) {
            log.warn("Blocked OAuth2 login attempt: provider={} email={}", provider, email);
            response.sendRedirect(FRONTEND_REDIRECT + "?error=blocked");
            return;
        }

        // Генерируем JWT
        String token = jwtTokenUtil.generateToken(
                user.getEmail(),
                Collections.singletonList(
                        new SimpleGrantedAuthority("ROLE_" + user.getRole().getName())
                )
        );


        log.info("User logged in via OAuth2: provider={} email={} role={}",
                provider, user.getEmail(), user.getRole().getName());
        response.sendRedirect(FRONTEND_REDIRECT
                + "?token=" + token
                + "&email=" + encode(user.getEmail())
                + "&fullName=" + encode(user.getFullName())
                + "&role=" + encode(user.getRole().getName()));

    }

    private String resolveProvider(Authentication authentication) {
        if (authentication instanceof OAuth2AuthenticationToken token) {
            return token.getAuthorizedClientRegistrationId();
        }
        return "oauth2";
    }

    private String resolveEmail(OAuth2User oauthUser, String provider) {
        String email = oauthUser.getAttribute("email");
        if (email != null && !email.isBlank()) {
            return email;
        }
        if ("github".equalsIgnoreCase(provider)) {
            String login = oauthUser.getAttribute("login");
            if (login != null && !login.isBlank()) {
                return login + "@users.noreply.github.com";
            }
        }
        return null;
    }

    private String resolveDisplayName(OAuth2User oauthUser) {
        String name = oauthUser.getAttribute("name");
        if (name != null && !name.isBlank()) {
            return name;
        }
        String login = oauthUser.getAttribute("login");
        if (login != null && !login.isBlank()) {
            return login;
        }
        String email = oauthUser.getAttribute("email");
        return email != null ? email : "OAuth User";
    }

    private String resolveOauthId(OAuth2User oauthUser, String provider) {
        Object providerId = "google".equalsIgnoreCase(provider)
                ? oauthUser.getAttribute("sub")
                : oauthUser.getAttribute("id");
        return providerId != null ? String.valueOf(providerId) : null;
    }

    private String encode(String value) {
        return URLEncoder.encode(value == null ? "" : value, StandardCharsets.UTF_8);
    }
}
