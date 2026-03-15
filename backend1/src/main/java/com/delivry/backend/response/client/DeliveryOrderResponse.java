package com.delivry.backend.response.client;

import com.delivry.backend.domain.entity.DeliveryOrder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class DeliveryOrderResponse {

    private Long id;

    private String pickupAddress;

    private String deliveryAddress;

    private String status;

    private LocalDateTime createdAt;

    public static DeliveryOrderResponse from(DeliveryOrder order){

        DeliveryOrderResponse r = new DeliveryOrderResponse();

        r.setId(order.getId());
        r.setPickupAddress(order.getPickupAddress());
        r.setDeliveryAddress(order.getDeliveryAddress());
        r.setStatus(order.getStatus().getName());
        r.setCreatedAt(order.getCreatedAt());

        return r;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
