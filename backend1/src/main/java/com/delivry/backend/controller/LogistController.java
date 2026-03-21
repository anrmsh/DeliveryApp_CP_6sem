package com.delivry.backend.controller;

import com.delivry.backend.application.service.LogistService;
import com.delivry.backend.request.logist.UpdateRouteStatusRequest;
import com.delivry.backend.response.logist.*;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/logist")
@PreAuthorize("hasRole('LOGIST')")
@SecurityRequirement(name = "bearerAuth")
public class LogistController {

    private final LogistService logistService;

    public LogistController(LogistService logistService) {
        this.logistService = logistService;
    }

    // ── Dashboard ─────────────────────────────────────────────────────────

    @GetMapping("/dashboard")
    public DashboardResponse getDashboard() {
        return logistService.getDashboard();
    }

    // ── Заказы ────────────────────────────────────────────────────────────

    @GetMapping("/orders")
    public List<OrderSummaryResponse> getAllOrders() {
        return logistService.getAllOrders();
    }

    @GetMapping("/orders/pending")
    public List<OrderSummaryResponse> getPendingOrders() {
        return logistService.getPendingOrders();
    }

    // ── Автопланирование ──────────────────────────────────────────────────

    /**
     * POST /api/logist/autoplan
     * Система сама строит маршруты из необработанных заказов.
     * Логист запускает и получает список черновиков для проверки.
     */
    @PostMapping("/autoplan")
    public List<RouteSheetResponse> autoplan() {
        return logistService.autoplan();
    }

    // ── Маршруты ──────────────────────────────────────────────────────────

    @GetMapping("/routes")
    public List<RouteSheetResponse> getRoutes() {
        return logistService.getRoutes();
    }

    @GetMapping("/routes/drafts")
    public List<RouteSheetResponse> getDraftRoutes() {
        return logistService.getDraftRoutes();
    }

    @GetMapping("/routes/{id}")
    public RouteSheetResponse getRoute(@PathVariable Long id) {
        return logistService.getRoute(id);
    }

    /**
     * POST /api/logist/routes/{id}/approve
     * Логист утверждает маршрут → статус "Активен", курьер получает задание.
     */
    @PostMapping("/routes/{id}/approve")
    public RouteSheetResponse approveRoute(@PathVariable Long id) {
        return logistService.approveRoute(id);
    }

    /**
     * POST /api/logist/routes/{id}/reject
     * Логист отклоняет маршрут → заказы возвращаются в очередь.
     */
    @PostMapping("/routes/{id}/reject")
    public RouteSheetResponse rejectRoute(@PathVariable Long id) {
        return logistService.rejectRoute(id);
    }

    @PatchMapping("/routes/{id}/status")
    public RouteSheetResponse updateRouteStatus(
            @PathVariable Long id,
            @RequestBody UpdateRouteStatusRequest request) {
        return logistService.updateRouteStatus(id, request);
    }

    // ── Автомобили ────────────────────────────────────────────────────────

    @GetMapping("/vehicles")
    public List<VehicleResponse> getVehicles(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String sort) {
        return logistService.getVehicles(status, sort);
    }

    // ── Курьеры ───────────────────────────────────────────────────────────

    @GetMapping("/couriers")
    public List<CourierResponse> getCouriers() {
        return logistService.getCouriers();
    }

    @GetMapping("/couriers/ratings")
    public List<CourierRatingResponse> getCourierRatings() {
        return logistService.getCourierRatings();
    }

    // ── Отчёты ────────────────────────────────────────────────────────────

    @GetMapping("/reports")
    public ReportResponse getReport(
            @RequestParam(required = false, defaultValue = "month") String period) {
        return logistService.getReport(period);
    }
}