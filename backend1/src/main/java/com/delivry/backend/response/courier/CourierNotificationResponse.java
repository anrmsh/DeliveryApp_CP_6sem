package com.delivry.backend.response.courier;

import com.delivry.backend.domain.entity.Notification;

import java.time.LocalDateTime;

public class CourierNotificationResponse {
    private Long          id;
    private String        title;
    private String        message;
    private int           statusNotification;
    private LocalDateTime createdAt;

    public static CourierNotificationResponse from(Notification n) {
        CourierNotificationResponse r = new CourierNotificationResponse();
        r.id                 = n.getId();
        r.title              = n.getTitle();
        r.message            = n.getMessage();
        r.statusNotification = n.getStatusNotification() != null ? n.getStatusNotification() : 0;
        r.createdAt          = n.getCreatedAt();
        return r;
    }

    public Long          getId()                 { return id; }
    public String        getTitle()              { return title; }
    public String        getMessage()            { return message; }
    public int           getStatusNotification() { return statusNotification; }
    public LocalDateTime getCreatedAt()          { return createdAt; }
}
