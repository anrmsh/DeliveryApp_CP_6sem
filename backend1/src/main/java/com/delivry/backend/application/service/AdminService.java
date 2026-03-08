package com.delivry.backend.application.service;

import com.delivry.backend.domain.entity.*;
import com.delivry.backend.domain.enums.UserStatus;
import com.delivry.backend.domain.repository.*;
import com.delivry.backend.request.CreateEmployeeRequest;
import com.delivry.backend.request.UpdateUserRequest;
import com.delivry.backend.response.AdminUserResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AdminService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserStatusRepository userStatusRepository;
    private final PasswordEncoder passwordEncoder;

    // Убраны неиспользуемые зависимости из конструктора
    public AdminService(UserRepository userRepository,
                        RoleRepository roleRepository,
                        UserStatusRepository userStatusRepository,
                        PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.userStatusRepository = userStatusRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // ─────────────────────────────────────────
    // USER MANAGEMENT
    // ─────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<AdminUserResponse> getAllUsers(String roleName, String statusName, Pageable pageable) {
        return userRepository
                .findAllWithFilters(roleName, statusName, pageable)
                .map(this::toUserResponse);
    }

    @Transactional(readOnly = true)
    public AdminUserResponse getUserById(Long id) {
        User user = findUserOrThrow(id);
        return toUserResponse(user);
    }

    public AdminUserResponse createEmployee(CreateEmployeeRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email уже занят: " + request.getEmail());
        }

        Role role = roleRepository.findByName(request.getRoleName())
                .orElseThrow(() -> new IllegalArgumentException("Роль не найдена: " + request.getRoleName()));

        UserStatus activeStatus = userStatusRepository.findByName("Активен")
                .orElseThrow(() -> new RuntimeException("Статус 'Активен' не найден"));

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());
        user.setRole(role);
        user.setStatus(activeStatus);

        userRepository.save(user);
        return toUserResponse(user);
    }

    public AdminUserResponse updateUser(Long id, UpdateUserRequest request) {
        User user = findUserOrThrow(id);

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }
        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new IllegalArgumentException("Email уже занят: " + request.getEmail());
            }
            user.setEmail(request.getEmail());
        }

        userRepository.save(user);
        return toUserResponse(user);
    }

    public AdminUserResponse setUserBlockStatus(Long id, boolean block) {
        User user = findUserOrThrow(id);

        String targetStatus = block ? "Заблокирован" : "Активен";
        UserStatus status = userStatusRepository.findByName(targetStatus)
                .orElseThrow(() -> new RuntimeException("Статус не найден: " + targetStatus));

        user.setStatus(status);
        userRepository.save(user);
        return toUserResponse(user);
    }

    public void deleteEmployee(Long id) {
        User user = findUserOrThrow(id);
        String roleName = user.getRole().getName();

        if ("ADMIN".equals(roleName) || "CLIENT".equals(roleName)) {
            throw new IllegalArgumentException("Нельзя удалить пользователя с ролью: " + roleName);
        }

        userRepository.delete(user);
    }

    // ─────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────

    private User findUserOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден: " + id));
    }

    private AdminUserResponse toUserResponse(User user) {
        return new AdminUserResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getPhone(),
                user.getRole() != null ? user.getRole().getName() : null,
                user.getStatus() != null ? user.getStatus().getName() : null,
                user.getCreatedAt()
        );
    }
}