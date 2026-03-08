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
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Collections;

/**
 * Вызывается Spring автоматически после успешного входа через Google.
 *
 * Поток:
 *   Google → Spring → этот handler → redirect → http://localhost:3000/oauth2/callback?token=JWT
 */
@Component
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    // Куда редиректить фронт после успешного входа
    //private static final String FRONTEND_REDIRECT = "http://localhost:3000/oauth2/callback";
    // URL твоего React-приложения
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

        String email = oauthUser.getAttribute("email");
        String name  = oauthUser.getAttribute("name");

        if (email == null) {
            response.sendRedirect(FRONTEND_REDIRECT + "?error=no_email");
            return;
        }

        // Найти существующего или создать нового пользователя
        User user = userRepository.findByEmail(email).orElseGet(() -> {

            // Роль CLIENT — именно так хранится в БД
            Role clientRole = roleRepository.findByName("CLIENT")
                    .orElseThrow(() -> new RuntimeException("Роль CLIENT не найдена"));

            UserStatus activeStatus = userStatusRepository.findByName("Активен")
                    .orElseThrow(() -> new RuntimeException("Статус 'Активен' не найден"));

            User newUser = new User();
            newUser.setEmail(email);
            newUser.setFullName(name != null ? name : email);
            newUser.setPasswordHash(""); // пароля нет — вход только через Google
            newUser.setOauthProvider("google");
            newUser.setOauthId(oauthUser.getAttribute("sub")); // уникальный ID в Google
            newUser.setRole(clientRole);
            newUser.setStatus(activeStatus);
            userRepository.save(newUser);

            // Создаём запись в таблице client (1:1 с user)
            Client client = new Client();
            client.setUser(newUser);
            clientRepository.save(client);

            return newUser;
        });

        // Проверяем не заблокирован ли аккаунт
        if ("Заблокирован".equals(user.getStatus().getName())) {
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

        // Редирект на фронт с токеном
        response.sendRedirect(FRONTEND_REDIRECT + "?token=" + token);

    }
}