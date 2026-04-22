package com.delivry.backend.response.logist;

import com.delivry.backend.domain.entity.CourierRating;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CourierRatingDetailResponse {
    private Long   id;
    private Integer rating;
    private String  comment;
    private String  clientName;
    private Long    orderId;
    private Long    routeId;
    private LocalDateTime createdAt;

    public static CourierRatingDetailResponse from(CourierRating r) {
        CourierRatingDetailResponse dto = new CourierRatingDetailResponse();
        dto.setId(r.getId());
        dto.setRating(r.getRating());
        dto.setComment(r.getComment());
        dto.setCreatedAt(r.getCreatedAt());
        if (r.getClient() != null && r.getClient().getUser() != null)
            dto.setClientName(r.getClient().getUser().getFullName());
        if (r.getRoute() != null)
            dto.setRouteId(r.getRoute().getId());
        return dto;
    }


    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public String getClientName() {
        return clientName;
    }

    public void setClientName(String clientName) {
        this.clientName = clientName;
    }

    public Long getRouteId() {
        return routeId;
    }

    public void setRouteId(Long routeId) {
        this.routeId = routeId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
