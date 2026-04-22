package com.delivry.backend.controller;

import com.delivry.backend.domain.entity.*;
import com.delivry.backend.domain.enums.*;
import com.delivry.backend.domain.repository.ClientRepository;
import com.delivry.backend.domain.repository.RoleRepository;
import com.delivry.backend.domain.repository.UserRepository;
import com.delivry.backend.domain.repository.UserStatusRepository;
import com.delivry.backend.infrastructure.security.JwtTokenUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    @Autowired private AuthenticationManager authenticationManager;
    @Autowired private JwtTokenUtil jwtTokenUtil;
    @Autowired private UserRepository userRepository;
    @Autowired private RoleRepository roleRepository;
    @Autowired private UserStatusRepository userStatusRepository;
    @Autowired private ClientRepository clientRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    // ─────────────────────────────────────────
    // POST /api/auth/login
    // ─────────────────────────────────────────
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            Authentication auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(), request.getPassword()
                    )
            );
            String token = jwtTokenUtil.generateToken(
                    auth.getName(), auth.getAuthorities()
            );

            User user = userRepository.findByEmail(auth.getName()).orElseThrow();
            log.info("User logged in: email={} role={}", user.getEmail(), user.getRole().getName());

            return ResponseEntity.ok(
                    new JwtResponse(
                            token,
                            user.getEmail(),
                            user.getFullName(),
                            user.getRole().getName()
                    )
            );
        } catch (BadCredentialsException e) {
            log.error("Login failed: email={} reason=bad_credentials", request.getEmail());
            return ResponseEntity.badRequest().body("Неверный email или пароль");
        }
    }

    // ─────────────────────────────────────────
// POST /api/auth/logout
// ─────────────────────────────────────────
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        // Удаляем сессию (если используется сессия)
        if (request.getSession(false) != null) {
            request.getSession().invalidate();
        }

        // Если используешь JWT, можно на фронте просто удалить токен из localStorage
        log.info("User logged out");
        return ResponseEntity.noContent().build();
    }




    // ─────────────────────────────────────────
    // POST /api/auth/register
    // ─────────────────────────────────────────
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {

        //  Проверка уникальности email
        if (userRepository.existsByEmail(request.getEmail())) {
            log.error("Registration failed: email={} reason=email_exists", request.getEmail());
            return ResponseEntity.badRequest().body("Email уже занят");
        }

        // Определяем роль (по умолчанию — Клиент)
        String roleName = (request.getRoleName() != null)
                ? request.getRoleName()
                : "CLIENT";

        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new RuntimeException("Роль не найдена: " + roleName));

        // Статус «Активен» по умолчанию
        UserStatus activeStatus = userStatusRepository.findByName("Активен")
                .orElseThrow(() -> new RuntimeException("Статус 'Активен' не найден"));

        //  Создаём пользователя
        User user = new User();
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());
        user.setRole(role);
        user.setStatus(activeStatus);
        userRepository.save(user);

        // Если роль — Клиент, создаём запись в таблице client
        if ("CLIENT".equals(roleName)) {
            Client client = new Client();
            client.setUser(user);

            clientRepository.save(client);
        }

        log.info("User registered: email={} role={}", user.getEmail(), user.getRole().getName());

        return ResponseEntity.ok("Регистрация прошла успешно");
    }
}

// ─────────────────────────────────────────
// DTO: LoginRequest
// ─────────────────────────────────────────
class LoginRequest {
    private String email;
    private String password;

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}

// ─────────────────────────────────────────
// DTO: RegisterRequest
// ─────────────────────────────────────────
class RegisterRequest {
    private String email;
    private String password;
    private String fullName;      // maps → user.full_name
    private String phone;         // maps → user.phone
    private String roleName;      // "Клиент" | "Курьер" | "Логист" | "Администратор"



    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getRoleName() { return roleName; }
    public void setRoleName(String roleName) { this.roleName = roleName; }

}

// ─────────────────────────────────────────
// DTO: JwtResponse
// ─────────────────────────────────────────
//class JwtResponse {
//    private String token;
//
//    public JwtResponse(String token) { this.token = token; }
//    public String getToken() { return token; }
//    public void setToken(String token) { this.token = token; }
//}

class JwtResponse {

    private String token;
    private String email;
    private String fullName;
    private String role;

    public JwtResponse(String token, String email, String fullName, String role) {
        this.token = token;
        this.email = email;
        this.fullName = fullName;
        this.role = role;
    }

    public String getToken() { return token; }
    public String getEmail() { return email; }
    public String getFullName() { return fullName; }
    public String getRole() { return role; }
}
