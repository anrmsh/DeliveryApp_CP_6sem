package com.delivry.backend.application.service;

import com.delivry.backend.domain.entity.*;
import com.delivry.backend.domain.enums.DeliveryStatus;
import com.delivry.backend.domain.repository.*;
import com.delivry.backend.infrastructure.security.SecurityUtils;
import com.delivry.backend.request.client.ChangePasswordRequest;
import com.delivry.backend.request.client.CreateOrderRequest;
import com.delivry.backend.request.client.RatingRequest;
import com.delivry.backend.request.client.UpdateProfileRequest;
import com.delivry.backend.response.client.DeliveryOrderResponse;
import com.delivry.backend.response.client.DeliveryPriceResponse;
import com.delivry.backend.response.client.NotificationResponse;
import com.delivry.backend.response.client.ProfileResponse;
import jakarta.transaction.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
@Transactional
public class ClientService {

    private final UserRepository           userRepository;
    private final RouteSheetRepository     routeSheetRepository;
    private final DeliveryOrderRepository  orderRepository;
    private final CourierRatingsRepository ratingRepository;
    private final ClientRepository         clientRepository;
    private final DeliveryStatusRepository statusRepository;
    private final NotificationRepository   notificationRepository;
    private final PasswordEncoder          passwordEncoder;

    private static final double BASE_PRICE_PER_KM_CAR   = 25.0;
    private static final double BASE_PRICE_PER_KM_VAN   = 45.0;
    private static final double BASE_PRICE_PER_KM_TRUCK = 80.0;
    private static final double AVG_SPEED_KMH            = 30.0;
    private static final double RUSH_HOUR_MULTIPLIER     = 1.35;

    public ClientService(
            DeliveryOrderRepository  orderRepository,
            CourierRatingsRepository ratingRepository,
            ClientRepository         clientRepository,
            DeliveryStatusRepository statusRepository,
            UserRepository           userRepository,
            RouteSheetRepository     routeSheetRepository,
            NotificationRepository   notificationRepository,
            PasswordEncoder          passwordEncoder
    ) {
        this.orderRepository        = orderRepository;
        this.ratingRepository       = ratingRepository;
        this.clientRepository       = clientRepository;
        this.statusRepository       = statusRepository;
        this.userRepository         = userRepository;
        this.routeSheetRepository   = routeSheetRepository;
        this.notificationRepository = notificationRepository;
        this.passwordEncoder        = passwordEncoder;
    }

    // ── CREATE ORDER ──────────────────────────────────────────────────────

    public DeliveryOrderResponse createOrder(CreateOrderRequest request) {
        Client client = getCurrentClient();

        DeliveryStatus status = statusRepository
                .findByName("Создан")
                .orElseThrow(() -> new IllegalStateException("Status 'Создан' not found"));

        DeliveryOrder order = new DeliveryOrder();
        order.setClient(client);
        order.setPickupAddress(request.getPickupAddress());
        order.setDeliveryAddress(request.getDeliveryAddress());
        order.setLatitude(request.getLatitude());
        order.setLongitude(request.getLongitude());
        order.setRequestedTime(request.getRequestedTime());
        order.setStatus(status);
        orderRepository.save(order);

        createNotification(
                getCurrentUser(),
                "Заказ #" + order.getId() + " создан",
                "Ваша заявка принята. Логист назначит курьера в ближайшее время."
        );

        return DeliveryOrderResponse.from(order);
    }

    // ── MY ORDERS ─────────────────────────────────────────────────────────

    public List<DeliveryOrderResponse> getMyOrders() {
        Client client = getCurrentClient();
        return orderRepository
                .findByClientUserId(client.getUserId())
                .stream()
                .map(DeliveryOrderResponse::from)
                .toList();
    }

    // ── SINGLE ORDER ──────────────────────────────────────────────────────

    public DeliveryOrderResponse getOrder(Long id) {
        DeliveryOrder order = orderRepository
                .findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + id));
        return DeliveryOrderResponse.from(order);
    }

    // ── CALCULATE PRICE ───────────────────────────────────────────────────

    public DeliveryPriceResponse calculatePrice(CreateOrderRequest request) {
        double distanceKm;
        if (request.getDistanceKm() != null && request.getDistanceKm() > 0) {
            distanceKm = request.getDistanceKm();
        } else if (request.getLatitude() != null && request.getLongitude() != null
                && request.getDeliveryLatitude() != null && request.getDeliveryLongitude() != null) {
            distanceKm = haversineKm(
                    request.getLatitude(), request.getLongitude(),
                    request.getDeliveryLatitude(), request.getDeliveryLongitude()
            );
        } else {
            distanceKm = 10.0;
        }

        double pricePerKm = switch (
                request.getVehicleType() != null ? request.getVehicleType().toLowerCase() : "car") {
            case "van"   -> BASE_PRICE_PER_KM_VAN;
            case "truck" -> BASE_PRICE_PER_KM_TRUCK;
            default      -> BASE_PRICE_PER_KM_CAR;
        };

        double trafficMul   = isRushHour() ? RUSH_HOUR_MULTIPLIER : 1.0;
        double weatherMul   = weatherMultiplier(request.getWeatherCode());
        double baseMinutes  = (distanceKm / AVG_SPEED_KMH) * 60.0;
        int    totalMinutes = (int) Math.round(baseMinutes * trafficMul * weatherMul);
        double price        = distanceKm * pricePerKm * weatherMul;

        return new DeliveryPriceResponse(
                Math.round(price),
                totalMinutes,
                distanceKm,
                trafficMul,
                weatherMul
        );
    }

    // ── RATE COURIER ──────────────────────────────────────────────────────

    public void rateCourier(RatingRequest request) {
        Client client = getCurrentClient();

        User courier = userRepository
                .findById(request.getCourierId())
                .orElseThrow(() -> new IllegalArgumentException("Courier not found: " + request.getCourierId()));

        RouteSheet route = routeSheetRepository
                .findById(request.getRouteId())
                .orElseThrow(() -> new IllegalArgumentException("Route not found: " + request.getRouteId()));

        CourierRating rating = new CourierRating();
        rating.setCourier(courier);
        rating.setClient(client);
        rating.setRoute(route);
        rating.setRating(request.getRating());
        rating.setComment(request.getComment());
        ratingRepository.save(rating);
    }

    // ── NOTIFICATIONS ─────────────────────────────────────────────────────

    public List<NotificationResponse> getNotifications() {
        Long userId = SecurityUtils.getCurrentUserId();
        return notificationRepository
                .findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(NotificationResponse::from)
                .toList();
    }

    public void markNotificationRead(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            n.setStatusNotification(1);
            notificationRepository.save(n);
        });
    }

    public void markAllNotificationsRead() {
        Long userId = SecurityUtils.getCurrentUserId();
        notificationRepository.markAllReadByUserId(userId);
    }

    public void createNotification(User user, String title, String message) {
        Notification n = new Notification();
        n.setUser(user);
        n.setTitle(title);
        n.setMessage(message);
        n.setStatusNotification(0);
        n.setCreatedAt(LocalDateTime.now());
        notificationRepository.save(n);
    }

    // ── PROFILE ───────────────────────────────────────────────────────────

    public ProfileResponse getProfile() {
        Long   userId = SecurityUtils.getCurrentUserId();
        User   user   = getCurrentUser();
        Client client = getClientByUserId(userId);
        return ProfileResponse.from(user, client);
    }

    public ProfileResponse updateProfile(UpdateProfileRequest request) {
        Long   userId = SecurityUtils.getCurrentUserId();
        User   user   = getCurrentUser();
        Client client = getClientByUserId(userId);

        // User fields
        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }

        // Client fields (company) — frontend sends empty string when not legal entity
        if (request.getCompanyName() != null) {
            client.setCompanyName(request.getCompanyName());
        }
        if (request.getContactPerson() != null) {
            client.setContactPerson(request.getContactPerson());
        }
        if (request.getNotes() != null) {
            client.setNotes(request.getNotes());
        }

        userRepository.save(user);
        clientRepository.save(client);

        return ProfileResponse.from(user, client);
    }

    public void changePassword(ChangePasswordRequest request) {
        User user = getCurrentUser();

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Неверный текущий пароль");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    // ── HELPERS ───────────────────────────────────────────────────────────

    private Client getCurrentClient() {
        Long userId = SecurityUtils.getCurrentUserId();
        return clientRepository.findById(userId)
                .orElseThrow(() -> new IllegalStateException("Client not found for userId: " + userId));
    }

    private Client getClientByUserId(Long userId) {
        return clientRepository.findById(userId)
                .orElseThrow(() -> new IllegalStateException("Client not found for userId: " + userId));
    }

    private User getCurrentUser() {
        Long userId = SecurityUtils.getCurrentUserId();
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalStateException("User not found: " + userId));
    }

    private static double haversineKm(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    private static boolean isRushHour() {
        int hour = LocalTime.now().getHour();
        return (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 20);
    }

    private static double weatherMultiplier(Integer weatherCode) {
        if (weatherCode == null) return 1.0;
        return switch (weatherCode) {
            case 45, 48     -> 1.15;
            case 51, 53, 55 -> 1.10;
            case 61, 63     -> 1.15;
            case 65         -> 1.25;
            case 71, 73     -> 1.30;
            case 75         -> 1.40;
            case 80, 81     -> 1.15;
            case 82         -> 1.30;
            case 95, 96, 99 -> 1.45;
            default         -> 1.0;
        };
    }
}