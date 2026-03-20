package com.delivry.backend.response.client;

import com.delivry.backend.domain.entity.Notification;

import java.time.LocalDateTime;

public class NotificationResponse {

    private Long          id;
    private String        title;
    private String        message;
    private Integer       statusNotification;
    private LocalDateTime createdAt;

    public static NotificationResponse from(Notification n) {
        NotificationResponse r = new NotificationResponse();
        r.id                 = n.getId();
        r.title              = n.getTitle();
        r.message            = n.getMessage();
        r.statusNotification = n.getStatusNotification();
        r.createdAt          = n.getCreatedAt();
        return r;
    }

    public Long          getId()                 { return id; }
    public String        getTitle()              { return title; }
    public String        getMessage()            { return message; }
    public Integer       getStatusNotification() { return statusNotification; }
    public LocalDateTime getCreatedAt()          { return createdAt; }
}