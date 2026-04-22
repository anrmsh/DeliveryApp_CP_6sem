package com.delivry.backend.application.service;

import com.delivry.backend.domain.entity.*;
import com.delivry.backend.domain.enums.DeliveryStatus;
import com.delivry.backend.domain.repository.*;
import com.delivry.backend.request.client.CreateOrderRequest;
import com.delivry.backend.request.client.RatingRequest;
import com.delivry.backend.request.client.UpdateProfileRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ClientServiceIntegrationTest {

    @Autowired
    private ClientService clientService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private DeliveryOrderRepository orderRepository;

    @Autowired
    private DeliveryStatusRepository statusRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private CourierRatingsRepository ratingsRepository;

    @Autowired
    private RouteSheetRepository routeSheetRepository;

    @Autowired
    private RoutePointRepository routePointRepository;

    @MockBean
    private PasswordEncoder passwordEncoder;

    private User testUser;
    private Client testClient;
    private DeliveryStatus createdStatus;
    private DeliveryStatus inProgressStatus;
    private User testLogist;
    private User testCourier;

    @BeforeEach
    void setUp() {
        // Очистка данных в правильном порядке
        notificationRepository.deleteAll();
        ratingsRepository.deleteAll();
        routePointRepository.deleteAll();
        routeSheetRepository.deleteAll();
        orderRepository.deleteAll();
        clientRepository.deleteAll();
        userRepository.deleteAll();

        // Создание тестового клиента
        testUser = new User();
        testUser.setFullName("Тестовый Клиент");
        testUser.setEmail("client@test.com");
        testUser.setPhone("+79991234567");
        testUser.setPasswordHash("encodedPassword");

        Role clientRole = new Role();
        clientRole.setName("CLIENT");
        testUser.setRole(clientRole);
        testUser = userRepository.save(testUser);

        testClient = new Client();
        testClient.setUserId(testUser.getId());
        testClient.setUser(testUser);
        testClient.setCompanyName("Тестовая компания");
        testClient = clientRepository.save(testClient);

        // Создание тестового логиста
        testLogist = new User();
        testLogist.setFullName("Тестовый Логист");
        testLogist.setEmail("logist@test.com");
        Role logistRole = new Role();
        logistRole.setName("LOGIST");
        testLogist.setRole(logistRole);
        testLogist = userRepository.save(testLogist);

        // Создание тестового курьера
        testCourier = new User();
        testCourier.setFullName("Тестовый Курьер");
        testCourier.setEmail("courier@test.com");
        Role courierRole = new Role();
        courierRole.setName("COURIER");
        testCourier.setRole(courierRole);
        testCourier = userRepository.save(testCourier);

        // Создание статусов заказов
        createdStatus = new DeliveryStatus();
        createdStatus.setName("Создан");
        createdStatus = statusRepository.save(createdStatus);

        inProgressStatus = new DeliveryStatus();
        inProgressStatus.setName("В пути");
        inProgressStatus = statusRepository.save(inProgressStatus);

        // Устанавливаем Security контекст
        setupSecurityContext(testUser.getId());
    }

    private void setupSecurityContext(Long userId) {
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(userId, null, List.of());
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    // ==================== ТЕСТЫ ====================

    @Test
    void createOrder_Integration_Success() {
        CreateOrderRequest request = new CreateOrderRequest();
        request.setPickupAddress("ул. Тестовая, 1");
        request.setDeliveryAddress("ул. Проверочная, 10");
        request.setLatitude(55.7558);
        request.setLongitude(37.6176);
        request.setRequestedTime(LocalDateTime.now().plusDays(1));

        var response = clientService.createOrder(request);

        assertThat(response).isNotNull();
        assertThat(response.getPickupAddress()).isEqualTo("ул. Тестовая, 1");
        assertThat(response.getDeliveryAddress()).isEqualTo("ул. Проверочная, 10");

        var orders = orderRepository.findByClientUserId(testUser.getId());
        assertThat(orders).hasSize(1);
    }

    @Test
    void getMyOrders_Integration_ReturnsOrders() {
        // Given - создаем заказы
        createTestOrder(testClient, createdStatus, "Адрес 1", "Адрес 2");
        createTestOrder(testClient, inProgressStatus, "Адрес 3", "Адрес 4");

        // When
        var orders = clientService.getMyOrders();

        // Then
        assertThat(orders).hasSize(2);
    }

    @Test
    void getOrder_Integration_ReturnsOrder() {
        // Given
        DeliveryOrder order = createTestOrder(testClient, createdStatus, "Pickup", "Delivery");

        // When
        var response = clientService.getOrder(order.getId());

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(order.getId());
        assertThat(response.getPickupAddress()).isEqualTo("Pickup");
        assertThat(response.getDeliveryAddress()).isEqualTo("Delivery");
    }

    @Test
    void calculatePrice_Integration_WithRealDistance() {
        CreateOrderRequest request = new CreateOrderRequest();
        request.setLatitude(55.7558);
        request.setLongitude(37.6176);
        request.setDeliveryLatitude(55.7512);
        request.setDeliveryLongitude(37.6185);
        request.setVehicleType("car");

        var response = clientService.calculatePrice(request);

        assertThat(response.getDistanceKm()).isBetween(0.1, 1.0);
        assertThat(response.getTrafficMultiplier()).isBetween(1.0, 1.35);
        assertThat(response.getWeatherMultiplier()).isEqualTo(1.0);
    }

    @Test
    void calculatePrice_Integration_DifferentVehicleTypes() {
        CreateOrderRequest request = new CreateOrderRequest();
        request.setDistanceKm(10.0);

        // Car
        request.setVehicleType("car");
        var carPrice = clientService.calculatePrice(request);

        // Van
        request.setVehicleType("van");
        var vanPrice = clientService.calculatePrice(request);

        // Truck
        request.setVehicleType("truck");
        var truckPrice = clientService.calculatePrice(request);

        assertThat(carPrice.getPrice()).isLessThan(vanPrice.getPrice());
        assertThat(vanPrice.getPrice()).isLessThan(truckPrice.getPrice());

        assertThat(carPrice.getPrice()).isEqualTo(12L);
        assertThat(vanPrice.getPrice()).isEqualTo(20L);
        assertThat(truckPrice.getPrice()).isEqualTo(32L);
    }

    @Test
    void calculatePrice_Integration_WithWeatherMultiplier() {
        CreateOrderRequest request = new CreateOrderRequest();
        request.setDistanceKm(10.0);
        request.setVehicleType("car");
        request.setWeatherCode(65);

        var response = clientService.calculatePrice(request);

        assertThat(response.getWeatherMultiplier()).isEqualTo(1.25);
        assertThat(response.getPrice()).isEqualTo(14L);
    }

    @Test
    void rateCourier_Integration_SavesRatingToDatabase() {
        RatingRequest request = new RatingRequest();
        request.setCourierId(testCourier.getId());
        request.setRating(5);
        request.setComment("Отличная доставка!");

        clientService.rateCourier(request);

        var ratings = ratingsRepository.findByCourierId(testCourier.getId());
        assertThat(ratings).hasSize(1);

        var savedRating = ratings.get(0);
        assertThat(savedRating.getRating()).isEqualTo(5);
        assertThat(savedRating.getComment()).isEqualTo("Отличная доставка!");
        assertThat(savedRating.getCourier().getId()).isEqualTo(testCourier.getId());
        assertThat(savedRating.getClient().getUserId()).isEqualTo(testUser.getId());
        assertThat(savedRating.getCreatedAt()).isNotNull();
    }

    @Test
    void rateCourier_Integration_ThrowsException_WhenCourierNotFound() {
        RatingRequest request = new RatingRequest();
        request.setCourierId(999L);
        request.setRating(5);

        assertThatThrownBy(() -> clientService.rateCourier(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Courier not found");
    }

    @Test
    void getNotifications_Integration_ReturnsUserNotifications() {
        clientService.createNotification(testUser, "Тест 1", "Сообщение 1");
        clientService.createNotification(testUser, "Тест 2", "Сообщение 2");
        clientService.createNotification(testLogist, "Логист тест", "Для логиста");

        var notifications = clientService.getNotifications();

        assertThat(notifications).hasSize(2);
    }

    @Test
    void markNotificationRead_Integration_MarksAsRead() {
        clientService.createNotification(testUser, "Тест", "Сообщение");
        var notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(testUser.getId());
        Long notificationId = notifications.get(0).getId();

        clientService.markNotificationRead(notificationId);

        var updatedNotification = notificationRepository.findById(notificationId).get();
        assertThat(updatedNotification.getStatusNotification()).isEqualTo(1);
    }

    @Test
    void markAllNotificationsRead_Integration_MarksAllAsRead() {
        clientService.createNotification(testUser, "Тест 1", "Сообщение 1");
        clientService.createNotification(testUser, "Тест 2", "Сообщение 2");
        clientService.createNotification(testUser, "Тест 3", "Сообщение 3");

        clientService.markAllNotificationsRead();

        var notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(testUser.getId());
        assertThat(notifications).allMatch(n -> n.getStatusNotification() == 1);
    }

    @Test
    void getProfile_Integration_ReturnsCorrectData() {
        var response = clientService.getProfile();

        assertThat(response).isNotNull();
        assertThat(response.getFullName()).isEqualTo("Тестовый Клиент");
        assertThat(response.getEmail()).isEqualTo("client@test.com");
        assertThat(response.getPhone()).isEqualTo("+79991234567");
        assertThat(response.getCompanyName()).isEqualTo("Тестовая компания");
    }

    @Test
    void updateProfile_Integration_PersistsChanges() {
        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setFullName("Обновленное Имя");
        request.setPhone("+79998887766");
        request.setCompanyName("Обновленная компания");
        request.setContactPerson("Новый контакт");
        request.setNotes("Тестовые заметки");

        var response = clientService.updateProfile(request);

        assertThat(response.getFullName()).isEqualTo("Обновленное Имя");
        assertThat(response.getPhone()).isEqualTo("+79998887766");
        assertThat(response.getCompanyName()).isEqualTo("Обновленная компания");
    }

    @Test
    void createNotification_Integration_SavesToDatabase() {
        String title = "Интеграционное уведомление";
        String message = "Тестовое сообщение из интеграционного теста";

        clientService.createNotification(testUser, title, message);

        var notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(testUser.getId());
        assertThat(notifications).hasSize(1);

        var saved = notifications.get(0);
        assertThat(saved.getTitle()).isEqualTo(title);
        assertThat(saved.getMessage()).isEqualTo(message);
        assertThat(saved.getStatusNotification()).isEqualTo(0);
        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(saved.getUser().getId()).isEqualTo(testUser.getId());
    }

    @Test
    void getOrder_Integration_ThrowsException_WhenOrderNotFound() {
        assertThatThrownBy(() -> clientService.getOrder(999L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Order not found");
    }

    // ==================== HELPER METHODS ====================

    private DeliveryOrder createTestOrder(Client client, DeliveryStatus status,
                                          String pickup, String delivery) {
        DeliveryOrder order = new DeliveryOrder();
        order.setClient(client);
        order.setPickupAddress(pickup);
        order.setDeliveryAddress(delivery);
        order.setStatus(status);
        order.setCreatedAt(LocalDateTime.now());
        return orderRepository.save(order);
    }
}