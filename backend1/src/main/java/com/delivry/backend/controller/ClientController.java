package com.delivry.backend.controller;

import com.delivry.backend.application.service.ClientService;
import com.delivry.backend.request.client.ChangePasswordRequest;
import com.delivry.backend.request.client.CreateOrderRequest;
import com.delivry.backend.request.client.RatingRequest;
import com.delivry.backend.request.client.UpdateProfileRequest;
import com.delivry.backend.response.client.DeliveryOrderResponse;
import com.delivry.backend.response.client.DeliveryPriceResponse;
import com.delivry.backend.response.client.NotificationResponse;
import com.delivry.backend.response.client.ProfileResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/client")
@PreAuthorize("hasRole('CLIENT')")
@SecurityRequirement(name = "bearerAuth")
public class ClientController {

    private final ClientService clientService;

    public ClientController(ClientService clientService) {
        this.clientService = clientService;
    }

    // ── Заказы ────────────────────────────────────────────────────────────

    @PostMapping("/orders")
    public DeliveryOrderResponse createOrder(
            @Valid @RequestBody CreateOrderRequest request) {
        return clientService.createOrder(request);
    }

    @GetMapping("/orders")
    public List<DeliveryOrderResponse> getMyOrders() {
        return clientService.getMyOrders();
    }

    @GetMapping("/orders/{id}")
    public DeliveryOrderResponse getOrder(@PathVariable Long id) {
        return clientService.getOrder(id);
    }

    @PostMapping("/calculate")
    public DeliveryPriceResponse calculate(
            @RequestBody CreateOrderRequest request) {
        return clientService.calculatePrice(request);
    }

//    @PostMapping("/rating")
//    public void rateCourier(@RequestBody RatingRequest request) {
//        clientService.rateCourier(request);
//    }


    @PostMapping("/rating")
    public ResponseEntity<?> rateCourier(@RequestBody RatingRequest request) {
        clientService.rateCourier(request);
        return ResponseEntity.ok().build();
    }
    // ── Уведомления ───────────────────────────────────────────────────────

    /** Получить все уведомления текущего пользователя (новые первыми) */
    @GetMapping("/notifications")
    public List<NotificationResponse> getNotifications() {
        return clientService.getNotifications();
    }

    /** Пометить одно уведомление прочитанным */
    @PatchMapping("/notifications/{id}/read")
    public void markNotificationRead(@PathVariable Long id) {
        clientService.markNotificationRead(id);
    }

    /** Пометить все уведомления прочитанными */
    @PatchMapping("/notifications/read-all")
    public void markAllNotificationsRead() {
        clientService.markAllNotificationsRead();
    }

    // ── Профиль ───────────────────────────────────────────────────────────

    @GetMapping("/profile")
    public ProfileResponse getProfile() {
        return clientService.getProfile();
    }

    @PutMapping("/profile")
    public ProfileResponse updateProfile(
            @Valid @RequestBody UpdateProfileRequest request) {
        return clientService.updateProfile(request);
    }

    @PostMapping("/profile/change-password")
    public void changePassword(
            @Valid @RequestBody ChangePasswordRequest request) {
        clientService.changePassword(request);
    }
}