package com.delivry.backend.domain.repository;

import com.delivry.backend.domain.entity.TrafficCondition;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TrafficConditionsRepository extends JpaRepository<TrafficCondition, Long> {

    // Все записи о пробках по маршруту
    List<TrafficCondition> findByRouteIdOrderByRecordedAtDesc(Long routeId);

    // Последняя запись о пробках для маршрута
    Optional<TrafficCondition> findTopByRouteIdOrderByRecordedAtDesc(Long routeId);

    // Маршруты с высоким уровнем пробок (congestion_level >= порог)
    @Query("SELECT t FROM TrafficCondition t WHERE t.congestionLevel >= :level " +
            "AND t.recordedAt >= :since")
    List<TrafficCondition> findHighCongestionSince(
            @Param("level") int level,
            @Param("since") LocalDateTime since
    );

    // Суммарная задержка по маршруту
    @Query("SELECT SUM(t.delayMinutes) FROM TrafficCondition t WHERE t.route.id = :routeId")
    Integer sumDelayByRouteId(@Param("routeId") Long routeId);
}
