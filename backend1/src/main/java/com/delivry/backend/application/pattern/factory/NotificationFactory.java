package com.delivry.backend.application.pattern.factory;

import com.delivry.backend.domain.entity.Notification;
import com.delivry.backend.domain.entity.User;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class NotificationFactory {

    public Notification create(User user, String title, String message) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setStatusNotification(0);
        notification.setCreatedAt(LocalDateTime.now());
        return notification;
    }
}
