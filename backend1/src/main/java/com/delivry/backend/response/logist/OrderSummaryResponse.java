package com.delivry.backend.response.logist;
import com.delivry.backend.domain.entity.DeliveryOrder;

import java.math.BigDecimal;
import java.time.LocalDateTime;


public class OrderSummaryResponse {
    private Long          id;
    private String        status;
    private String        pickupAddress;
    private String        deliveryAddress;
    private BigDecimal    latitude;
    private BigDecimal    longitude;
    private LocalDateTime requestedTime;
    private LocalDateTime createdAt;
    private String        clientName;

    public static OrderSummaryResponse from(DeliveryOrder o) {
        OrderSummaryResponse r = new OrderSummaryResponse();
        r.id              = o.getId();
        r.status          = o.getStatus() != null ? o.getStatus().getName() : null;
        r.pickupAddress   = o.getPickupAddress();
        r.deliveryAddress = o.getDeliveryAddress();
        r.latitude        = BigDecimal.valueOf(o.getLatitude());
        r.longitude       = BigDecimal.valueOf(o.getLongitude());
        r.requestedTime   = o.getRequestedTime();
        r.createdAt       = o.getCreatedAt();
        if (o.getClient() != null && o.getClient().getUser() != null) {
            r.clientName = o.getClient().getUser().getFullName();
        }
        return r;
    }

    public Long          getId()              { return id; }
    public String        getStatus()          { return status; }
    public String        getPickupAddress()   { return pickupAddress; }
    public String        getDeliveryAddress() { return deliveryAddress; }
    public BigDecimal    getLatitude()        { return latitude; }
    public BigDecimal    getLongitude()       { return longitude; }
    public LocalDateTime getRequestedTime()   { return requestedTime; }
    public LocalDateTime getCreatedAt()       { return createdAt; }
    public String        getClientName()      { return clientName; }
}
