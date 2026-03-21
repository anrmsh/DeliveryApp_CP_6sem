package com.delivry.backend.response.logist;

import com.delivry.backend.domain.entity.RoutePoint;
import com.delivry.backend.domain.entity.RouteSheet;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

public class RouteSheetResponse {
    private Long                id;
    private String              status;
    private String              courierName;
    private Long                courierId;
    private String              vehicleModel;
    private String              vehiclePlate;
    private Long                vehicleId;
    private LocalDateTime       plannedStart;
    private LocalDateTime       plannedEnd;
    private BigDecimal          actualDistanceKm;
    private LocalDateTime       createdAt;
    private List<RoutePointDto> points;

    /**
     * Use this when you already have the route points loaded separately.
     * Pass an empty list if not needed.
     */
    public static RouteSheetResponse from(RouteSheet r, List<RoutePoint> routePoints) {
        RouteSheetResponse resp = new RouteSheetResponse();
        resp.id               = r.getId();
        resp.status           = r.getStatus() != null ? r.getStatus().getName() : null;
        resp.plannedStart     = r.getPlannedStart();
        resp.plannedEnd       = r.getPlannedEnd();
        resp.actualDistanceKm = r.getActualDistanceKm() != null
                ? BigDecimal.valueOf(r.getActualDistanceKm()) : null;
        resp.createdAt        = r.getCreatedAt();

        if (r.getCourier() != null) {
            resp.courierName = r.getCourier().getFullName();
            resp.courierId   = r.getCourier().getId();
        }
        if (r.getVehicle() != null) {
            resp.vehicleModel = r.getVehicle().getModel();
            resp.vehiclePlate = r.getVehicle().getPlateNumber();
            resp.vehicleId    = r.getVehicle().getId();
        }

        if (routePoints != null) {
            resp.points = routePoints.stream()
                    .sorted(java.util.Comparator.comparingInt(RoutePoint::getSequenceNumber))
                    .map(RoutePointDto::from)
                    .toList();
        } else {
            resp.points = Collections.emptyList();
        }

        return resp;
    }

    /** Convenience overload — no points */
    public static RouteSheetResponse from(RouteSheet r) {
        return from(r, Collections.emptyList());
    }

    public Long                getId()               { return id; }
    public String              getStatus()           { return status; }
    public String              getCourierName()      { return courierName; }
    public Long                getCourierId()        { return courierId; }
    public String              getVehicleModel()     { return vehicleModel; }
    public String              getVehiclePlate()     { return vehiclePlate; }
    public Long                getVehicleId()        { return vehicleId; }
    public LocalDateTime       getPlannedStart()     { return plannedStart; }
    public LocalDateTime       getPlannedEnd()       { return plannedEnd; }
    public BigDecimal          getActualDistanceKm() { return actualDistanceKm; }
    public LocalDateTime       getCreatedAt()        { return createdAt; }
    public List<RoutePointDto> getPoints()           { return points; }

    // ── Nested DTO ────────────────────────────────────────────────────────
    public static class RoutePointDto {
        private Long   id;
        private int    sequenceNumber;
        private String address;
        private String status;
        private Long   orderId;

        public static RoutePointDto from(RoutePoint p) {
            RoutePointDto d = new RoutePointDto();
            d.id             = p.getId();
            d.sequenceNumber = p.getSequenceNumber();
            d.address        = p.getAddress();
            d.status         = p.getStatus() != null ? p.getStatus().getName() : null;
            d.orderId        = p.getOrder() != null ? p.getOrder().getId() : null;
            return d;
        }

        public Long   getId()             { return id; }
        public int    getSequenceNumber() { return sequenceNumber; }
        public String getAddress()        { return address; }
        public String getStatus()         { return status; }
        public Long   getOrderId()        { return orderId; }
    }
}