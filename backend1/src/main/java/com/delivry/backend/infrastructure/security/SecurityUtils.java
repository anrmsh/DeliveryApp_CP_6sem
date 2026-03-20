package com.delivry.backend.infrastructure.security;

import com.delivry.backend.domain.entity.User;
import com.delivry.backend.domain.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class SecurityUtils {

    private static UserRepository userRepository;

    // Внедряем репозиторий через конструктор
    public SecurityUtils(UserRepository repo) {
        SecurityUtils.userRepository = repo;
    }

    // Получаем ID пользователя по email
    public static Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName(); // auth.getName() возвращает email

        // Ищем пользователя в базе и возвращаем его id
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));

        return user.getId();
    }
}