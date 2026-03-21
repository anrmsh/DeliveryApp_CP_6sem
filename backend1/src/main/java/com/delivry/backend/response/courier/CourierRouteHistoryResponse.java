package com.delivry.backend.response.courier;

import com.delivry.backend.domain.entity.RoutePoint;
import com.delivry.backend.domain.entity.RouteSheet;

import java.time.LocalDateTime;
import java.util.List;

public class CourierRouteHistoryResponse {
    private Long          id;
    private LocalDateTime plannedStart;
    private LocalDateTime plannedEnd;
    private Double        actualDistanceKm;
    private String        vehicleModel;
    private String        vehiclePlate;
    private int           totalPoints;
    private int           visitedPoints;
    private LocalDateTime createdAt;

    public static CourierRouteHistoryResponse from(RouteSheet r, List<RoutePoint> points) {
        CourierRouteHistoryResponse h = new CourierRouteHistoryResponse();
        h.id               = r.getId();
        h.plannedStart     = r.getPlannedStart();
        h.plannedEnd       = r.getPlannedEnd();
        h.actualDistanceKm = r.getActualDistanceKm();
        h.createdAt        = r.getCreatedAt();
        if (r.getVehicle() != null) {
            h.vehicleModel = r.getVehicle().getModel();
            h.vehiclePlate = r.getVehicle().getPlateNumber();
        }
        h.totalPoints   = points.size();
        h.visitedPoints = (int) points.stream()
                .filter(p -> p.getStatus() != null && "Посещена".equals(p.getStatus().getName()))
                .count();
        return h;
    }

    public Long          getId()               { return id; }
    public LocalDateTime getPlannedStart()     { return plannedStart; }
    public LocalDateTime getPlannedEnd()       { return plannedEnd; }
    public Double        getActualDistanceKm() { return actualDistanceKm; }
    public String        getVehicleModel()     { return vehicleModel; }
    public String        getVehiclePlate()     { return vehiclePlate; }
    public int           getTotalPoints()      { return totalPoints; }
    public int           getVisitedPoints()    { return visitedPoints; }
    public LocalDateTime getCreatedAt()        { return createdAt; }
}
