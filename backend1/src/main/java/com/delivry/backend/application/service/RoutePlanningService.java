package com.delivry.backend.application.service;

import com.delivry.backend.domain.entity.*;
import com.delivry.backend.domain.enums.DeliveryStatus;
import com.delivry.backend.domain.enums.RoutePointStatus;
import com.delivry.backend.domain.enums.RouteStatus;
import com.delivry.backend.domain.repository.*;
import com.delivry.backend.response.logist.RouteSheetResponse;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;


@Service
@Transactional
public class RoutePlanningService {

    private static final double DEFAULT_WEIGHT_KG = 50.0; // вес заказа по умолчанию
    private static final int    MAX_KMEANS_ITER   = 100;

    private final DeliveryOrderRepository    orderRepository;
    private final RouteSheetRepository       routeSheetRepository;
    private final RoutePointRepository       routePointRepository;
    private final VehicleRepository          vehicleRepository;
    private final UserRepository             userRepository;
    private final DeliveryStatusRepository   deliveryStatusRepository;
    private final RouteStatusRepository      routeStatusRepository;
    private final RoutePointStatusRepository routePointStatusRepository;

    public RoutePlanningService(
            DeliveryOrderRepository    orderRepository,
            RouteSheetRepository       routeSheetRepository,
            RoutePointRepository       routePointRepository,
            VehicleRepository          vehicleRepository,
            UserRepository             userRepository,
            DeliveryStatusRepository   deliveryStatusRepository,
            RouteStatusRepository      routeStatusRepository,
            RoutePointStatusRepository routePointStatusRepository
    ) {
        this.orderRepository            = orderRepository;
        this.routeSheetRepository       = routeSheetRepository;
        this.routePointRepository       = routePointRepository;
        this.vehicleRepository          = vehicleRepository;
        this.userRepository             = userRepository;
        this.deliveryStatusRepository   = deliveryStatusRepository;
        this.routeStatusRepository      = routeStatusRepository;
        this.routePointStatusRepository = routePointStatusRepository;
    }


    public List<RouteSheet> planRoutes() {

        List<DeliveryOrder> pending = orderRepository.findAll().stream()
                .filter(o -> o.getStatus() != null && "Создан".equals(o.getStatus().getName()))
                .filter(o -> o.getLatitude() != null && o.getLongitude() != null)
                .sorted(Comparator.comparing(DeliveryOrder::getRequestedTime,
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .collect(Collectors.toList());

        if (pending.isEmpty()) return List.of();


        List<Vehicle> freeVehicles = vehicleRepository.findAll().stream()
                .filter(v -> v.getStatus() != null && "Доступен".equals(v.getStatus().getName()))
                .sorted(Comparator.comparing(Vehicle::getCapacityKg,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());

        if (freeVehicles.isEmpty()) return List.of();


        List<User> freeCouriers = userRepository.findAll().stream()
                .filter(u -> u.getRole() != null && "COURIER".equals(u.getRole().getName()))
                .filter(u -> u.getStatus() != null && "Активен".equals(u.getStatus().getName()))
                .filter(u -> !hasPendingRoute(u.getId()))
                .collect(Collectors.toList());

        if (freeCouriers.isEmpty()) return List.of();


        int routeCount = Math.min(freeVehicles.size(), freeCouriers.size());
        routeCount = Math.min(routeCount, (int) Math.ceil((double) pending.size() / 3));
        routeCount = Math.max(routeCount, 1);


        List<List<DeliveryOrder>> clusters = clusterOrders(pending, routeCount);

        RouteStatus plannedStatus = routeStatusRepository.findByName("Запланирован")
                .orElseThrow(() -> new IllegalStateException("Status 'Запланирован' not found"));
        DeliveryStatus assignedStatus = deliveryStatusRepository.findByName("Назначен")
                .orElseThrow(() -> new IllegalStateException("Status 'Назначен' not found"));
        RoutePointStatus waitingStatus = routePointStatusRepository.findByName("Ожидается")
                .orElseThrow(() -> new IllegalStateException("RoutePointStatus 'Ожидается' not found"));

        List<RouteSheet> created = new ArrayList<>();

        for (int i = 0; i < clusters.size() && i < routeCount; i++) {
            List<DeliveryOrder> cluster = clusters.get(i);
            if (cluster.isEmpty()) continue;

            Vehicle vehicle = freeVehicles.get(i % freeVehicles.size());
            User    courier = freeCouriers.get(i % freeCouriers.size());


            LocalDateTime earliest = cluster.stream()
                    .map(DeliveryOrder::getRequestedTime)
                    .filter(Objects::nonNull)
                    .min(Comparator.naturalOrder())
                    .orElse(LocalDateTime.now().plusHours(1));

            RouteSheet route = new RouteSheet();
            route.setCourier(courier);
            route.setVehicle(vehicle);
            route.setStatus(plannedStatus);
            route.setPlannedStart(LocalDateTime.now().plusMinutes(30));
            route.setPlannedEnd(earliest.plusHours(4));
            routeSheetRepository.save(route);


            List<DeliveryOrder> sorted = nearestNeighbour(cluster);

            int seq = 1;
            for (DeliveryOrder order : sorted) {

                order.setStatus(assignedStatus);
                orderRepository.save(order);

                RoutePoint point = new RoutePoint();
                point.setRoute(route);
                point.setOrder(order);
                point.setSequenceNumber(seq++);
                point.setAddress(order.getDeliveryAddress());
                point.setLatitude(order.getLatitude());
                point.setLongitude(order.getLongitude());
                point.setStatus(waitingStatus);
                point.setPlannedArrival(route.getPlannedStart().plusMinutes(30L * (seq - 1)));
                routePointRepository.save(point);
            }

            created.add(route);
        }

        return created;
    }

    // ── K-MEANS CLUSTERING ────

    private List<List<DeliveryOrder>> clusterOrders(List<DeliveryOrder> orders, int k) {
        if (orders.size() <= k) {
            List<List<DeliveryOrder>> single = new ArrayList<>();
            for (DeliveryOrder o : orders) {
                List<DeliveryOrder> g = new ArrayList<>();
                g.add(o);
                single.add(g);
            }
            return single;
        }

        // Init centroids — pick k evenly spaced orders
        double[][] centroids = new double[k][2];
        for (int i = 0; i < k; i++) {
            int idx = (int) ((double) i / k * orders.size());
            centroids[i][0] = orders.get(idx).getLatitude().doubleValue();
            centroids[i][1] = orders.get(idx).getLongitude().doubleValue();
        }

        int[] assignment = new int[orders.size()];

        for (int iter = 0; iter < MAX_KMEANS_ITER; iter++) {
            // Assign each order to nearest centroid
            boolean changed = false;
            for (int i = 0; i < orders.size(); i++) {
                double lat = orders.get(i).getLatitude().doubleValue();
                double lon = orders.get(i).getLongitude().doubleValue();
                int best = 0;
                double bestDist = Double.MAX_VALUE;
                for (int j = 0; j < k; j++) {
                    double d = haversine(lat, lon, centroids[j][0], centroids[j][1]);
                    if (d < bestDist) { bestDist = d; best = j; }
                }
                if (assignment[i] != best) { assignment[i] = best; changed = true; }
            }
            if (!changed) break;

            // Recompute centroids
            double[][] sums  = new double[k][2];
            int[]      counts = new int[k];
            for (int i = 0; i < orders.size(); i++) {
                int c = assignment[i];
                sums[c][0] += orders.get(i).getLatitude().doubleValue();
                sums[c][1] += orders.get(i).getLongitude().doubleValue();
                counts[c]++;
            }
            for (int j = 0; j < k; j++) {
                if (counts[j] > 0) {
                    centroids[j][0] = sums[j][0] / counts[j];
                    centroids[j][1] = sums[j][1] / counts[j];
                }
            }
        }

        List<List<DeliveryOrder>> clusters = new ArrayList<>();
        for (int j = 0; j < k; j++) clusters.add(new ArrayList<>());
        for (int i = 0; i < orders.size(); i++) clusters.get(assignment[i]).add(orders.get(i));
        return clusters;
    }

    // ── NEAREST NEIGHBOUR TSP ─────

    private List<DeliveryOrder> nearestNeighbour(List<DeliveryOrder> orders) {
        if (orders.size() <= 1) return new ArrayList<>(orders);

        // Prioritise by requestedTime (earlier deadline → higher priority)
        List<DeliveryOrder> sorted = new ArrayList<>(orders);
        sorted.sort(Comparator.comparing(DeliveryOrder::getRequestedTime,
                Comparator.nullsLast(Comparator.naturalOrder())));

        List<DeliveryOrder> result  = new ArrayList<>();
        Set<Long>           visited = new HashSet<>();

        DeliveryOrder current = sorted.get(0);
        result.add(current);
        visited.add(current.getId());

        while (result.size() < sorted.size()) {
            DeliveryOrder nearest  = null;
            double        minDist  = Double.MAX_VALUE;
            for (DeliveryOrder o : sorted) {
                if (visited.contains(o.getId())) continue;
                if (o.getLatitude() == null || o.getLongitude() == null) {
                    nearest = o; break;
                }
                if (current.getLatitude() == null) { nearest = o; break; }
                double d = haversine(
                        current.getLatitude().doubleValue(),  current.getLongitude().doubleValue(),
                        o.getLatitude().doubleValue(),        o.getLongitude().doubleValue()
                );
                if (d < minDist) { minDist = d; nearest = o; }
            }
            if (nearest == null) break;
            result.add(nearest);
            visited.add(nearest.getId());
            current = nearest;
        }
        return result;
    }

    // ── HELPERS ───

    private boolean hasPendingRoute(Long courierId) {
        return routeSheetRepository.findAll().stream()
                .filter(r -> r.getCourier() != null && r.getCourier().getId().equals(courierId))
                .anyMatch(r -> r.getStatus() != null &&
                        ("Запланирован".equals(r.getStatus().getName())
                                || "Активен".equals(r.getStatus().getName())));
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