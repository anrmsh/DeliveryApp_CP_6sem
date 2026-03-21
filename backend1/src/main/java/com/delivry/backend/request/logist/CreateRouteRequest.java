package com.delivry.backend.request.logist;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.List;

public class CreateRouteRequest {

    @NotNull(message = "Courier is required")
    private Long courierId;

    @NotNull(message = "Vehicle is required")
    private Long vehicleId;

    private LocalDateTime plannedStart;
    private LocalDateTime plannedEnd;

    /** IDs of orders to attach to this route as route points */
    private List<Long> orderIds;

    public Long getCourierId()                   { return courierId; }
    public void setCourierId(Long v)             { this.courierId = v; }

    public Long getVehicleId()                   { return vehicleId; }
    public void setVehicleId(Long v)             { this.vehicleId = v; }

    public LocalDateTime getPlannedStart()       { return plannedStart; }
    public void setPlannedStart(LocalDateTime v) { this.plannedStart = v; }

    public LocalDateTime getPlannedEnd()         { return plannedEnd; }
    public void setPlannedEnd(LocalDateTime v)   { this.plannedEnd = v; }

    public List<Long> getOrderIds()              { return orderIds; }
    public void setOrderIds(List<Long> v)        { this.orderIds = v; }
}
