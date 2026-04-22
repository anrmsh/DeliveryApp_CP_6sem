package com.delivry.backend.application.service;

import com.delivry.backend.application.pattern.factory.NotificationFactory;
import com.delivry.backend.application.pattern.strategy.RoutePointStatusStrategy;
import com.delivry.backend.domain.entity.*;
import com.delivry.backend.domain.enums.RoutePointStatus;
import com.delivry.backend.domain.enums.RouteStatus;
import com.delivry.backend.domain.repository.*;
import com.delivry.backend.infrastructure.security.SecurityUtils;
import com.delivry.backend.request.courier.CompleteRouteRequest;
import com.delivry.backend.request.courier.UpdatePointStatusRequest;
import com.delivry.backend.response.courier.CourierRouteResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CourierServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private RouteSheetRepository routeSheetRepository;
    @Mock private RoutePointRepository routePointRepository;
    @Mock private RouteStatusRepository routeStatusRepository;
    @Mock private RoutePointStatusRepository routePointStatusRepository;
    @Mock private DeliveryStatusRepository deliveryStatusRepository;
    @Mock private NotificationRepository notificationRepository;
    @Mock private VehicleRepository vehicleRepository;
    @Mock private CourierRatingsRepository ratingsRepository;
    @Mock private NotificationFactory notificationFactory;
    @Mock private RoutePointStatusStrategy pointStatusStrategy;

    private CourierService courierService;

    @BeforeEach
    void setUp() {
        courierService = new CourierService(
                userRepository,
                routeSheetRepository,
                routePointRepository,
                routeStatusRepository,
                routePointStatusRepository,
                deliveryStatusRepository,
                notificationRepository,
                vehicleRepository,
                ratingsRepository,
                notificationFactory,
                List.of(pointStatusStrategy)
        );
    }

    @Test
    void updatePointStatus_Success() {
        // Given
        Long courierId = 7L;
        Long pointId = 1L;

        User courier = createUser(courierId);
        RouteSheet route = createRoute(1L, courier, "Активен");
        RoutePoint point = createRoutePoint(pointId, route);
        point.setSequenceNumber(1); // Устанавливаем sequenceNumber

        RoutePointStatus visitedStatus = new RoutePointStatus();
        visitedStatus.setName("Посещена");

        UpdatePointStatusRequest request = new UpdatePointStatusRequest();
        request.setStatus("Посещена");

        when(routePointRepository.findById(pointId)).thenReturn(Optional.of(point));
        when(routePointStatusRepository.findByName("Посещена")).thenReturn(Optional.of(visitedStatus));
        when(routePointRepository.findByRouteIdOrderBySequenceNumber(route.getId())).thenReturn(List.of(point));
        when(pointStatusStrategy.supports("Посещена")).thenReturn(true);

        try (MockedStatic<SecurityUtils> securityUtilsMock = mockStatic(SecurityUtils.class)) {
            securityUtilsMock.when(SecurityUtils::getCurrentUserId).thenReturn(courierId);

            // When
            CourierRouteResponse response = courierService.updatePointStatus(pointId, request);

            // Then
            verify(pointStatusStrategy).apply(point);
            verify(routePointRepository).save(point);
            assertThat(response).isNotNull();
        }
    }

    @Test
    void updatePointStatus_ThrowsException_WhenPointNotFound() {
        // Given
        Long courierId = 7L;
        Long pointId = 999L;

        UpdatePointStatusRequest request = new UpdatePointStatusRequest();
        request.setStatus("Посещена");

        when(routePointRepository.findById(pointId)).thenReturn(Optional.empty());

        try (MockedStatic<SecurityUtils> securityUtilsMock = mockStatic(SecurityUtils.class)) {
            securityUtilsMock.when(SecurityUtils::getCurrentUserId).thenReturn(courierId);

            // When & Then
            assertThatThrownBy(() -> courierService.updatePointStatus(pointId, request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Point not found");
        }
    }

    @Test
    void updatePointStatus_ThrowsException_WhenPointBelongsToAnotherCourier() {
        // Given
        Long currentCourierId = 7L;
        Long pointOwnerId = 999L;
        Long pointId = 1L;

        User pointOwner = createUser(pointOwnerId);
        RouteSheet route = createRoute(1L, pointOwner, "Активен");
        RoutePoint point = createRoutePoint(pointId, route);

        UpdatePointStatusRequest request = new UpdatePointStatusRequest();
        request.setStatus("Посещена");

        when(routePointRepository.findById(pointId)).thenReturn(Optional.of(point));

        try (MockedStatic<SecurityUtils> securityUtilsMock = mockStatic(SecurityUtils.class)) {
            securityUtilsMock.when(SecurityUtils::getCurrentUserId).thenReturn(currentCourierId);

            // When & Then
            assertThatThrownBy(() -> courierService.updatePointStatus(pointId, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("не принадлежит текущему курьеру");
        }
    }

    @Test
    void completeRoute_Success() {
        // Given
        Long courierId = 7L;
        Long routeId = 1L;

        User courier = createUser(courierId);
        RouteSheet route = createRoute(routeId, courier, "Активен");
        Vehicle vehicle = createVehicle(1L, "Доступен");
        route.setVehicle(vehicle);

        RouteStatus completedStatus = new RouteStatus();
        completedStatus.setName("Завершён");

        CompleteRouteRequest request = new CompleteRouteRequest();
        request.setActualDistanceKm(15.5);

        Notification mockNotification = new Notification();
        mockNotification.setId(1L);

        when(routeSheetRepository.findById(routeId)).thenReturn(Optional.of(route));
        when(routeStatusRepository.findByName("Завершён")).thenReturn(Optional.of(completedStatus));
        when(userRepository.findById(courierId)).thenReturn(Optional.of(courier));
        when(routePointRepository.findByRouteIdOrderBySequenceNumber(routeId)).thenReturn(List.of());
        when(notificationFactory.create(any(User.class), anyString(), anyString())).thenReturn(mockNotification);

        try (MockedStatic<SecurityUtils> securityUtilsMock = mockStatic(SecurityUtils.class)) {
            securityUtilsMock.when(SecurityUtils::getCurrentUserId).thenReturn(courierId);

            // When
            CourierRouteResponse response = courierService.completeRoute(routeId, request);

            // Then
            verify(routeSheetRepository).save(route);
            verify(vehicleRepository).save(vehicle);
            verify(notificationRepository).save(mockNotification);

            assertThat(route.getStatus().getName()).isEqualTo("Завершён");
            assertThat(route.getActualDistanceKm()).isEqualTo(15.5);
            assertThat(vehicle.getStatus().getName()).isEqualTo("Доступен");
        }
    }

    @Test
    void completeRoute_ThrowsException_WhenRouteNotFound() {
        // Given
        Long courierId = 7L;
        Long routeId = 999L;

        CompleteRouteRequest request = new CompleteRouteRequest();

        when(routeSheetRepository.findById(routeId)).thenReturn(Optional.empty());

        try (MockedStatic<SecurityUtils> securityUtilsMock = mockStatic(SecurityUtils.class)) {
            securityUtilsMock.when(SecurityUtils::getCurrentUserId).thenReturn(courierId);

            // When & Then
            assertThatThrownBy(() -> courierService.completeRoute(routeId, request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Route not found");
        }
    }

    @Test
    void completeRoute_ThrowsException_WhenRouteBelongsToAnotherCourier() {
        // Given
        Long currentCourierId = 7L;
        Long routeOwnerId = 999L;
        Long routeId = 1L;

        User routeOwner = createUser(routeOwnerId);
        RouteSheet route = createRoute(routeId, routeOwner, "Активен");

        CompleteRouteRequest request = new CompleteRouteRequest();

        when(routeSheetRepository.findById(routeId)).thenReturn(Optional.of(route));

        try (MockedStatic<SecurityUtils> securityUtilsMock = mockStatic(SecurityUtils.class)) {
            securityUtilsMock.when(SecurityUtils::getCurrentUserId).thenReturn(currentCourierId);

            // When & Then
            assertThatThrownBy(() -> courierService.completeRoute(routeId, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Это не ваш маршрут");
        }
    }

    @Test
    void startRoute_Success() {
        // Given
        Long courierId = 7L;
        Long routeId = 1L;

        User courier = createUser(courierId);
        RouteStatus activeStatus = new RouteStatus();
        activeStatus.setName("Активен");
        RouteSheet route = createRoute(routeId, courier, "Активен");
        route.setStatus(activeStatus);
        route.setActualStart(null);

        Notification mockNotification = new Notification();

        when(routeSheetRepository.findById(routeId)).thenReturn(Optional.of(route));
        when(userRepository.findById(courierId)).thenReturn(Optional.of(courier));
        when(routePointRepository.findByRouteIdOrderBySequenceNumber(routeId)).thenReturn(List.of());
        when(notificationFactory.create(any(User.class), anyString(), anyString())).thenReturn(mockNotification);

        try (MockedStatic<SecurityUtils> securityUtilsMock = mockStatic(SecurityUtils.class)) {
            securityUtilsMock.when(SecurityUtils::getCurrentUserId).thenReturn(courierId);

            // When
            CourierRouteResponse response = courierService.startRoute(routeId);

            // Then
            ArgumentCaptor<RouteSheet> routeCaptor = ArgumentCaptor.forClass(RouteSheet.class);
            verify(routeSheetRepository).save(routeCaptor.capture());

            RouteSheet savedRoute = routeCaptor.getValue();
            assertThat(savedRoute.getActualStart()).isNotNull();
            verify(notificationRepository).save(mockNotification);
        }
    }

    @Test
    void startRoute_ThrowsException_WhenRouteNotActive() {
        // Given
        Long courierId = 7L;
        Long routeId = 1L;

        User courier = createUser(courierId);
        RouteStatus completedStatus = new RouteStatus();
        completedStatus.setName("Завершён");
        RouteSheet route = createRoute(routeId, courier, "Завершён");
        route.setStatus(completedStatus);

        when(routeSheetRepository.findById(routeId)).thenReturn(Optional.of(route));

        try (MockedStatic<SecurityUtils> securityUtilsMock = mockStatic(SecurityUtils.class)) {
            securityUtilsMock.when(SecurityUtils::getCurrentUserId).thenReturn(courierId);

            // When & Then
            assertThatThrownBy(() -> courierService.startRoute(routeId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Маршрут уже начат или не активен");
        }
    }

    @Test
    void getDashboard_Success() {
        // Given
        Long courierId = 7L;

        RouteStatus activeStatus = new RouteStatus();
        activeStatus.setName("Активен");

        RouteStatus completedStatus = new RouteStatus();
        completedStatus.setName("Завершён");

        RouteSheet activeRoute = createRoute(1L, createUser(courierId), "Активен");
        activeRoute.setStatus(activeStatus);
        activeRoute.setActualDistanceKm(10.5);

        RouteSheet completedRoute1 = createRoute(2L, createUser(courierId), "Завершён");
        completedRoute1.setStatus(completedStatus);
        completedRoute1.setActualDistanceKm(20.0);

        RouteSheet completedRoute2 = createRoute(3L, createUser(courierId), "Завершён");
        completedRoute2.setStatus(completedStatus);
        completedRoute2.setActualDistanceKm(null);

        List<RouteSheet> routes = List.of(activeRoute, completedRoute1, completedRoute2);

        CourierRating rating1 = new CourierRating();
        rating1.setRating(5);
        CourierRating rating2 = new CourierRating();
        rating2.setRating(4);
        List<CourierRating> ratings = List.of(rating1, rating2);

        when(routeSheetRepository.findByCourierId(courierId)).thenReturn(routes);
        when(notificationRepository.countByUserIdAndStatusNotification(courierId, 0)).thenReturn(3L);
        when(ratingsRepository.findByCourierId(courierId)).thenReturn(ratings);

        try (MockedStatic<SecurityUtils> securityUtilsMock = mockStatic(SecurityUtils.class)) {
            securityUtilsMock.when(SecurityUtils::getCurrentUserId).thenReturn(courierId);

            // When
            var response = courierService.getDashboard();

            // Then
            assertThat(response.getTotalRoutes()).isEqualTo(3);
            assertThat(response.getCompletedRoutes()).isEqualTo(2);
            assertThat(response.getActiveRoutes()).isEqualTo(1);
            assertThat(response.getUnreadNotifications()).isEqualTo(3);
            assertThat(response.getAverageRating()).isEqualTo(4.5);
            assertThat(response.getTotalRatings()).isEqualTo(2);
        }
    }

    @Test
    void markNotificationRead_Success() {
        // Given
        Long courierId = 7L;
        Long notificationId = 1L;

        Notification notification = new Notification();
        notification.setId(notificationId);
        notification.setStatusNotification(0);

        when(notificationRepository.findByIdAndUserId(notificationId, courierId))
                .thenReturn(Optional.of(notification));

        try (MockedStatic<SecurityUtils> securityUtilsMock = mockStatic(SecurityUtils.class)) {
            securityUtilsMock.when(SecurityUtils::getCurrentUserId).thenReturn(courierId);

            // When
            courierService.markNotificationRead(notificationId);

            // Then
            assertThat(notification.getStatusNotification()).isEqualTo(1);
            verify(notificationRepository).save(notification);
        }
    }

    @Test
    void markAllNotificationsRead_Success() {
        // Given
        Long courierId = 7L;

        try (MockedStatic<SecurityUtils> securityUtilsMock = mockStatic(SecurityUtils.class)) {
            securityUtilsMock.when(SecurityUtils::getCurrentUserId).thenReturn(courierId);

            // When
            courierService.markAllNotificationsRead();

            // Then
            verify(notificationRepository).markAllReadByUserId(courierId);
        }
    }

    @Test
    void getProfile_Success() {
        // Given
        Long courierId = 7L;
        User courier = createUser(courierId);
        courier.setFullName("Иван Петров");
        courier.setEmail("ivan@example.com");
        courier.setPhone("+79991234567");

        CourierRating rating1 = new CourierRating();
        rating1.setRating(5);
        CourierRating rating2 = new CourierRating();
        rating2.setRating(4);
        CourierRating rating3 = new CourierRating();
        rating3.setRating(3);
        List<CourierRating> ratings = List.of(rating1, rating2, rating3);

        when(userRepository.findById(courierId)).thenReturn(Optional.of(courier));
        when(ratingsRepository.findByCourierId(courierId)).thenReturn(ratings);

        try (MockedStatic<SecurityUtils> securityUtilsMock = mockStatic(SecurityUtils.class)) {
            securityUtilsMock.when(SecurityUtils::getCurrentUserId).thenReturn(courierId);

            // When
            var response = courierService.getProfile();

            // Then
            assertThat(response).isNotNull();
            assertThat(response.getFullName()).isEqualTo("Иван Петров");
            assertThat(response.getEmail()).isEqualTo("ivan@example.com");
            assertThat(response.getPhone()).isEqualTo("+79991234567");
            assertThat(response.getAverageRating()).isEqualTo(4.0);
            assertThat(response.getTotalRatings()).isEqualTo(3);
        }
    }

    // Helper methods

    private User createUser(Long id) {
        User user = new User();
        user.setId(id);
        return user;
    }

    private RouteSheet createRoute(Long id, User courier, String statusName) {
        RouteSheet route = new RouteSheet();
        route.setId(id);
        route.setCourier(courier);
        RouteStatus status = new RouteStatus();
        status.setName(statusName);
        route.setStatus(status);
        return route;
    }

    private RoutePoint createRoutePoint(Long id, RouteSheet route) {
        RoutePoint point = new RoutePoint();
        point.setId(id);
        point.setRoute(route);
        return point;
    }

    private Vehicle createVehicle(Long id, String statusName) {
        Vehicle vehicle = new Vehicle();
        vehicle.setId(id);
        com.delivry.backend.domain.enums.VehicleStatus status =
                new com.delivry.backend.domain.enums.VehicleStatus();
        status.setName(statusName);
        vehicle.setStatus(status);
        return vehicle;
    }
}