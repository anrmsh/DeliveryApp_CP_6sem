package com.delivry.backend.application.service;

import com.delivry.backend.domain.entity.*;
import com.delivry.backend.domain.enums.DeliveryStatus;
import com.delivry.backend.domain.enums.RoutePointStatus;
import com.delivry.backend.domain.enums.RouteStatus;
import com.delivry.backend.domain.repository.*;
import com.delivry.backend.infrastructure.security.SecurityUtils;
import com.delivry.backend.request.courier.CompleteRouteRequest;

import com.delivry.backend.request.courier.UpdatePointStatusRequest;
import com.delivry.backend.response.courier.*;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Service
@Transactional
public class CourierService {

    private final UserRepository             userRepository;
    private final RouteSheetRepository       routeSheetRepository;
    private final RoutePointRepository       routePointRepository;
    private final RouteStatusRepository      routeStatusRepository;
    private final RoutePointStatusRepository routePointStatusRepository;
    private final DeliveryStatusRepository   deliveryStatusRepository;
    private final NotificationRepository     notificationRepository;
    private final VehicleRepository          vehicleRepository;
    private final CourierRatingsRepository   ratingsRepository;

    public CourierService(
            UserRepository             userRepository,
            RouteSheetRepository       routeSheetRepository,
            RoutePointRepository       routePointRepository,
            RouteStatusRepository      routeStatusRepository,
            RoutePointStatusRepository routePointStatusRepository,
            DeliveryStatusRepository   deliveryStatusRepository,
            NotificationRepository     notificationRepository,
            VehicleRepository          vehicleRepository,
            CourierRatingsRepository   ratingsRepository
    ) {
        this.userRepository             = userRepository;
        this.routeSheetRepository       = routeSheetRepository;
        this.routePointRepository       = routePointRepository;
        this.routeStatusRepository      = routeStatusRepository;
        this.routePointStatusRepository = routePointStatusRepository;
        this.deliveryStatusRepository   = deliveryStatusRepository;
        this.notificationRepository     = notificationRepository;
        this.vehicleRepository          = vehicleRepository;
        this.ratingsRepository          = ratingsRepository;
    }

    // ── DASHBOARD ─────────────────────────────────────────────────────────

    public CourierDashboardResponse getDashboard() {
        Long courierId = SecurityUtils.getCurrentUserId();

        long totalRoutes     = routeSheetRepository.findAll().stream()
                .filter(r -> r.getCourier() != null && r.getCourier().getId().equals(courierId))
                .count();
        long completedRoutes = routeSheetRepository.findAll().stream()
                .filter(r -> r.getCourier() != null && r.getCourier().getId().equals(courierId))
                .filter(r -> r.getStatus() != null && "Завершён".equals(r.getStatus().getName()))
                .count();
        long activeRoutes    = routeSheetRepository.findAll().stream()
                .filter(r -> r.getCourier() != null && r.getCourier().getId().equals(courierId))
                .filter(r -> r.getStatus() != null && "Активен".equals(r.getStatus().getName()))
                .count();

        double totalKm = routeSheetRepository.findAll().stream()
                .filter(r -> r.getCourier() != null && r.getCourier().getId().equals(courierId))
                .filter(r -> r.getActualDistanceKm() != null)
                .mapToDouble(RouteSheet::getActualDistanceKm).sum();

        long unreadNotifications = notificationRepository.findAll().stream()
                .filter(n -> n.getUser() != null && n.getUser().getId().equals(courierId))
                .filter(n -> n.getStatusNotification() != null && n.getStatusNotification() == 0)
                .count();

        List<CourierRating> ratings = ratingsRepository.findByCourierId(courierId);
        double avgRating = ratings.stream()
                .filter(r -> r.getRating() != null)
                .mapToInt(CourierRating::getRating)
                .average().orElse(0.0);

        return new CourierDashboardResponse(
                totalRoutes, completedRoutes, activeRoutes,
                Math.round(totalKm * 10) / 10.0,
                unreadNotifications,
                Math.round(avgRating * 10.0) / 10.0,
                ratings.size()
        );
    }

    // ── CURRENT ROUTE ─────────────────────────────────────────────────────

    public CourierRouteResponse getCurrentRoute() {
        Long courierId = SecurityUtils.getCurrentUserId();

        RouteSheet route = routeSheetRepository.findAll().stream()
                .filter(r -> r.getCourier() != null && r.getCourier().getId().equals(courierId))
                .filter(r -> r.getStatus() != null && "Активен".equals(r.getStatus().getName()))
                .findFirst()
                .orElse(null);

        if (route == null) return null;

        List<RoutePoint> points = routePointRepository
                .findByRouteIdOrderBySequenceNumber(route.getId());

        return CourierRouteResponse.from(route, points);
    }

    // ── UPDATE POINT STATUS ────────────────────────────────────────────────

    public CourierRouteResponse updatePointStatus(Long pointId, UpdatePointStatusRequest request) {
        RoutePoint point = routePointRepository.findById(pointId)
                .orElseThrow(() -> new IllegalArgumentException("Point not found: " + pointId));

        RoutePointStatus newStatus = routePointStatusRepository.findByName(request.getStatus())
                .orElseThrow(() -> new IllegalArgumentException("Status not found: " + request.getStatus()));

        point.setStatus(newStatus);

        if ("Посещена".equals(request.getStatus())) {
            point.setActualArrival(LocalDateTime.now());

            // Update delivery order status
            if (point.getOrder() != null) {
                DeliveryStatus delivered = deliveryStatusRepository.findByName("Доставлен")
                        .orElseThrow();
                point.getOrder().setStatus(delivered);

                // Notify client
                DeliveryOrder order = point.getOrder();
                if (order.getClient() != null && order.getClient().getUser() != null) {
                    createNotification(
                            order.getClient().getUser(),
                            "Заказ #" + order.getId() + " доставлен",
                            "Ваш заказ доставлен по адресу: " + order.getDeliveryAddress()
                    );
                }
            }
        }

        if ("Пропущена".equals(request.getStatus())) {
            if (point.getOrder() != null) {
                // Notify client about skip
                DeliveryOrder order = point.getOrder();
                if (order.getClient() != null && order.getClient().getUser() != null) {
                    createNotification(
                            order.getClient().getUser(),
                            "Доставка заказа #" + order.getId() + " не состоялась",
                            "Курьер не смог доставить заказ по адресу: " + order.getDeliveryAddress() + ". Свяжитесь с поддержкой."
                    );
                }
            }
        }

        routePointRepository.save(point);

        RouteSheet route = point.getRoute();
        List<RoutePoint> points = routePointRepository.findByRouteIdOrderBySequenceNumber(route.getId());
        return CourierRouteResponse.from(route, points);
    }

    // ── COMPLETE ROUTE ────────────────────────────────────────────────────

    public CourierRouteResponse completeRoute(Long routeId, CompleteRouteRequest request) {
        Long courierId = SecurityUtils.getCurrentUserId();

        RouteSheet route = routeSheetRepository.findById(routeId)
                .orElseThrow(() -> new IllegalArgumentException("Route not found: " + routeId));

        if (!route.getCourier().getId().equals(courierId)) {
            throw new IllegalStateException("Это не ваш маршрут");
        }

        RouteStatus completed = routeStatusRepository.findByName("Завершён")
                .orElseThrow(() -> new IllegalStateException("Status not found"));

        route.setStatus(completed);

        if (request.getActualDistanceKm() != null) {
            route.setActualDistanceKm(request.getActualDistanceKm());
        }

        routeSheetRepository.save(route);

        // Free vehicle
        if (route.getVehicle() != null) {
            route.getVehicle().getStatus().setName("Доступен");
            vehicleRepository.save(route.getVehicle());
        }

        // Self-notification
        User courier = userRepository.findById(courierId).orElseThrow();
        createNotification(courier, "Маршрут #" + routeId + " завершён",
                "Вы успешно завершили маршрут. Пробег: " +
                        (request.getActualDistanceKm() != null ? request.getActualDistanceKm() + " км" : "—"));

        List<RoutePoint> points = routePointRepository.findByRouteIdOrderBySequenceNumber(routeId);
        return CourierRouteResponse.from(route, points);
    }

    // ── NOTIFICATIONS ─────────────────────────────────────────────────────

    public List<CourierNotificationResponse> getNotifications() {
        Long courierId = SecurityUtils.getCurrentUserId();
        return notificationRepository.findAll().stream()
                .filter(n -> n.getUser() != null && n.getUser().getId().equals(courierId))
                .sorted(Comparator.comparing(Notification::getCreatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .map(CourierNotificationResponse::from)
                .toList();
    }

    public void markNotificationRead(Long id) {
        notificationRepository.findById(id).ifPresent(n -> {
            n.setStatusNotification(1);
            notificationRepository.save(n);
        });
    }

    public void markAllNotificationsRead() {
        Long courierId = SecurityUtils.getCurrentUserId();
        notificationRepository.findAll().stream()
                .filter(n -> n.getUser() != null && n.getUser().getId().equals(courierId))
                .filter(n -> n.getStatusNotification() != null && n.getStatusNotification() == 0)
                .forEach(n -> {
                    n.setStatusNotification(1);
                    notificationRepository.save(n);
                });
    }

    // ── HISTORY ───────────────────────────────────────────────────────────

    public List<CourierRouteHistoryResponse> getRouteHistory() {
        Long courierId = SecurityUtils.getCurrentUserId();
        return routeSheetRepository.findAll().stream()
                .filter(r -> r.getCourier() != null && r.getCourier().getId().equals(courierId))
                .filter(r -> r.getStatus() != null && "Завершён".equals(r.getStatus().getName()))
                .sorted(Comparator.comparing(RouteSheet::getCreatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .map(r -> CourierRouteHistoryResponse.from(r,
                        routePointRepository.findByRouteIdOrderBySequenceNumber(r.getId())))
                .toList();
    }

    // ── PROFILE ───────────────────────────────────────────────────────────

    public CourierProfileResponse getProfile() {
        Long courierId = SecurityUtils.getCurrentUserId();
        User user = userRepository.findById(courierId)
                .orElseThrow(() -> new IllegalStateException("User not found"));
        List<CourierRating> ratings = ratingsRepository.findByCourierId(courierId);
        double avg = ratings.stream().filter(r -> r.getRating() != null)
                .mapToInt(CourierRating::getRating).average().orElse(0.0);
        return CourierProfileResponse.from(user, Math.round(avg * 10.0) / 10.0, ratings.size());
    }

    // ── HELPERS ───────────────────────────────────────────────────────────

    private void createNotification(User user, String title, String message) {
        Notification n = new Notification();
        n.setUser(user);
        n.setTitle(title);
        n.setMessage(message);
        n.setStatusNotification(0);
        n.setCreatedAt(LocalDateTime.now());
        notificationRepository.save(n);
    }

    public CourierRouteResponse startRoute(Long routeId) {
        Long courierId = SecurityUtils.getCurrentUserId();
        RouteSheet route = routeSheetRepository.findById(routeId)
                .orElseThrow(() -> new IllegalArgumentException("Route not found"));

        if (!route.getCourier().getId().equals(courierId)) {
            throw new IllegalStateException("Это не ваш маршрут");
        }
        if (!"Активен".equals(route.getStatus().getName())) {
            throw new IllegalStateException("Маршрут уже начат или не активен");
        }

        // Фиксируем фактическое время начала
        route.setPlannedStart(LocalDateTime.now()); // или добавь поле actualStart
        routeSheetRepository.save(route);

        // Уведомление самому себе
        User courier = userRepository.findById(courierId).orElseThrow();
        createNotification(courier, "Маршрут #" + routeId + " начат",
                "Вы взяли маршрут в работу. Удачи!");

        List<RoutePoint> points = routePointRepository.findByRouteIdOrderBySequenceNumber(routeId);
        return CourierRouteResponse.from(route, points);
    }
}