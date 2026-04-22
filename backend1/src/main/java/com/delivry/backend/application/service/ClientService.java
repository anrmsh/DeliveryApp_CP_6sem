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
    private final RoutePointRepository     routePointRepository;
    private final DeliveryOrderRepository  orderRepository;
    private final CourierRatingsRepository courierRatingsRepository;
    private final ClientRepository         clientRepository;
    private final DeliveryStatusRepository statusRepository;
    private final NotificationRepository   notificationRepository;
    private final PasswordEncoder          passwordEncoder;

    private static final double PRICE_PER_KM_CAR   = 0.80;
    private static final double PRICE_PER_KM_VAN   = 1.40;
    private static final double PRICE_PER_KM_TRUCK = 2.20;
    private static final double BASE_PRICE_CAR      = 3.50;
    private static final double BASE_PRICE_VAN      = 6.00;
    private static final double BASE_PRICE_TRUCK    = 10.00;
    private static final double AVG_SPEED_KMH       = 30.0;
    private static final double RUSH_HOUR_MUL       = 1.35;

    public ClientService(
            DeliveryOrderRepository  orderRepository,
            CourierRatingsRepository courierRatingsRepository,
            ClientRepository         clientRepository,
            DeliveryStatusRepository statusRepository,
            UserRepository           userRepository,
            RouteSheetRepository     routeSheetRepository,
            RoutePointRepository     routePointRepository,
            NotificationRepository   notificationRepository,
            PasswordEncoder          passwordEncoder
    ) {
        this.orderRepository          = orderRepository;
        this.courierRatingsRepository = courierRatingsRepository;
        this.clientRepository         = clientRepository;
        this.statusRepository         = statusRepository;
        this.userRepository           = userRepository;
        this.routeSheetRepository     = routeSheetRepository;
        this.routePointRepository     = routePointRepository;
        this.notificationRepository   = notificationRepository;
        this.passwordEncoder          = passwordEncoder;
    }

    // ── CREATE ORDER ───

    public DeliveryOrderResponse createOrder(CreateOrderRequest request) {
        Client client  = getCurrentClient();
        User   current = getCurrentUser();

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

        // Уведомить всех логистов о новом заказе
        userRepository.findAll().stream()
                .filter(u -> u.getRole() != null && "LOGIST".equals(u.getRole().getName()))
                .forEach(logist -> createNotification(
                        logist,
                        "Новый заказ #" + order.getId(),
                        "Клиент " + current.getFullName() +
                                " создал заказ: " + order.getPickupAddress() +
                                " → " + order.getDeliveryAddress()
                ));

        // Уведомить самого клиента
        createNotification(
                current,
                "Заказ #" + order.getId() + " создан",
                "Ваша заявка принята. Логист назначит курьера в ближайшее время."
        );

        return DeliveryOrderResponse.from(order);
    }



    public List<DeliveryOrderResponse> getMyOrders() {
        Client client = getCurrentClient();
        return orderRepository
                .findByClientUserId(client.getUserId())
                .stream()
                .map(o -> enrichOrder(DeliveryOrderResponse.from(o), o.getId()))
                .toList();
    }



    public DeliveryOrderResponse getOrder(Long id) {
        DeliveryOrder order = orderRepository
                .findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + id));
        return enrichOrder(DeliveryOrderResponse.from(order), id);
    }


    private DeliveryOrderResponse enrichOrder(DeliveryOrderResponse resp, Long orderId) {
        routePointRepository.findAll().stream()
                .filter(p -> p.getOrder() != null && p.getOrder().getId().equals(orderId))
                .findFirst()
                .ifPresent(point -> {
                    RouteSheet route = point.getRoute();
                    if (route == null) return;
                    resp.setRouteId(route.getId());
                    if (route.getCourier() != null) {
                        resp.setCourierId(route.getCourier().getId());
                        resp.setCourierName(route.getCourier().getFullName());
                        resp.setCourierPhone(route.getCourier().getPhone());
                    }
                    if (route.getVehicle() != null) {
                        resp.setVehicleModel(route.getVehicle().getModel());
                        resp.setVehiclePlate(route.getVehicle().getPlateNumber());
                    }
                });
        return resp;
    }



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

        String vt = request.getVehicleType() != null
                ? request.getVehicleType().toLowerCase() : "car";

        double pricePerKm = switch (vt) {
            case "van"   -> PRICE_PER_KM_VAN;
            case "truck" -> PRICE_PER_KM_TRUCK;
            default      -> PRICE_PER_KM_CAR;
        };
        double basePrice = switch (vt) {
            case "van"   -> BASE_PRICE_VAN;
            case "truck" -> BASE_PRICE_TRUCK;
            default      -> BASE_PRICE_CAR;
        };

        double trafficMul   = isRushHour() ? RUSH_HOUR_MUL : 1.0;
        double weatherMul   = weatherMultiplier(request.getWeatherCode());
        double baseMinutes  = (distanceKm / AVG_SPEED_KMH) * 60.0;
        int    totalMinutes = (int) Math.round(baseMinutes * trafficMul * weatherMul);
        double price        = basePrice + distanceKm * pricePerKm * weatherMul;

        return new DeliveryPriceResponse(
                (long) (Math.round(price * 100.0) / 100.0),
                totalMinutes,
                distanceKm,
                trafficMul,
                weatherMul
        );
    }



    public void rateCourier(RatingRequest req) {
        Client client = getCurrentClient();

        CourierRating rating = new CourierRating();
        rating.setCourier(userRepository.findById(req.getCourierId())
                .orElseThrow(() -> new IllegalArgumentException("Courier not found: " + req.getCourierId())));
        rating.setClient(client);
        if (req.getRouteId() != null) {
            routeSheetRepository.findById(req.getRouteId())
                    .ifPresent(rating::setRoute);
        }
        rating.setRating(req.getRating());
        rating.setComment(req.getComment());
        rating.setCreatedAt(LocalDateTime.now());
        courierRatingsRepository.save(rating);
    }



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
        notificationRepository.findAll().stream()
                .filter(n -> n.getUser() != null && n.getUser().getId().equals(userId))
                .filter(n -> n.getStatusNotification() != null && n.getStatusNotification() == 0)
                .forEach(n -> {
                    n.setStatusNotification(1);
                    notificationRepository.save(n);
                });
    }



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

        if (request.getFullName() != null && !request.getFullName().isBlank())
            user.setFullName(request.getFullName());
        if (request.getPhone() != null)
            user.setPhone(request.getPhone());
        if (request.getCompanyName() != null)
            client.setCompanyName(request.getCompanyName());
        if (request.getContactPerson() != null)
            client.setContactPerson(request.getContactPerson());
        if (request.getNotes() != null)
            client.setNotes(request.getNotes());

        userRepository.save(user);
        clientRepository.save(client);
        return ProfileResponse.from(user, client);
    }

    public void changePassword(ChangePasswordRequest request) {
        User user = getCurrentUser();
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash()))
            throw new IllegalArgumentException("Неверный текущий пароль");
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
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

    private Client getCurrentClient() {
        Long userId = SecurityUtils.getCurrentUserId();
        return clientRepository.findById(userId)
                .orElseThrow(() -> new IllegalStateException("Client not found: " + userId));
    }

    private Client getClientByUserId(Long userId) {
        return clientRepository.findById(userId)
                .orElseThrow(() -> new IllegalStateException("Client not found: " + userId));
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
        double a    = Math.sin(dLat/2) * Math.sin(dLat/2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon/2) * Math.sin(dLon/2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    private static boolean isRushHour() {
        int h = LocalTime.now().getHour();
        return (h >= 7 && h <= 9) || (h >= 17 && h <= 20);
    }

    private static double weatherMultiplier(Integer code) {
        if (code == null) return 1.0;
        return switch (code) {
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