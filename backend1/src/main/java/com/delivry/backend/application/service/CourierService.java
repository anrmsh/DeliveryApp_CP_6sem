package com.delivry.backend.application.service;

import com.delivry.backend.application.pattern.factory.NotificationFactory;
import com.delivry.backend.application.pattern.strategy.RoutePointStatusStrategy;
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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Service
@Transactional
public class CourierService {

    private static final Logger log = LoggerFactory.getLogger(CourierService.class);

    private final UserRepository             userRepository;
    private final RouteSheetRepository       routeSheetRepository;
    private final RoutePointRepository       routePointRepository;
    private final RouteStatusRepository      routeStatusRepository;
    private final RoutePointStatusRepository routePointStatusRepository;
    private final DeliveryStatusRepository   deliveryStatusRepository;
    private final NotificationRepository     notificationRepository;
    private final VehicleRepository          vehicleRepository;
    private final CourierRatingsRepository   ratingsRepository;
    private final NotificationFactory        notificationFactory;
    private final List<RoutePointStatusStrategy> pointStatusStrategies;

    public CourierService(
            UserRepository             userRepository,
            RouteSheetRepository       routeSheetRepository,
            RoutePointRepository       routePointRepository,
            RouteStatusRepository      routeStatusRepository,
            RoutePointStatusRepository routePointStatusRepository,
            DeliveryStatusRepository   deliveryStatusRepository,
            NotificationRepository     notificationRepository,
            VehicleRepository          vehicleRepository,
            CourierRatingsRepository   ratingsRepository,
            NotificationFactory        notificationFactory,
            List<RoutePointStatusStrategy> pointStatusStrategies
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
        this.notificationFactory       = notificationFactory;
        this.pointStatusStrategies     = pointStatusStrategies;
    }



    public CourierDashboardResponse getDashboard() {
        Long courierId = SecurityUtils.getCurrentUserId();
        log.info("event=courier_dashboard courierId={}", courierId);

        List<RouteSheet> courierRoutes = routeSheetRepository.findByCourierId(courierId);
        long totalRoutes = courierRoutes.size();
        long completedRoutes = courierRoutes.stream()
                .filter(r -> r.getStatus() != null && "Завершён".equals(r.getStatus().getName()))
                .count();
        long activeRoutes = courierRoutes.stream()
                .filter(r -> r.getStatus() != null && "Активен".equals(r.getStatus().getName()))
                .count();

        double totalKm = courierRoutes.stream()
                .filter(r -> r.getActualDistanceKm() != null)
                .mapToDouble(RouteSheet::getActualDistanceKm).sum();

        long unreadNotifications = notificationRepository.countByUserIdAndStatusNotification(courierId, 0);

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



    public CourierRouteResponse getCurrentRoute() {
        Long courierId = SecurityUtils.getCurrentUserId();
        log.info("event=courier_current_route courierId={}", courierId);

        RouteSheet route = routeSheetRepository.findByCourierIdAndStatusName(courierId, "Активен").stream()
                .findFirst()
                .orElse(null);

        if (route == null) return null;

        List<RoutePoint> points = routePointRepository
                .findByRouteIdOrderBySequenceNumber(route.getId());

        return CourierRouteResponse.from(route, points);
    }



    public CourierRouteResponse updatePointStatus(Long pointId, UpdatePointStatusRequest request) {
        Long courierId = SecurityUtils.getCurrentUserId();
        RoutePoint point = routePointRepository.findById(pointId)
                .orElseThrow(() -> new IllegalArgumentException("Point not found: " + pointId));

        if (point.getRoute() == null || point.getRoute().getCourier() == null
                || !courierId.equals(point.getRoute().getCourier().getId())) {
            throw new IllegalStateException("Точка маршрута не принадлежит текущему курьеру");
        }

        RoutePointStatus newStatus = routePointStatusRepository.findByName(request.getStatus())
                .orElseThrow(() -> new IllegalArgumentException("Status not found: " + request.getStatus()));

        point.setStatus(newStatus);
        log.info("event=route_point_status_updated courierId={} pointId={} status={}",
                courierId, pointId, request.getStatus());

        pointStatusStrategies.stream()
                .filter(strategy -> strategy.supports(request.getStatus()))
                .findFirst()
                .ifPresent(strategy -> strategy.apply(point));

        routePointRepository.save(point);

        RouteSheet route = point.getRoute();
        List<RoutePoint> points = routePointRepository.findByRouteIdOrderBySequenceNumber(route.getId());
        return CourierRouteResponse.from(route, points);
    }



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
        log.info("event=route_completed courierId={} routeId={} actualDistanceKm={}",
                courierId, routeId, request.getActualDistanceKm());


        if (route.getVehicle() != null) {
            route.getVehicle().getStatus().setName("Доступен");
            vehicleRepository.save(route.getVehicle());
        }


        User courier = userRepository.findById(courierId).orElseThrow();
        createNotification(courier, "Маршрут #" + routeId + " завершён",
                "Вы успешно завершили маршрут. Пробег: " +
                        (request.getActualDistanceKm() != null ? request.getActualDistanceKm() + " км" : "—"));

        List<RoutePoint> points = routePointRepository.findByRouteIdOrderBySequenceNumber(routeId);
        return CourierRouteResponse.from(route, points);
    }



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
        Long courierId = SecurityUtils.getCurrentUserId();
        notificationRepository.findByIdAndUserId(id, courierId).ifPresent(n -> {
            n.setStatusNotification(1);
            notificationRepository.save(n);
            log.info("event=courier_notification_read courierId={} notificationId={}", courierId, id);
        });
    }

    public void markAllNotificationsRead() {
        Long courierId = SecurityUtils.getCurrentUserId();
        notificationRepository.markAllReadByUserId(courierId);
        log.info("event=courier_notifications_read_all courierId={}", courierId);
    }



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



    public CourierProfileResponse getProfile() {
        Long courierId = SecurityUtils.getCurrentUserId();
        User user = userRepository.findById(courierId)
                .orElseThrow(() -> new IllegalStateException("User not found"));
        List<CourierRating> ratings = ratingsRepository.findByCourierId(courierId);
        double avg = ratings.stream().filter(r -> r.getRating() != null)
                .mapToInt(CourierRating::getRating).average().orElse(0.0);
        return CourierProfileResponse.from(user, Math.round(avg * 10.0) / 10.0, ratings.size());
    }



    private void createNotification(User user, String title, String message) {
        Notification n = new Notification();
        n = notificationFactory.create(user, title, message);
        notificationRepository.save(n);
        log.info("event=notification_created userId={} title={}", user.getId(), title);
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

        if (route.getActualStart() == null) {
            route.setActualStart(LocalDateTime.now());
            routeSheetRepository.save(route);
            log.info("event=route_started courierId={} routeId={}", courierId, routeId);

            User courier = userRepository.findById(courierId).orElseThrow();
            createNotification(courier, "Маршрут #" + routeId + " начат",
                    "Вы взяли маршрут в работу. Удачи!");
        }

        List<RoutePoint> points = routePointRepository.findByRouteIdOrderBySequenceNumber(routeId);
        return CourierRouteResponse.from(route, points);
    }
}
