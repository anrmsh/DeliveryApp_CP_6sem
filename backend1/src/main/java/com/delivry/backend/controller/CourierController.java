package com.delivry.backend.controller;

import com.delivry.backend.application.pattern.facade.CourierRouteFacade;
import com.delivry.backend.application.service.CourierService;
import com.delivry.backend.request.courier.CompleteRouteRequest;
import com.delivry.backend.request.courier.UpdatePointStatusRequest;
import com.delivry.backend.response.courier.*;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/courier")
@PreAuthorize("hasRole('COURIER')")
@SecurityRequirement(name = "bearerAuth")
public class CourierController {

    private final CourierService courierService;
    private final CourierRouteFacade courierRouteFacade;

    public CourierController(CourierService courierService, CourierRouteFacade courierRouteFacade) {
        this.courierService = courierService;
        this.courierRouteFacade = courierRouteFacade;
    }

    // ── Dashboard ──

    @GetMapping("/dashboard")
    public CourierDashboardResponse getDashboard() {
        return courierService.getDashboard();
    }

    // ── Текущий маршрут ───────────────────────────────────────────────────

    /** Активный маршрут курьера (статус "Активен") */
    @GetMapping("/route/current")
    public CourierRouteResponse getCurrentRoute() {
        return courierRouteFacade.getCurrentRoute();
    }

    // ── Отметить точку ────────────────────────────────────────────────────

    /**
     * PATCH /api/courier/route/points/{pointId}/status
     * Тело: { "status": "Посещена" | "Пропущена" }
     * Автоматически уведомляет клиента об изменении статуса заказа
     */
    @PatchMapping("/route/points/{pointId}/status")
    public CourierRouteResponse updatePointStatus(
            @PathVariable Long pointId,
            @RequestBody UpdatePointStatusRequest request) {
        return courierRouteFacade.updatePointStatus(pointId, request);
    }

    // ── Завершить маршрут ─────────────────────────────────────────────────

    /**
     * POST /api/courier/route/{routeId}/complete
     * Тело: { "actualDistanceKm": 35.5 }
     * Записывает пробег, освобождает автомобиль, меняет статус
     */
    @PostMapping("/route/{routeId}/complete")
    public CourierRouteResponse completeRoute(
            @PathVariable Long routeId,
            @RequestBody CompleteRouteRequest request) {
        return courierRouteFacade.completeRoute(routeId, request);
    }

    // ── Уведомления ───────────────────────────────────────────────────────

    @GetMapping("/notifications")
    public List<CourierNotificationResponse> getNotifications() {
        return courierService.getNotifications();
    }

    @PatchMapping("/notifications/{id}/read")
    public void markRead(@PathVariable Long id) {
        courierService.markNotificationRead(id);
    }

    @PatchMapping("/notifications/read-all")
    public void markAllRead() {
        courierService.markAllNotificationsRead();
    }

    // ── История маршрутов ─────────────────────────────────────────────────

    @GetMapping("/routes/history")
    public List<CourierRouteHistoryResponse> getHistory() {
        return courierService.getRouteHistory();
    }

    // ── Профиль ───────────────────────────────────────────────────────────

    @GetMapping("/profile")
    public CourierProfileResponse getProfile() {
        return courierService.getProfile();
    }

    // POST /api/courier/route/{routeId}/start
    @PostMapping("/route/{routeId}/start")
    public CourierRouteResponse startRoute(@PathVariable Long routeId) {
        return courierRouteFacade.startRoute(routeId);
    }
}
