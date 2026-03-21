package com.delivry.backend.response.courier;

import com.delivry.backend.domain.entity.User;

import java.time.LocalDateTime;

public class CourierProfileResponse {
    private Long          id;
    private String        fullName;
    private String        email;
    private String        phone;
    private String        status;
    private LocalDateTime createdAt;
    private double        averageRating;
    private int           totalRatings;

    public static CourierProfileResponse from(User u, double avgRating, int totalRatings) {
        CourierProfileResponse r = new CourierProfileResponse();
        r.id           = u.getId();
        r.fullName     = u.getFullName();
        r.email        = u.getEmail();
        r.phone        = u.getPhone();
        r.status       = u.getStatus() != null ? u.getStatus().getName() : null;
        r.createdAt    = u.getCreatedAt();
        r.averageRating = avgRating;
        r.totalRatings  = totalRatings;
        return r;
    }

    public Long          getId()            { return id; }
    public String        getFullName()      { return fullName; }
    public String        getEmail()         { return email; }
    public String        getPhone()         { return phone; }
    public String        getStatus()        { return status; }
    public LocalDateTime getCreatedAt()     { return createdAt; }
    public double        getAverageRating() { return averageRating; }
    public int           getTotalRatings()  { return totalRatings; }
}
