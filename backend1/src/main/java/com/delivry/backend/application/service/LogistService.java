package com.delivry.backend.application.service;

import com.delivry.backend.application.pattern.factory.NotificationFactory;
import com.delivry.backend.domain.entity.*;
import com.delivry.backend.domain.enums.DeliveryStatus;
import com.delivry.backend.domain.enums.RouteStatus;
import com.delivry.backend.domain.repository.*;
import com.delivry.backend.infrastructure.security.SecurityUtils;
import com.delivry.backend.request.logist.UpdateRouteStatusRequest;
import com.delivry.backend.response.client.NotificationResponse;
import com.delivry.backend.response.logist.*;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class LogistService {

    private static final Logger log = LoggerFactory.getLogger(LogistService.class);

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
    private final NotificationFactory        notificationFactory;


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
            NotificationRepository notificationRepository,
            NotificationFactory notificationFactory
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
        this.notificationFactory = notificationFactory;
    }



    public DashboardResponse getDashboard() {
        log.info("event=logist_dashboard userId={}", SecurityUtils.getCurrentUserId());
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


    public List<RouteSheetResponse> autoplan() {
        Long userId = SecurityUtils.getCurrentUserId();
        log.info("event=autoplan_started userId={}", userId);
        List<RouteSheet> routes = planningService.planRoutes();
        log.info("event=autoplan_completed userId={} routesCreated={}", userId, routes.size());
        return routes.stream()
                .map(r -> RouteSheetResponse.from(r, loadPoints(r.getId())))
                .toList();
    }



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
        log.info("event=route_approved routeId={} logistId={} courierId={}",
                id, logistId, route.getCourier() != null ? route.getCourier().getId() : null);


        if (route.getVehicle() != null) {
            route.getVehicle().getStatus().setName("В рейсе");
            vehicleRepository.save(route.getVehicle());
        }

        routeSheetRepository.save(route);


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


    public RouteSheetResponse rejectRoute(Long id) {
        RouteSheet route = findRoute(id);

        RouteStatus cancelled = routeStatusRepository.findByName("Отменён")
                .orElseThrow();
        route.setStatus(cancelled);
        routeSheetRepository.save(route);


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
        Notification n = notificationFactory.create(user, title, message);
        notificationRepository.save(n);
        log.info("event=notification_created userId={} title={}", user.getId(), title);
    }



    public List<CourierRatingDetailResponse> getCourierRatingDetails(Long courierId) {

        return ratingRepository
                .findAll()
                .stream()
                .filter(r -> r.getCourier() != null && r.getCourier().getId().equals(courierId))
                .sorted(Comparator.comparing(CourierRating::getCreatedAt).reversed())
                .map(CourierRatingDetailResponse::from)
                .toList();
    }

    // Уведомления для логиста
    public List<NotificationResponse> getNotifications() {
        Long userId = SecurityUtils.getCurrentUserId();
        return notificationRepository
                .findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(NotificationResponse::from)
                .toList();
    }

    public void markNotificationRead(Long id) {
        Long userId = SecurityUtils.getCurrentUserId();
        notificationRepository.findByIdAndUserId(id, userId).ifPresent(n -> {
            n.setStatusNotification(1);
            notificationRepository.save(n);
            log.info("event=logist_notification_read userId={} notificationId={}", userId, id);
        });
    }

    public void markAllNotificationsRead() {
        Long userId = SecurityUtils.getCurrentUserId();
        notificationRepository.markAllReadByUserId(userId);
        log.info("event=logist_notifications_read_all userId={}", userId);
    }
}
