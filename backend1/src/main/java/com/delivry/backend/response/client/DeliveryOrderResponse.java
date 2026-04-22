package com.delivry.backend.response.client;

import com.delivry.backend.domain.entity.DeliveryOrder;

import java.time.LocalDateTime;

public class DeliveryOrderResponse {

    private Long          id;
    private String        status;
    private String        pickupAddress;
    private String        deliveryAddress;
    private Double        latitude;
    private Double        longitude;
    private LocalDateTime requestedTime;
    private LocalDateTime createdAt;


    private Long   courierId;
    private String courierName;
    private String courierPhone;   // ← новое поле

    // Маршрут
    private Long   routeId;

    // Транспорт
    private String vehicleModel;   // ← новое поле
    private String vehiclePlate;   // ← новое поле

    public static DeliveryOrderResponse from(DeliveryOrder order) {
        DeliveryOrderResponse r = new DeliveryOrderResponse();
        r.id              = order.getId();
        r.status          = order.getStatus() != null ? order.getStatus().getName() : null;
        r.pickupAddress   = order.getPickupAddress();
        r.deliveryAddress = order.getDeliveryAddress();
        r.latitude        = order.getLatitude()  != null ? order.getLatitude().doubleValue()  : null;
        r.longitude       = order.getLongitude() != null ? order.getLongitude().doubleValue() : null;
        r.requestedTime   = order.getRequestedTime();
        r.createdAt       = order.getCreatedAt();
        return r;
    }



    public Long          getId()              { return id; }
    public String        getStatus()          { return status; }
    public String        getPickupAddress()   { return pickupAddress; }
    public String        getDeliveryAddress() { return deliveryAddress; }
    public Double        getLatitude()        { return latitude; }
    public Double        getLongitude()       { return longitude; }
    public LocalDateTime getRequestedTime()   { return requestedTime; }
    public LocalDateTime getCreatedAt()       { return createdAt; }
    public Long          getCourierId()       { return courierId; }
    public String        getCourierName()     { return courierName; }
    public String        getCourierPhone()    { return courierPhone; }
    public Long          getRouteId()         { return routeId; }
    public String        getVehicleModel()    { return vehicleModel; }
    public String        getVehiclePlate()    { return vehiclePlate; }



    public void setId(Long id)                        { this.id = id; }
    public void setStatus(String s)                   { this.status = s; }
    public void setPickupAddress(String s)            { this.pickupAddress = s; }
    public void setDeliveryAddress(String s)          { this.deliveryAddress = s; }
    public void setLatitude(Double v)                 { this.latitude = v; }
    public void setLongitude(Double v)                { this.longitude = v; }
    public void setRequestedTime(LocalDateTime v)     { this.requestedTime = v; }
    public void setCreatedAt(LocalDateTime v)         { this.createdAt = v; }
    public void setCourierId(Long v)                  { this.courierId = v; }
    public void setCourierName(String v)              { this.courierName = v; }
    public void setCourierPhone(String v)             { this.courierPhone = v; }
    public void setRouteId(Long v)                    { this.routeId = v; }
    public void setVehicleModel(String v)             { this.vehicleModel = v; }
    public void setVehiclePlate(String v)             { this.vehiclePlate = v; }
}