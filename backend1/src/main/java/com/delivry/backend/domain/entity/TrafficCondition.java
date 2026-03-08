package com.delivry.backend.domain.entity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "traffic_conditions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TrafficCondition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "route_id")
    private RouteSheet route;

    @Column(name = "congestion_level")
    private Integer congestionLevel;

    @Column(name = "delay_minutes")
    private Integer delayMinutes;

    @Column(name = "recorded_at")
    private java.time.LocalDateTime recordedAt;

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

    public Integer getCongestionLevel() {
        return congestionLevel;
    }

    public void setCongestionLevel(Integer congestionLevel) {
        this.congestionLevel = congestionLevel;
    }

    public Integer getDelayMinutes() {
        return delayMinutes;
    }

    public void setDelayMinutes(Integer delayMinutes) {
        this.delayMinutes = delayMinutes;
    }

    public LocalDateTime getRecordedAt() {
        return recordedAt;
    }

    public void setRecordedAt(LocalDateTime recordedAt) {
        this.recordedAt = recordedAt;
    }
}
