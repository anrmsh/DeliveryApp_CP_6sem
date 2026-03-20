package com.delivry.backend.application.service;

import com.delivry.backend.domain.entity.*;
import com.delivry.backend.domain.enums.DeliveryStatus;
import com.delivry.backend.domain.enums.RoutePointStatus;
import com.delivry.backend.domain.enums.RouteStatus;
import com.delivry.backend.domain.repository.*;
import com.delivry.backend.infrastructure.security.SecurityUtils;
import com.delivry.backend.request.logist.*;
import com.delivry.backend.response.logist.*;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class LogistService {

    private final DeliveryOrderRepository  orderRepository;
    private final RouteSheetRepository     routeSheetRepository;
    private final RoutePointRepository     routePointRepository;
    private final VehicleRepository        vehicleRepository;
    private final UserRepository           userRepository;
    private final CourierRatingsRepository ratingRepository;
    private final DeliveryStatusRepository deliveryStatusRepository;
    private final RouteStatusRepository    routeStatusRepository;
    private final RoutePointStatusRepository routePointStatusRepository;

    public LogistService(
            DeliveryOrderRepository   orderRepository,
            RouteSheetRepository      routeSheetRepository,
            RoutePointRepository      routePointRepository,
            VehicleRepository         vehicleRepository,
            UserRepository            userRepository,
            CourierRatingsRepository  ratingRepository,
            DeliveryStatusRepository  deliveryStatusRepository,
            RouteStatusRepository     routeStatusRepository,
            RoutePointStatusRepository routePointStatusRepository
    ) {
        this.orderRepository            = orderRepository;
        this.routeSheetRepository       = routeSheetRepository;
        this.routePointRepository       = routePointRepository;
        this.vehicleRepository          = vehicleRepository;
        this.userRepository             = userRepository;
        this.ratingRepository           = ratingRepository;
        this.deliveryStatusRepository   = deliveryStatusRepository;
        this.routeStatusRepository      = routeStatusRepository;
        this.routePointStatusRepository = routePointStatusRepository;
    }

    // ── DASHBOARD ─────────────────────────────────────────────────────────

    public DashboardResponse getDashboard() {
        long totalOrders    = orderRepository.count();
        long pendingOrders  = orderRepository.countByStatusName("Создан");
        long activeRoutes   = routeSheetRepository.countByStatusName("Активен");
        long totalVehicles  = vehicleRepository.count();
        long freeVehicles   = vehicleRepository.countByStatusName("Доступен");
        long totalCouriers  = userRepository.countByRoleName("COURIER");

        return new DashboardResponse(
                totalOrders, pendingOrders, activeRoutes,
                totalVehicles, freeVehicles, totalCouriers
        );
    }

    // ── PENDING ORDERS ────────────────────────────────────────────────────

    public List<OrderSummaryResponse> getPendingOrders() {
        return orderRepository.findAll()
                .stream()
                .filter(o -> o.getStatus() != null && "Создан".equals(o.getStatus().getName()))
                .map(OrderSummaryResponse::from)
                .toList();
    }

    // ── ROUTES ────────────────────────────────────────────────────────────

    public List<RouteSheetResponse> getRoutes() {
        return routeSheetRepository.findAll()
                .stream()
                .sorted(Comparator.comparing(RouteSheet::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(RouteSheetResponse::from)
                .toList();
    }

    public RouteSheetResponse getRoute(Long id) {
        RouteSheet route = findRoute(id);
        return RouteSheetResponse.from(route);
    }

    public RouteSheetResponse createRoute(CreateRouteRequest request) {
        Long logistId = SecurityUtils.getCurrentUserId();

        User courier = userRepository.findById(request.getCourierId())
                .orElseThrow(() -> new IllegalArgumentException("Courier not found"));

        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found"));

        RouteStatus plannedStatus = routeStatusRepository.findByName("Запланирован")
                .orElseThrow(() -> new IllegalStateException("Status 'Запланирован' not found"));

        User logist = userRepository.findById(logistId)
                .orElseThrow(() -> new IllegalStateException("Logist not found"));

        RouteSheet route = new RouteSheet();
        route.setCourier(courier);
        route.setLogistician(logist);
        route.setVehicle(vehicle);
        route.setStatus(plannedStatus);
        route.setPlannedStart(request.getPlannedStart());
        route.setPlannedEnd(request.getPlannedEnd());
        routeSheetRepository.save(route);

        // Assign orders to route as route points
        if (request.getOrderIds() != null && !request.getOrderIds().isEmpty()) {
            addOrdersToRoute(route, request.getOrderIds());
        }

        // Mark vehicle as in use
        vehicle.getStatus().setName("В рейсе");
        vehicleRepository.save(vehicle);

        return RouteSheetResponse.from(route);
    }

    public RouteSheetResponse updateRouteStatus(Long id, UpdateRouteStatusRequest request) {
        RouteSheet route = findRoute(id);

        RouteStatus status = routeStatusRepository.findByName(request.getStatus())
                .orElseThrow(() -> new IllegalArgumentException("Route status not found: " + request.getStatus()));

        route.setStatus(status);
        routeSheetRepository.save(route);

        // If route completed — free vehicle
        if ("Завершён".equals(request.getStatus()) || "Отменён".equals(request.getStatus())) {
            Vehicle v = route.getVehicle();
            if (v != null) {
                v.getStatus().setName("Доступен");
                vehicleRepository.save(v);
            }
        }

        return RouteSheetResponse.from(route);
    }

    public RouteSheetResponse assignOrderToRoute(Long routeId, Long orderId) {
        RouteSheet route = findRoute(routeId);
        addOrdersToRoute(route, List.of(orderId));
        return RouteSheetResponse.from(routeSheetRepository.findById(routeId).orElseThrow());
    }

    // ── ROUTE OPTIMIZATION (Nearest Neighbour TSP) ────────────────────────
    /**
     * Reorders route points using the Nearest Neighbour heuristic.
     * Coordinates fetched from route_point lat/lon.
     * If lat/lon missing — order stays as-is.
     */
    public RouteSheetResponse optimizeRoute(Long id) {
        RouteSheet route = findRoute(id);
        List<RoutePoint> points = routePointRepository.findByRouteIdOrderBySequenceNumber(route.getId());

        if (points.size() < 2) return RouteSheetResponse.from(route);

        // Filter points with valid coords
        List<RoutePoint> withCoords = points.stream()
                .filter(p -> p.getLatitude() != null && p.getLongitude() != null)
                .collect(Collectors.toList());

        if (withCoords.size() < 2) return RouteSheetResponse.from(route);

        // Nearest Neighbour starting from index 0
        List<RoutePoint> ordered = new ArrayList<>();
        Set<Long>        visited = new HashSet<>();
        RoutePoint       current = withCoords.get(0);
        ordered.add(current);
        visited.add(current.getId());

        while (ordered.size() < withCoords.size()) {
            RoutePoint nearest = null;
            double minDist = Double.MAX_VALUE;
            for (RoutePoint p : withCoords) {
                if (visited.contains(p.getId())) continue;
                double d = haversine(
                        current.getLatitude().doubleValue(), current.getLongitude().doubleValue(),
                        p.getLatitude().doubleValue(),       p.getLongitude().doubleValue()
                );
                if (d < minDist) { minDist = d; nearest = p; }
            }
            if (nearest == null) break;
            ordered.add(nearest);
            visited.add(nearest.getId());
            current = nearest;
        }

        // Update sequence numbers
        for (int i = 0; i < ordered.size(); i++) {
            ordered.get(i).setSequenceNumber(i + 1);
            routePointRepository.save(ordered.get(i));
        }

        return RouteSheetResponse.from(routeSheetRepository.findById(id).orElseThrow());
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
        return userRepository.findAll()
                .stream()
                .filter(u -> u.getRole() != null && "COURIER".equals(u.getRole().getName()))
                .map(CourierResponse::from)
                .toList();
    }

    public List<CourierRatingResponse> getCourierRatings() {
        // Group ratings by courier, compute average
        List<User> couriers = userRepository.findAll()
                .stream()
                .filter(u -> u.getRole() != null && "COURIER".equals(u.getRole().getName()))
                .toList();

        return couriers.stream().map(courier -> {
                    List<CourierRating> ratings = ratingRepository.findByCourierId(courier.getId());
                    double avg = ratings.stream()
                            .filter(r -> r.getRating() != null)
                            .mapToInt(CourierRating::getRating)
                            .average()
                            .orElse(0.0);
                    int total = ratings.size();
                    return new CourierRatingResponse(
                            courier.getId(),
                            courier.getFullName(),
                            Math.round(avg * 10.0) / 10.0,
                            total
                    );
                })
                .sorted(Comparator.comparingDouble(CourierRatingResponse::getAverageRating).reversed())
                .toList();
    }

    // ── REPORTS ───────────────────────────────────────────────────────────

    public ReportResponse getReport(String period) {
        LocalDateTime from = switch (period) {
            case "week"  -> LocalDateTime.now().minusWeeks(1);
            case "year"  -> LocalDateTime.now().minusYears(1);
            default      -> LocalDateTime.now().minusMonths(1); // "month"
        };

        List<RouteSheet> routes = routeSheetRepository.findAll()
                .stream()
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
                .mapToDouble(r -> r.getActualDistanceKm().doubleValue())
                .sum();

        long ordersDelivered = orderRepository.findAll()
                .stream()
                .filter(o -> o.getCreatedAt() != null && o.getCreatedAt().isAfter(from))
                .filter(o -> o.getStatus() != null && "Доставлен".equals(o.getStatus().getName()))
                .count();

        return new ReportResponse(
                period,
                routes.size(),
                completed,
                cancelled,
                Math.round(totalKm * 10) / 10.0,
                ordersDelivered
        );
    }

    // ── HELPERS ───────────────────────────────────────────────────────────

    private RouteSheet findRoute(Long id) {
        return routeSheetRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Route not found: " + id));
    }

    private void addOrdersToRoute(RouteSheet route, List<Long> orderIds) {
        DeliveryStatus assignedStatus = deliveryStatusRepository.findByName("Назначен")
                .orElseThrow(() -> new IllegalStateException("Status 'Назначен' not found"));

        RoutePointStatus waitingStatus = routePointStatusRepository.findByName("Ожидается")
                .orElseThrow(() -> new IllegalStateException("RoutePointStatus 'Ожидается' not found"));

        int seq = routePointRepository.findByRouteIdOrderBySequenceNumber(route.getId()).size() + 1;

        for (Long orderId : orderIds) {
            DeliveryOrder order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));

            // Update order status
            order.setStatus(assignedStatus);
            orderRepository.save(order);

            // Create route point
            RoutePoint point = new RoutePoint();
            point.setRoute(route);
            point.setOrder(order);
            point.setSequenceNumber(seq++);
            point.setAddress(order.getDeliveryAddress());
            point.setLatitude(order.getLatitude());
            point.setLongitude(order.getLongitude());
            point.setStatus(waitingStatus);
            routePointRepository.save(point);
        }
    }

    private static double haversine(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}