package com.delivry.backend.application.service;

import com.delivry.backend.domain.entity.*;
import com.delivry.backend.domain.enums.DeliveryStatus;
import com.delivry.backend.domain.repository.*;
import com.delivry.backend.infrastructure.security.SecurityUtils;
import com.delivry.backend.request.client.ChangePasswordRequest;
import com.delivry.backend.request.client.CreateOrderRequest;
import com.delivry.backend.request.client.RatingRequest;
import com.delivry.backend.request.client.UpdateProfileRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ClientServiceUnitTest {

    @Mock private UserRepository userRepository;
    @Mock private RouteSheetRepository routeSheetRepository;
    @Mock private RoutePointRepository routePointRepository;
    @Mock private DeliveryOrderRepository orderRepository;
    @Mock private CourierRatingsRepository courierRatingsRepository;
    @Mock private ClientRepository clientRepository;
    @Mock private DeliveryStatusRepository statusRepository;
    @Mock private NotificationRepository notificationRepository;
    @Mock private PasswordEncoder passwordEncoder;

    private ClientService clientService;

    @BeforeEach
    void setUp() {
        clientService = new ClientService(
                orderRepository,
                courierRatingsRepository,
                clientRepository,
                statusRepository,
                userRepository,
                routeSheetRepository,
                routePointRepository,
                notificationRepository,
                passwordEncoder
        );
    }

    @Test
    void createOrder_Success() {
        // Given
        Long userId = 1L;
        User user = createUser(userId, "Клиент Иванов", "CLIENT");
        Client client = createClient(userId, user);
        DeliveryStatus status = createStatus("Создан");

        User logist1 = createUser(2L, "Логист Петров", "LOGIST");
        User logist2 = createUser(3L, "Логист Сидоров", "LOGIST");

        CreateOrderRequest request = new CreateOrderRequest();
        request.setPickupAddress("ул. Ленина, 1");
        request.setDeliveryAddress("ул. Пушкина, 10");
        request.setLatitude(55.7558);
        request.setLongitude(37.6176);

        try (MockedStatic<SecurityUtils> securityUtilsMock = mockStatic(SecurityUtils.class)) {
            securityUtilsMock.when(SecurityUtils::getCurrentUserId).thenReturn(userId);

            when(clientRepository.findById(userId)).thenReturn(Optional.of(client));
            when(userRepository.findById(userId)).thenReturn(Optional.of(user));
            when(statusRepository.findByName("Создан")).thenReturn(Optional.of(status));
            when(userRepository.findAll()).thenReturn(List.of(logist1, logist2));

            // When
            var response = clientService.createOrder(request);

            // Then
            assertThat(response).isNotNull();
            verify(orderRepository).save(any(DeliveryOrder.class));
            verify(notificationRepository, times(3)).save(any(Notification.class));
        }
    }


    @Test
    void getMyOrders_Success() {

        Long userId = 1L;
        Client client = createClient(userId, createUser(userId, "Клиент", "CLIENT"));
        DeliveryOrder order1 = createOrder(1L, client, "Создан");
        DeliveryOrder order2 = createOrder(2L, client, "В пути");

        try (MockedStatic<SecurityUtils> securityUtilsMock = mockStatic(SecurityUtils.class)) {
            securityUtilsMock.when(SecurityUtils::getCurrentUserId).thenReturn(userId);

            when(clientRepository.findById(userId)).thenReturn(Optional.of(client));
            when(orderRepository.findByClientUserId(userId)).thenReturn(List.of(order1, order2));
            when(routePointRepository.findAll()).thenReturn(List.of());

            // When
            var orders = clientService.getMyOrders();

            // Then
            assertThat(orders).hasSize(2);
            assertThat(orders.get(0).getId()).isEqualTo(1L);
            assertThat(orders.get(1).getId()).isEqualTo(2L);
        }
    }

    @Test
    void getOrder_Success() {
        // Given
        Long userId = 1L;
        Long orderId = 100L;
        Client client = createClient(userId, createUser(userId, "Клиент", "CLIENT"));
        DeliveryOrder order = createOrder(orderId, client, "Создан");

        try (MockedStatic<SecurityUtils> securityUtilsMock = mockStatic(SecurityUtils.class)) {
            securityUtilsMock.when(SecurityUtils::getCurrentUserId).thenReturn(userId);

            when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
            when(routePointRepository.findAll()).thenReturn(List.of());

            // When
            var response = clientService.getOrder(orderId);

            // Then
            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(orderId);
        }
    }

    @Test
    void getOrder_ThrowsException_WhenNotFound() {
        // Given
        Long orderId = 999L;

        try (MockedStatic<SecurityUtils> securityUtilsMock = mockStatic(SecurityUtils.class)) {
            when(orderRepository.findById(orderId)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> clientService.getOrder(orderId))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Order not found");
        }
    }

    @Test
    void rateCourier_Success() {
        // Given
        Long userId = 1L;
        Long courierId = 2L;
        Long routeId = 10L;

        User courier = createUser(courierId, "Курьер", "COURIER");
        Client client = createClient(userId, createUser(userId, "Клиент", "CLIENT"));
        RouteSheet route = new RouteSheet();
        route.setId(routeId);

        RatingRequest request = new RatingRequest();
        request.setCourierId(courierId);
        request.setRouteId(routeId);
        request.setRating(5);
        request.setComment("Отличная доставка!");

        try (MockedStatic<SecurityUtils> securityUtilsMock = mockStatic(SecurityUtils.class)) {
            securityUtilsMock.when(SecurityUtils::getCurrentUserId).thenReturn(userId);

            when(clientRepository.findById(userId)).thenReturn(Optional.of(client));
            when(userRepository.findById(courierId)).thenReturn(Optional.of(courier));
            when(routeSheetRepository.findById(routeId)).thenReturn(Optional.of(route));

            // When
            clientService.rateCourier(request);

            // Then
            ArgumentCaptor<CourierRating> ratingCaptor = ArgumentCaptor.forClass(CourierRating.class);
            verify(courierRatingsRepository).save(ratingCaptor.capture());

            CourierRating savedRating = ratingCaptor.getValue();
            assertThat(savedRating.getRating()).isEqualTo(5);
            assertThat(savedRating.getComment()).isEqualTo("Отличная доставка!");
            assertThat(savedRating.getCourier().getId()).isEqualTo(courierId);
            assertThat(savedRating.getClient().getUserId()).isEqualTo(userId);
        }
    }

    @Test
    void rateCourier_ThrowsException_WhenCourierNotFound() {
        // Given
        Long userId = 1L;
        Client client = createClient(userId, createUser(userId, "Клиент", "CLIENT"));

        RatingRequest request = new RatingRequest();
        request.setCourierId(999L);
        request.setRating(5);

        try (MockedStatic<SecurityUtils> securityUtilsMock = mockStatic(SecurityUtils.class)) {
            securityUtilsMock.when(SecurityUtils::getCurrentUserId).thenReturn(userId);

            when(clientRepository.findById(userId)).thenReturn(Optional.of(client));
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> clientService.rateCourier(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Courier not found");
        }
    }

    @Test
    void getNotifications_Success() {
        // Given
        Long userId = 1L;
        Notification notification1 = createNotification(1L, userId, "Заголовок 1", "Сообщение 1");
        Notification notification2 = createNotification(2L, userId, "Заголовок 2", "Сообщение 2");

        try (MockedStatic<SecurityUtils> securityUtilsMock = mockStatic(SecurityUtils.class)) {
            securityUtilsMock.when(SecurityUtils::getCurrentUserId).thenReturn(userId);

            when(notificationRepository.findByUserIdOrderByCreatedAtDesc(userId))
                    .thenReturn(List.of(notification1, notification2));

            // When
            var notifications = clientService.getNotifications();

            // Then
            assertThat(notifications).hasSize(2);
            assertThat(notifications.get(0).getTitle()).isEqualTo("Заголовок 1");
        }
    }

    @Test
    void markNotificationRead_Success() {
        // Given
        Long notificationId = 1L;
        Notification notification = createNotification(notificationId, 1L, "Тест", "Сообщение");
        notification.setStatusNotification(0);

        when(notificationRepository.findById(notificationId)).thenReturn(Optional.of(notification));

        // When
        clientService.markNotificationRead(notificationId);

        // Then
        assertThat(notification.getStatusNotification()).isEqualTo(1);
        verify(notificationRepository).save(notification);
    }

    @Test
    void markAllNotificationsRead_Success() {
        // Given
        Long userId = 1L;
        Notification notification1 = createNotification(1L, userId, "Тест1", "Сообщение1");
        Notification notification2 = createNotification(2L, userId, "Тест2", "Сообщение2");
        notification1.setStatusNotification(0);
        notification2.setStatusNotification(0);

        try (MockedStatic<SecurityUtils> securityUtilsMock = mockStatic(SecurityUtils.class)) {
            securityUtilsMock.when(SecurityUtils::getCurrentUserId).thenReturn(userId);

            when(notificationRepository.findAll()).thenReturn(List.of(notification1, notification2));

            // When
            clientService.markAllNotificationsRead();

            // Then
            assertThat(notification1.getStatusNotification()).isEqualTo(1);
            assertThat(notification2.getStatusNotification()).isEqualTo(1);
            verify(notificationRepository, times(2)).save(any(Notification.class));
        }
    }

    @Test
    void getProfile_Success() {
        // Given
        Long userId = 1L;
        User user = createUser(userId, "Иван Петров", "CLIENT");
        user.setPhone("+79991234567");
        user.setEmail("ivan@example.com");

        Client client = createClient(userId, user);
        client.setCompanyName("ООО Ромашка");
        client.setContactPerson("Иван Петров");

        try (MockedStatic<SecurityUtils> securityUtilsMock = mockStatic(SecurityUtils.class)) {
            securityUtilsMock.when(SecurityUtils::getCurrentUserId).thenReturn(userId);

            when(userRepository.findById(userId)).thenReturn(Optional.of(user));
            when(clientRepository.findById(userId)).thenReturn(Optional.of(client));

            // When
            var response = clientService.getProfile();

            // Then
            assertThat(response.getFullName()).isEqualTo("Иван Петров");
            assertThat(response.getPhone()).isEqualTo("+79991234567");
            assertThat(response.getEmail()).isEqualTo("ivan@example.com");
            assertThat(response.getCompanyName()).isEqualTo("ООО Ромашка");
        }
    }

    @Test
    void updateProfile_Success() {
        // Given
        Long userId = 1L;
        User user = createUser(userId, "Старое имя", "CLIENT");
        Client client = createClient(userId, user);

        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setFullName("Новое имя");
        request.setPhone("+79998887766");
        request.setCompanyName("ООО Новая компания");
        request.setContactPerson("Новый контакт");

        try (MockedStatic<SecurityUtils> securityUtilsMock = mockStatic(SecurityUtils.class)) {
            securityUtilsMock.when(SecurityUtils::getCurrentUserId).thenReturn(userId);

            when(userRepository.findById(userId)).thenReturn(Optional.of(user));
            when(clientRepository.findById(userId)).thenReturn(Optional.of(client));

            // When
            var response = clientService.updateProfile(request);

            // Then
            assertThat(response.getFullName()).isEqualTo("Новое имя");
            assertThat(response.getPhone()).isEqualTo("+79998887766");
            assertThat(response.getCompanyName()).isEqualTo("ООО Новая компания");

            verify(userRepository).save(user);
            verify(clientRepository).save(client);
        }
    }

    @Test
    void changePassword_Success() {
        // Given
        Long userId = 1L;
        User user = createUser(userId, "Пользователь", "CLIENT");
        user.setPasswordHash("encodedOldPassword");

        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("oldPass");
        request.setNewPassword("newPass");

        try (MockedStatic<SecurityUtils> securityUtilsMock = mockStatic(SecurityUtils.class)) {
            securityUtilsMock.when(SecurityUtils::getCurrentUserId).thenReturn(userId);

            when(userRepository.findById(userId)).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("oldPass", "encodedOldPassword")).thenReturn(true);
            when(passwordEncoder.encode("newPass")).thenReturn("encodedNewPassword");

            // When
            clientService.changePassword(request);

            // Then
            assertThat(user.getPasswordHash()).isEqualTo("encodedNewPassword");
            verify(userRepository).save(user);
        }
    }

    @Test
    void changePassword_ThrowsException_WhenCurrentPasswordIncorrect() {
        // Given
        Long userId = 1L;
        User user = createUser(userId, "Пользователь", "CLIENT");
        user.setPasswordHash("encodedOldPassword");

        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("wrongPass");
        request.setNewPassword("newPass");

        try (MockedStatic<SecurityUtils> securityUtilsMock = mockStatic(SecurityUtils.class)) {
            securityUtilsMock.when(SecurityUtils::getCurrentUserId).thenReturn(userId);

            when(userRepository.findById(userId)).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("wrongPass", "encodedOldPassword")).thenReturn(false);

            // When & Then
            assertThatThrownBy(() -> clientService.changePassword(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Неверный текущий пароль");
        }
    }


    // Helper methods
    private User createUser(Long id, String name, String role) {
        User user = new User();
        user.setId(id);
        user.setFullName(name);
        Role userRole = new Role();
        userRole.setName(role);
        user.setRole(userRole);
        return user;
    }

    private Client createClient(Long userId, User user) {
        Client client = new Client();
        client.setUserId(userId);
        client.setUser(user);
        return client;
    }

    private DeliveryStatus createStatus(String name) {
        DeliveryStatus status = new DeliveryStatus();
        status.setName(name);
        return status;
    }

    private DeliveryOrder createOrder(Long id, Client client, String statusName) {
        DeliveryOrder order = new DeliveryOrder();
        order.setId(id);
        order.setClient(client);
        DeliveryStatus status = new DeliveryStatus();
        status.setName(statusName);
        order.setStatus(status);
        return order;
    }

    private Notification createNotification(Long id, Long userId, String title, String message) {
        Notification notification = new Notification();
        notification.setId(id);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setCreatedAt(LocalDateTime.now());
        notification.setStatusNotification(0);

        User user = new User();
        user.setId(userId);
        notification.setUser(user);

        return notification;
    }
}