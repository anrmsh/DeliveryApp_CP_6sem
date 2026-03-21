package com.delivry.backend.application.service;

import com.delivry.backend.domain.entity.*;
import com.delivry.backend.domain.enums.DeliveryStatus;
import com.delivry.backend.domain.enums.RouteStatus;
import com.delivry.backend.domain.repository.*;
import com.delivry.backend.infrastructure.security.SecurityUtils;
import com.delivry.backend.request.logist.UpdateRouteStatusRequest;
import com.delivry.backend.response.logist.*;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class LogistService {

    private final DeliveryOrderRepository    orderRepository;
    private final RouteSheetRepository       routeSheetRepository;
    private final RoutePointRepository       routePointRepository;
    private final VehicleRepository          vehicleRepository;
    private final UserRepository             userRepository;
    private final CourierRatingsRepository   ratingRepository;
    private final DeliveryStatusRepository   deliveryStatusRepository;
    private final RouteStatusRepository      routeStatusRepository;
    private final RoutePlanningService       planningService;
    private final NotificationRepository     notificationRepository;

    public LogistService(
            DeliveryOrderRepository  orderRepository,
            RouteSheetRepository     routeSheetRepository,
            RoutePointRepository     routePointRepository,
            VehicleRepository        vehicleRepository,
            UserRepository           userRepository,
            CourierRatingsRepository ratingRepository,
            DeliveryStatusRepository deliveryStatusRepository,
            RouteStatusRepository    routeStatusRepository,
            RoutePlanningService     planningService,
            NotificationRepository notificationRepository
    ) {
        this.orderRepository          = orderRepository;
        this.routeSheetRepository     = routeSheetRepository;
        this.routePointRepository     = routePointRepository;
        this.vehicleRepository        = vehicleRepository;
        this.userRepository           = userRepository;
        this.ratingRepository         = ratingRepository;
        this.deliveryStatusRepository = deliveryStatusRepository;
        this.routeStatusRepository    = routeStatusRepository;
        this.planningService          = planningService;
        this.notificationRepository = notificationRepository;
    }

    // ── DASHBOARD ─────────────────────────────────────────────────────────

    public DashboardResponse getDashboard() {
        long totalOrders   = orderRepository.count();
        long pendingOrders = countByStatusName(orderRepository, "Создан");
        long activeRoutes  = routeSheetRepository.countByStatusName("Активен");
        long totalVehicles = vehicleRepository.count();
        long freeVehicles  = vehicleRepository.countByStatusName("Доступен");
        long totalCouriers = userRepository.countByRoleName("COURIER");
        long draftRoutes   = routeSheetRepository.countByStatusName("Запланирован");

        return new DashboardResponse(
                totalOrders, pendingOrders, activeRoutes,
                totalVehicles, freeVehicles, totalCouriers, draftRoutes
        );
    }

    // ── ORDERS ────────────────────────────────────────────────────────────

    public List<OrderSummaryResponse> getPendingOrders() {
        return orderRepository.findAll().stream()
                .filter(o -> o.getStatus() != null && "Создан".equals(o.getStatus().getName()))
                .sorted(Comparator.comparing(DeliveryOrder::getRequestedTime,
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .map(OrderSummaryResponse::from)
                .toList();
    }

    public List<OrderSummaryResponse> getAllOrders() {
        return orderRepository.findAll().stream()
                .sorted(Comparator.comparing(DeliveryOrder::getCreatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .map(OrderSummaryResponse::from)
                .toList();
    }

    // ── AUTO PLANNING ──────────────────────────────────────────────────────

    /**
     * Запустить автопланирование — система сама строит маршруты.
     * Логист только смотрит результат и утверждает.
     */
    public List<RouteSheetResponse> autoplan() {
        List<RouteSheet> routes = planningService.planRoutes();
        return routes.stream()
                .map(r -> RouteSheetResponse.from(r, loadPoints(r.getId())))
                .toList();
    }

    // ── ROUTES ────────────────────────────────────────────────────────────

    public List<RouteSheetResponse> getRoutes() {
        return routeSheetRepository.findAll().stream()
                .sorted(Comparator.comparing(RouteSheet::getCreatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .map(r -> RouteSheetResponse.from(r, loadPoints(r.getId())))
                .toList();
    }

    public List<RouteSheetResponse> getDraftRoutes() {
        return routeSheetRepository.findAll().stream()
                .filter(r -> r.getStatus() != null && "Запланирован".equals(r.getStatus().getName()))
                .sorted(Comparator.comparing(RouteSheet::getCreatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .map(r -> RouteSheetResponse.from(r, loadPoints(r.getId())))
                .toList();
    }

    public RouteSheetResponse getRoute(Long id) {
        RouteSheet route = findRoute(id);
        return RouteSheetResponse.from(route, loadPoints(id));
    }

    /**
     * Утвердить маршрут — логист одобряет, статус меняется на "Активен".
     * Уведомление курьеру отправляется здесь.
     */
    public RouteSheetResponse approveRoute(Long id) {
        RouteSheet route = findRoute(id);

        if (!"Запланирован".equals(route.getStatus().getName())) {
            throw new IllegalStateException("Можно утвердить только маршрут в статусе 'Запланирован'");
        }

        Long logistId = SecurityUtils.getCurrentUserId();
        User logist   = userRepository.findById(logistId)
                .orElseThrow(() -> new IllegalStateException("Logist not found"));
        route.setLogistician(logist);

        RouteStatus active = routeStatusRepository.findByName("Активен")
                .orElseThrow(() -> new IllegalStateException("Status 'Активен' not found"));
        route.setStatus(active);

        // Mark vehicle in use
        if (route.getVehicle() != null) {
            route.getVehicle().getStatus().setName("В рейсе");
            vehicleRepository.save(route.getVehicle());
        }

        routeSheetRepository.save(route);

        // ── УВЕДОМЛЕНИЕ КУРЬЕРУ ──────────────────────────────────────────
        if (route.getCourier() != null) {
            int pointsCount = routePointRepository
                    .findByRouteIdOrderBySequenceNumber(route.getId()).size();
            String startTime = route.getPlannedStart() != null
                    ? route.getPlannedStart().format(
                    java.time.format.DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm"))
                    : "—";
            createNotification(
                    route.getCourier(),
                    "Новый маршрутный лист #" + route.getId(),
                    "Логист " + logist.getFullName() + " назначил вам маршрут. " +
                            "Начало: " + startTime + ". " +
                            "Точек доставки: " + pointsCount + ". " +
                            "Транспорт: " + (route.getVehicle() != null
                            ? route.getVehicle().getModel() + " (" + route.getVehicle().getPlateNumber() + ")"
                            : "—")
            );
        }

        return RouteSheetResponse.from(route, loadPoints(id));
    }

    /**
     * Отклонить маршрут — заказы возвращаются в статус "Создан".
     */
    public RouteSheetResponse rejectRoute(Long id) {
        RouteSheet route = findRoute(id);

        RouteStatus cancelled = routeStatusRepository.findByName("Отменён")
                .orElseThrow();
        route.setStatus(cancelled);
        routeSheetRepository.save(route);

        // Return orders to "Создан"
        DeliveryStatus created = deliveryStatusRepository.findByName("Создан")
                .orElseThrow(() -> new IllegalStateException("Status 'Создан' not found"));

        loadPoints(id).forEach(p -> {
            if (p.getOrder() != null) {
                p.getOrder().setStatus(created);
                orderRepository.save(p.getOrder());
            }
        });

        return RouteSheetResponse.from(route, loadPoints(id));
    }

    public RouteSheetResponse updateRouteStatus(Long id, UpdateRouteStatusRequest request) {
        RouteSheet route = findRoute(id);
        RouteStatus status = routeStatusRepository.findByName(request.getStatus())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Route status not found: " + request.getStatus()));
        route.setStatus(status);
        routeSheetRepository.save(route);

        if ("Завершён".equals(request.getStatus()) || "Отменён".equals(request.getStatus())) {
            Vehicle v = route.getVehicle();
            if (v != null) { v.getStatus().setName("Доступен"); vehicleRepository.save(v); }
        }
        return RouteSheetResponse.from(route, loadPoints(id));
    }

    // ── VEHICLES ──────────────────────────────────────────────────────────

    public List<VehicleResponse> getVehicles(String statusFilter, String sort) {
        List<Vehicle> vehicles = vehicleRepository.findAll();
        if (statusFilter != null && !statusFilter.isBlank()) {
            vehicles = vehicles.stream()
                    .filter(v -> v.getStatus() != null && statusFilter.equals(v.getStatus().getName()))
                    .collect(Collectors.toList());
        }
        if ("capacity".equals(sort)) {
            vehicles.sort(Comparator.comparing(Vehicle::getCapacityKg,
                    Comparator.nullsLast(Comparator.reverseOrder())));
        } else if ("volume".equals(sort)) {
            vehicles.sort(Comparator.comparing(Vehicle::getVolumeM3,
                    Comparator.nullsLast(Comparator.reverseOrder())));
        }
        return vehicles.stream().map(VehicleResponse::from).toList();
    }

    // ── COURIERS ──────────────────────────────────────────────────────────

    public List<CourierResponse> getCouriers() {
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() != null && "COURIER".equals(u.getRole().getName()))
                .map(CourierResponse::from)
                .toList();
    }

    public List<CourierRatingResponse> getCourierRatings() {
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() != null && "COURIER".equals(u.getRole().getName()))
                .map(courier -> {
                    List<CourierRating> ratings = ratingRepository.findByCourierId(courier.getId());
                    double avg = ratings.stream()
                            .filter(r -> r.getRating() != null)
                            .mapToInt(CourierRating::getRating)
                            .average().orElse(0.0);

                    long completedRoutes = routeSheetRepository.findAll().stream()
                            .filter(r -> r.getCourier() != null
                                    && r.getCourier().getId().equals(courier.getId()))
                            .filter(r -> r.getStatus() != null
                                    && "Завершён".equals(r.getStatus().getName()))
                            .count();

                    long totalDeliveries = routeSheetRepository.findAll().stream()
                            .filter(r -> r.getCourier() != null
                                    && r.getCourier().getId().equals(courier.getId()))
                            .flatMap(r -> routePointRepository
                                    .findByRouteIdOrderBySequenceNumber(r.getId()).stream())
                            .filter(p -> p.getStatus() != null
                                    && "Посещена".equals(p.getStatus().getName()))
                            .count();

                    return new CourierRatingResponse(
                            courier.getId(),
                            courier.getFullName(),
                            courier.getPhone(),           // ← новое
                            courier.getEmail(),           // ← новое
                            courier.getStatus() != null ? courier.getStatus().getName() : null,
                            Math.round(avg * 10.0) / 10.0,
                            ratings.size(),
                            completedRoutes,              // ← новое
                            totalDeliveries               // ← новое
                    );
                })
                .sorted(Comparator.comparingDouble(CourierRatingResponse::getAverageRating).reversed())
                .toList();
    }

    // ── REPORTS ───────────────────────────────────────────────────────────

    public ReportResponse getReport(String period) {
        LocalDateTime from = switch (period) {
            case "week" -> LocalDateTime.now().minusWeeks(1);
            case "year" -> LocalDateTime.now().minusYears(1);
            default     -> LocalDateTime.now().minusMonths(1);
        };
        List<RouteSheet> routes = routeSheetRepository.findAll().stream()
                .filter(r -> r.getCreatedAt() != null && r.getCreatedAt().isAfter(from))
                .toList();
        long completed = routes.stream()
                .filter(r -> r.getStatus() != null && "Завершён".equals(r.getStatus().getName()))
                .count();
        long cancelled = routes.stream()
                .filter(r -> r.getStatus() != null && "Отменён".equals(r.getStatus().getName()))
                .count();
        double totalKm = routes.stream()
                .filter(r -> r.getActualDistanceKm() != null)
                .mapToDouble(RouteSheet::getActualDistanceKm).sum();
        long ordersDelivered = orderRepository.findAll().stream()
                .filter(o -> o.getCreatedAt() != null && o.getCreatedAt().isAfter(from))
                .filter(o -> o.getStatus() != null && "Доставлен".equals(o.getStatus().getName()))
                .count();
        return new ReportResponse(period, routes.size(), completed, cancelled,
                Math.round(totalKm * 10) / 10.0, ordersDelivered);
    }

    // ── HELPERS ───────────────────────────────────────────────────────────

    private List<RoutePoint> loadPoints(Long routeId) {
        return routePointRepository.findByRouteIdOrderBySequenceNumber(routeId);
    }

    private RouteSheet findRoute(Long id) {
        return routeSheetRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Route not found: " + id));
    }

    private long countByStatusName(DeliveryOrderRepository repo, String name) {
        return repo.findAll().stream()
                .filter(o -> o.getStatus() != null && name.equals(o.getStatus().getName()))
                .count();
    }

    private void createNotification(User user, String title, String message) {
        Notification n = new Notification();
        n.setUser(user);
        n.setTitle(title);
        n.setMessage(message);
        n.setStatusNotification(0);
        n.setCreatedAt(java.time.LocalDateTime.now());
        notificationRepository.save(n);
    }
}