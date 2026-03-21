package com.delivry.backend.domain.repository;
import com.delivry.backend.domain.entity.*;
import com.delivry.backend.domain.enums.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
@Repository
public interface RoutePointRepository extends JpaRepository<RoutePoint, Long> {

    // Все точки маршрута, отсортированные по порядку
    List<RoutePoint> findByRouteIdOrderBySequenceNumberAsc(Long routeId);

    // Точки с определённым статусом в маршруте
    List<RoutePoint> findByRouteIdAndStatusName(Long routeId, String statusName);

    // Следующая точка маршрута (первая со статусом "Ожидается")
    @Query("SELECT rp FROM RoutePoint rp WHERE rp.route.id = :routeId " +
            "AND rp.status.name = 'Ожидается' ORDER BY rp.sequenceNumber ASC")
    List<RoutePoint> findNextPendingPoints(@Param("routeId") Long routeId);

    // Точки по конкретному заказу
    List<RoutePoint> findByOrderId(Long orderId);

    List<RoutePoint> findByRouteIdOrderBySequenceNumber(Long routeId);
}
