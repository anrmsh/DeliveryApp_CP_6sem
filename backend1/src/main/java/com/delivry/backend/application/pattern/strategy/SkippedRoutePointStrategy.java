package com.delivry.backend.application.pattern.strategy;

import com.delivry.backend.application.pattern.factory.NotificationFactory;
import com.delivry.backend.domain.entity.DeliveryOrder;
import com.delivry.backend.domain.entity.RoutePoint;
import com.delivry.backend.domain.entity.User;
import com.delivry.backend.domain.repository.NotificationRepository;
import org.springframework.stereotype.Component;

@Component
public class SkippedRoutePointStrategy implements RoutePointStatusStrategy {

    private final NotificationRepository notificationRepository;
    private final NotificationFactory notificationFactory;

    public SkippedRoutePointStrategy(NotificationRepository notificationRepository,
                                     NotificationFactory notificationFactory) {
        this.notificationRepository = notificationRepository;
        this.notificationFactory = notificationFactory;
    }

    @Override
    public boolean supports(String statusName) {
        return "Пропущена".equals(statusName);
    }

    @Override
    public void apply(RoutePoint routePoint) {
        DeliveryOrder order = routePoint.getOrder();
        if (order == null || order.getClient() == null || order.getClient().getUser() == null) {
            return;
        }

        User clientUser = order.getClient().getUser();
        notificationRepository.save(notificationFactory.create(
                clientUser,
                "Доставка заказа #" + order.getId() + " не состоялась",
                "Курьер не смог доставить заказ по адресу: " + order.getDeliveryAddress() + ". Свяжитесь с поддержкой."
        ));
    }
}
