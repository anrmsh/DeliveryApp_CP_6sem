package com.delivry.backend.application.service;

import com.delivry.backend.application.pattern.factory.NotificationFactory;
import com.delivry.backend.domain.entity.Notification;
import com.delivry.backend.domain.entity.RouteSheet;
import com.delivry.backend.domain.entity.User;
import com.delivry.backend.domain.entity.Vehicle;
import com.delivry.backend.domain.enums.RouteStatus;
import com.delivry.backend.domain.enums.VehicleStatus;
import com.delivry.backend.domain.repository.CourierRatingsRepository;
import com.delivry.backend.domain.repository.DeliveryOrderRepository;
import com.delivry.backend.domain.repository.DeliveryStatusRepository;
import com.delivry.backend.domain.repository.NotificationRepository;
import com.delivry.backend.domain.repository.RoutePointRepository;
import com.delivry.backend.domain.repository.RouteSheetRepository;
import com.delivry.backend.domain.repository.RouteStatusRepository;
import com.delivry.backend.domain.repository.UserRepository;
import com.delivry.backend.domain.repository.VehicleRepository;
import com.delivry.backend.infrastructure.security.SecurityUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LogistServiceTest {

    @Mock private DeliveryOrderRepository orderRepository;
    @Mock private RouteSheetRepository routeSheetRepository;
    @Mock private RoutePointRepository routePointRepository;
    @Mock private VehicleRepository vehicleRepository;
    @Mock private UserRepository userRepository;
    @Mock private CourierRatingsRepository ratingRepository;
    @Mock private DeliveryStatusRepository deliveryStatusRepository;
    @Mock private RouteStatusRepository routeStatusRepository;
    @Mock private RoutePlanningService planningService;
    @Mock private NotificationRepository notificationRepository;
    @Mock private NotificationFactory notificationFactory;

    private LogistService logistService;

    @BeforeEach
    void setUp() {
        logistService = new LogistService(
                orderRepository,
                routeSheetRepository,
                routePointRepository,
                vehicleRepository,
                userRepository,
                ratingRepository,
                deliveryStatusRepository,
                routeStatusRepository,
                planningService,
                notificationRepository,
                notificationFactory
        );
    }

    @Test
    void approveRoute_activatesRoute_marksVehicleBusy_andNotifiesCourier() {
        User courier = new User();
        courier.setId(20L);
        courier.setFullName("Courier");

        User logist = new User();
        logist.setId(5L);
        logist.setFullName("Логист");

        RouteStatus planned = new RouteStatus();
        planned.setName("Запланирован");

        RouteStatus active = new RouteStatus();
        active.setName("Активен");

        VehicleStatus vehicleStatus = new VehicleStatus();
        vehicleStatus.setName("Доступен");

        Vehicle vehicle = new Vehicle();
        vehicle.setModel("Ford Transit");
        vehicle.setPlateNumber("1234 AB-7");
        vehicle.setStatus(vehicleStatus);

        RouteSheet route = new RouteSheet();
        route.setId(10L);
        route.setCourier(courier);
        route.setStatus(planned);
        route.setVehicle(vehicle);

        when(routeSheetRepository.findById(10L)).thenReturn(Optional.of(route));
        when(userRepository.findById(5L)).thenReturn(Optional.of(logist));
        when(routeStatusRepository.findByName("Активен")).thenReturn(Optional.of(active));
        when(routePointRepository.findByRouteIdOrderBySequenceNumber(10L)).thenReturn(List.of());
        when(notificationFactory.create(org.mockito.ArgumentMatchers.eq(courier), org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.anyString())).thenAnswer(invocation -> {
            Notification notification = new Notification();
            notification.setUser(invocation.getArgument(0));
            notification.setTitle(invocation.getArgument(1));
            notification.setMessage(invocation.getArgument(2));
            return notification;
        });

        try (MockedStatic<SecurityUtils> securityUtils = mockStatic(SecurityUtils.class)) {
            securityUtils.when(SecurityUtils::getCurrentUserId).thenReturn(5L);

            logistService.approveRoute(10L);
        }

        assertThat(route.getStatus()).isEqualTo(active);
        assertThat(route.getLogistician()).isEqualTo(logist);
        assertThat(vehicle.getStatus().getName()).isEqualTo("В рейсе");
        verify(vehicleRepository).save(vehicle);

        ArgumentCaptor<Notification> notificationCaptor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(notificationCaptor.capture());
        assertThat(notificationCaptor.getValue().getUser()).isEqualTo(courier);
        assertThat(notificationCaptor.getValue().getTitle()).contains("Новый маршрутный лист");
    }
}
