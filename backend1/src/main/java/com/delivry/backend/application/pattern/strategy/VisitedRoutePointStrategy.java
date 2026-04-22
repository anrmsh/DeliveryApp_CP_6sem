package com.delivry.backend.application.pattern.strategy;

import com.delivry.backend.application.pattern.factory.NotificationFactory;
import com.delivry.backend.domain.entity.DeliveryOrder;
import com.delivry.backend.domain.entity.RoutePoint;
import com.delivry.backend.domain.entity.User;
import com.delivry.backend.domain.repository.DeliveryStatusRepository;
import com.delivry.backend.domain.repository.NotificationRepository;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class VisitedRoutePointStrategy implements RoutePointStatusStrategy {

    private final DeliveryStatusRepository deliveryStatusRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationFactory notificationFactory;

    public VisitedRoutePointStrategy(DeliveryStatusRepository deliveryStatusRepository,
                                     NotificationRepository notificationRepository,
                                     NotificationFactory notificationFactory) {
        this.deliveryStatusRepository = deliveryStatusRepository;
        this.notificationRepository = notificationRepository;
        this.notificationFactory = notificationFactory;
    }

    @Override
    public boolean supports(String statusName) {
        return "Посещена".equals(statusName);
    }

    @Override
    public void apply(RoutePoint routePoint) {
        routePoint.setActualArrival(LocalDateTime.now());

        DeliveryOrder order = routePoint.getOrder();
        if (order == null) {
            return;
        }

        order.setStatus(deliveryStatusRepository.findByName("Доставлен").orElseThrow());

        if (order.getClient() != null && order.getClient().getUser() != null) {
            User clientUser = order.getClient().getUser();
            notificationRepository.save(notificationFactory.create(
                    clientUser,
                    "Заказ #" + order.getId() + " доставлен",
                    "Ваш заказ доставлен по адресу: " + order.getDeliveryAddress()
            ));
        }
    }
}
