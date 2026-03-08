package com.delivry.backend.controller;

import com.delivry.backend.application.service.AdminService;
import com.delivry.backend.request.CreateEmployeeRequest;
import com.delivry.backend.request.UpdateUserRequest;
import com.delivry.backend.response.AdminUserResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin", description = "Управление системой — доступно только Администратору")
@SecurityRequirement(name = "bearerAuth")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    // ═══════════════════════════════════════════
    // USER MANAGEMENT
    // ═══════════════════════════════════════════

    @GetMapping("/users")
    @Operation(
            summary = "Список всех пользователей",
            description = "Фильтрация по роли и статусу, пагинация и сортировка на бэке. " +
                    "Пример: /api/admin/users?roleName=COURIER&statusName=Активен&sort=fullName,asc"
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Список получен"),
            @ApiResponse(responseCode = "403", description = "Нет доступа")
    })
    public ResponseEntity<Page<AdminUserResponse>> getAllUsers(
            @Parameter(description = "Фильтр по роли: ADMIN, LOGIST, COURIER, CLIENT")
            @RequestParam(required = false) String roleName,

            @Parameter(description = "Фильтр по статусу: Активен, Заблокирован")
            @RequestParam(required = false) String statusName,

            @PageableDefault(size = 20, sort = "fullName", direction = Sort.Direction.ASC)
            Pageable pageable
    ) {
        return ResponseEntity.ok(adminService.getAllUsers(roleName, statusName, pageable));
    }

    @GetMapping("/users/{id}")
    @Operation(summary = "Получить пользователя по ID")
    public ResponseEntity<AdminUserResponse> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getUserById(id));
    }

    @PostMapping("/users")
    @Operation(
            summary = "Регистрация сотрудника",
            description = "Создание нового курьера или логиста. Поле roleName: COURIER | LOGIST"
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Сотрудник создан"),
            @ApiResponse(responseCode = "400", description = "Email уже занят или некорректные данные")
    })
    public ResponseEntity<AdminUserResponse> createEmployee(
            @Valid @RequestBody CreateEmployeeRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.createEmployee(request));
    }

    @PutMapping("/users/{id}")
    @Operation(summary = "Редактировать пользователя")
    public ResponseEntity<AdminUserResponse> updateUser(
            @PathVariable Long id,
            @RequestBody UpdateUserRequest request
    ) {
        return ResponseEntity.ok(adminService.updateUser(id, request));
    }

    @PatchMapping("/users/{id}/block")
    @Operation(
            summary = "Блокировка / разблокировка пользователя",
            description = "block=true — заблокировать, block=false — разблокировать"
    )
    public ResponseEntity<AdminUserResponse> setBlockStatus(
            @PathVariable Long id,
            @RequestParam boolean block
    ) {
        return ResponseEntity.ok(adminService.setUserBlockStatus(id, block));
    }

    @DeleteMapping("/users/{id}")
    @Operation(
            summary = "Удалить сотрудника",
            description = "Удаляет только курьеров и логистов. ADMIN и CLIENT удалить нельзя."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Удалён"),
            @ApiResponse(responseCode = "400", description = "Нельзя удалить пользователя с данной ролью"),
            @ApiResponse(responseCode = "404", description = "Пользователь не найден")
    })
    public ResponseEntity<Void> deleteEmployee(@PathVariable Long id) {
        adminService.deleteEmployee(id);
        return ResponseEntity.noContent().build();
    }
}