package com.delivry.backend.response.courier;

import com.delivry.backend.domain.entity.RoutePoint;
import com.delivry.backend.domain.entity.RouteSheet;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class CourierRouteResponse {
    private Long   id;
    private String status;
    private String vehicleModel;
    private String vehiclePlate;
    private LocalDateTime plannedStart;
    private LocalDateTime plannedEnd;
    private Double actualDistanceKm;
    private List<PointDto> points;

    public static CourierRouteResponse from(RouteSheet r, List<RoutePoint> points) {
        CourierRouteResponse resp = new CourierRouteResponse();
        resp.id              = r.getId();
        resp.status          = r.getStatus() != null ? r.getStatus().getName() : null;
        resp.plannedStart    = r.getPlannedStart();
        resp.plannedEnd      = r.getPlannedEnd();
        resp.actualDistanceKm = r.getActualDistanceKm();
        if (r.getVehicle() != null) {
            resp.vehicleModel = r.getVehicle().getModel();
            resp.vehiclePlate = r.getVehicle().getPlateNumber();
        }
        resp.points = points.stream().map(PointDto::from).toList();
        return resp;
    }

    public Long   getId()              { return id; }
    public String getStatus()          { return status; }
    public String getVehicleModel()    { return vehicleModel; }
    public String getVehiclePlate()    { return vehiclePlate; }
    public LocalDateTime getPlannedStart()  { return plannedStart; }
    public LocalDateTime getPlannedEnd()    { return plannedEnd; }
    public Double getActualDistanceKm()     { return actualDistanceKm; }
    public List<PointDto> getPoints()       { return points; }

    public static class PointDto {
        private Long   id;
        private int    sequenceNumber;
        private String address;
        private String status;
        private Long   orderId;
        private BigDecimal latitude;
        private BigDecimal longitude;
        private LocalDateTime plannedArrival;
        private LocalDateTime actualArrival;
        // Client info from order
        private String clientName;
        private String clientPhone;

        public static PointDto from(RoutePoint p) {
            PointDto d = new PointDto();
            d.id             = p.getId();
            d.sequenceNumber = p.getSequenceNumber();
            d.address        = p.getAddress();
            d.status         = p.getStatus() != null ? p.getStatus().getName() : null;
            d.latitude       = BigDecimal.valueOf(p.getLatitude());
            d.longitude      = BigDecimal.valueOf(p.getLongitude());
            d.plannedArrival = p.getPlannedArrival();
            d.actualArrival  = p.getActualArrival();
            if (p.getOrder() != null) {
                d.orderId = p.getOrder().getId();
                if (p.getOrder().getClient() != null && p.getOrder().getClient().getUser() != null) {
                    d.clientName  = p.getOrder().getClient().getUser().getFullName();
                    d.clientPhone = p.getOrder().getClient().getUser().getPhone();
                }
            }
            return d;
        }

        public Long   getId()             { return id; }
        public int    getSequenceNumber() { return sequenceNumber; }
        public String getAddress()        { return address; }
        public String getStatus()         { return status; }
        public Long   getOrderId()        { return orderId; }
        public BigDecimal getLatitude()   { return latitude; }
        public BigDecimal getLongitude()  { return longitude; }
        public LocalDateTime getPlannedArrival() { return plannedArrival; }
        public LocalDateTime getActualArrival()  { return actualArrival; }
        public String getClientName()     { return clientName; }
        public String getClientPhone()    { return clientPhone; }
    }
}
