package com.delivry.backend.response.courier;


import com.delivry.backend.domain.entity.DeliveryOrder;
import com.delivry.backend.domain.entity.RoutePoint;
import com.delivry.backend.domain.entity.RouteSheet;
import java.time.LocalDateTime;

public class DeliveryCheckResponse {
    // Маршрут
    private Long   routeId;
    private String courierName;
    private String courierPhone;
    private String vehicleModel;
    private String vehiclePlate;
    private LocalDateTime routePlannedStart;

    // Точка
    private Long   pointId;
    private int    sequenceNumber;
    private String address;
    private LocalDateTime plannedArrival;
    private LocalDateTime actualArrival;

    // Заказ
    private Long   orderId;
    private String pickupAddress;
    private String deliveryAddress;
    private LocalDateTime orderCreatedAt;

    // Клиент
    private String clientName;
    private String clientPhone;
    private String clientCompany;

    public static DeliveryCheckResponse from(RouteSheet route, RoutePoint point) {
        DeliveryCheckResponse r = new DeliveryCheckResponse();
        r.routeId          = route.getId();
        r.routePlannedStart = route.getPlannedStart();

        if (route.getCourier() != null) {
            r.courierName  = route.getCourier().getFullName();
            r.courierPhone = route.getCourier().getPhone();
        }
        if (route.getVehicle() != null) {
            r.vehicleModel = route.getVehicle().getModel();
            r.vehiclePlate = route.getVehicle().getPlateNumber();
        }

        r.pointId        = point.getId();
        r.sequenceNumber = point.getSequenceNumber();
        r.address        = point.getAddress();
        r.plannedArrival = point.getPlannedArrival();
        r.actualArrival  = point.getActualArrival();

        if (point.getOrder() != null) {
            DeliveryOrder order = point.getOrder();
            r.orderId        = order.getId();
            r.pickupAddress  = order.getPickupAddress();
            r.deliveryAddress = order.getDeliveryAddress();
            r.orderCreatedAt  = order.getCreatedAt();

            if (order.getClient() != null && order.getClient().getUser() != null) {
                r.clientName    = order.getClient().getUser().getFullName();
                r.clientPhone   = order.getClient().getUser().getPhone();
                r.clientCompany = order.getClient().getCompanyName();
            }
        }
        return r;
    }

    // Getters
    public Long   getRouteId()           { return routeId; }
    public String getCourierName()       { return courierName; }
    public String getCourierPhone()      { return courierPhone; }
    public String getVehicleModel()      { return vehicleModel; }
    public String getVehiclePlate()      { return vehiclePlate; }
    public LocalDateTime getRoutePlannedStart() { return routePlannedStart; }
    public Long   getPointId()           { return pointId; }
    public int    getSequenceNumber()    { return sequenceNumber; }
    public String getAddress()           { return address; }
    public LocalDateTime getPlannedArrival() { return plannedArrival; }
    public LocalDateTime getActualArrival()  { return actualArrival; }
    public Long   getOrderId()           { return orderId; }
    public String getPickupAddress()     { return pickupAddress; }
    public String getDeliveryAddress()   { return deliveryAddress; }
    public LocalDateTime getOrderCreatedAt() { return orderCreatedAt; }
    public String getClientName()        { return clientName; }
    public String getClientPhone()       { return clientPhone; }
    public String getClientCompany()     { return clientCompany; }
}
