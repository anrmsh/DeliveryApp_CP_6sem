package com.delivry.backend.domain.repository;
import com.delivry.backend.domain.entity.*;
import com.delivry.backend.domain.enums.*;

import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
@Repository
public interface WeatherConditionsRepository extends JpaRepository<WeatherCondition, Long> {

    // Все погодные записи по маршруту
    List<WeatherCondition> findByRouteIdOrderByRecordedAtDesc(Long routeId);

    // Последняя погодная запись для маршрута
    Optional<WeatherCondition> findTopByRouteIdOrderByRecordedAtDesc(Long routeId);

    // Опасные погодные условия (снег, туман, гроза) за последний период
    @Query("SELECT w FROM WeatherCondition w WHERE w.weatherType.name IN :types " +
            "AND w.recordedAt >= :since")
    List<WeatherCondition> findByWeatherTypesSince(
            @Param("types") List<String> types,
            @Param("since") LocalDateTime since
    );

    // Маршруты с осадками выше порога (риск задержки)
    @Query("SELECT w FROM WeatherCondition w WHERE w.precipitationMm >= :threshold " +
            "AND w.recordedAt >= :since")
    List<WeatherCondition> findHeavyRainSince(
            @Param("threshold") double threshold,
            @Param("since")     LocalDateTime since
    );
}
