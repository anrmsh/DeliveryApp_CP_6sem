package com.delivry.backend.controller;


import com.delivry.backend.application.service.LogistService;
import com.delivry.backend.request.logist.*;
import com.delivry.backend.response.logist.*;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
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

    // ── Заказы (необработанные) ────────────────────────────────────────────

    @GetMapping("/orders")
    public List<OrderSummaryResponse> getPendingOrders() {
        return logistService.getPendingOrders();
    }

    // ── Маршрутные листы ──────────────────────────────────────────────────

    @GetMapping("/routes")
    public List<RouteSheetResponse> getRoutes() {
        return logistService.getRoutes();
    }

    @GetMapping("/routes/{id}")
    public RouteSheetResponse getRoute(@PathVariable Long id) {
        return logistService.getRoute(id);
    }

    @PostMapping("/routes")
    public RouteSheetResponse createRoute(@Valid @RequestBody CreateRouteRequest request) {
        return logistService.createRoute(request);
    }

    @PatchMapping("/routes/{id}/status")
    public RouteSheetResponse updateRouteStatus(
            @PathVariable Long id,
            @RequestBody UpdateRouteStatusRequest request) {
        return logistService.updateRouteStatus(id, request);
    }

    // ── Назначить заказ на маршрут ────────────────────────────────────────

    @PostMapping("/routes/{routeId}/orders/{orderId}")
    public RouteSheetResponse assignOrderToRoute(
            @PathVariable Long routeId,
            @PathVariable Long orderId) {
        return logistService.assignOrderToRoute(routeId, orderId);
    }

    // ── Планировщик маршрута (алгоритм ближайшего соседа + OSRM) ──────────

    @PostMapping("/routes/{id}/optimize")
    public RouteSheetResponse optimizeRoute(@PathVariable Long id) {
        return logistService.optimizeRoute(id);
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

    // ── Отчётность ────────────────────────────────────────────────────────

    @GetMapping("/reports")
    public ReportResponse getReport(
            @RequestParam(required = false, defaultValue = "month") String period) {
        return logistService.getReport(period);
    }
}