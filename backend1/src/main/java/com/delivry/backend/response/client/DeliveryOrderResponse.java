package com.delivry.backend.response.client;

import com.delivry.backend.domain.entity.DeliveryOrder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class DeliveryOrderResponse {

    private Long          id;
    private String        status;
    private String        pickupAddress;
    private String        deliveryAddress;
    private Double        latitude;
    private Double        longitude;
    private LocalDateTime requestedTime;
    private LocalDateTime createdAt;

    /** Populated when a route sheet with a courier has been assigned */
    private Long   courierId;
    private String courierName;
    private Long   routeId;

    public static DeliveryOrderResponse from(DeliveryOrder order) {
        DeliveryOrderResponse r = new DeliveryOrderResponse();
        r.setId(order.getId());
        r.setStatus(order.getStatus() != null ? order.getStatus().getName() : null);
        r.setPickupAddress(order.getPickupAddress());
        r.setDeliveryAddress(order.getDeliveryAddress());
        r.setLatitude(order.getLatitude() != null ? order.getLatitude().doubleValue() : null);
        r.setLongitude(order.getLongitude() != null ? order.getLongitude().doubleValue() : null);
        r.setRequestedTime(order.getRequestedTime());
        r.setCreatedAt(order.getCreatedAt());
        return r;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getPickupAddress() {
        return pickupAddress;
    }

    public void setPickupAddress(String pickupAddress) {
        this.pickupAddress = pickupAddress;
    }

    public String getDeliveryAddress() {
        return deliveryAddress;
    }

    public void setDeliveryAddress(String deliveryAddress) {
        this.deliveryAddress = deliveryAddress;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public LocalDateTime getRequestedTime() {
        return requestedTime;
    }

    public void setRequestedTime(LocalDateTime requestedTime) {
        this.requestedTime = requestedTime;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Long getCourierId() {
        return courierId;
    }

    public void setCourierId(Long courierId) {
        this.courierId = courierId;
    }

    public String getCourierName() {
        return courierName;
    }

    public void setCourierName(String courierName) {
        this.courierName = courierName;
    }

    public Long getRouteId() {
        return routeId;
    }

    public void setRouteId(Long routeId) {
        this.routeId = routeId;
    }
}