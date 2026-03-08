package com.delivry.backend.domain.entity;
import com.delivry.backend.domain.enums.RoutePointStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "route_point")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoutePoint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "route_id")
    private RouteSheet route;

    @ManyToOne
    @JoinColumn(name = "order_id")
    private DeliveryOrder order;

    @Column(name = "sequence_number")
    private Integer sequenceNumber;

    private String address;

    private Double latitude;

    private Double longitude;

    @Column(name = "planned_arrival")
    private java.time.LocalDateTime plannedArrival;

    @Column(name = "actual_arrival")
    private java.time.LocalDateTime actualArrival;

    @ManyToOne
    @JoinColumn(name = "status_id")
    private RoutePointStatus status;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public RouteSheet getRoute() {
        return route;
    }

    public void setRoute(RouteSheet route) {
        this.route = route;
    }

    public DeliveryOrder getOrder() {
        return order;
    }

    public void setOrder(DeliveryOrder order) {
        this.order = order;
    }

    public Integer getSequenceNumber() {
        return sequenceNumber;
    }

    public void setSequenceNumber(Integer sequenceNumber) {
        this.sequenceNumber = sequenceNumber;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
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

    public LocalDateTime getPlannedArrival() {
        return plannedArrival;
    }

    public void setPlannedArrival(LocalDateTime plannedArrival) {
        this.plannedArrival = plannedArrival;
    }

    public LocalDateTime getActualArrival() {
        return actualArrival;
    }

    public void setActualArrival(LocalDateTime actualArrival) {
        this.actualArrival = actualArrival;
    }

    public RoutePointStatus getStatus() {
        return status;
    }

    public void setStatus(RoutePointStatus status) {
        this.status = status;
    }
}
