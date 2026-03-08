package com.delivry.backend.domain.repository;

import com.delivry.backend.domain.entity.RouteSheet;
import org.springframework.data.jpa.repository.JpaRepository;
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
public interface RouteSheetRepository extends JpaRepository<RouteSheet, Long> {

    // Маршруты конкретного курьера
    List<RouteSheet> findByCourierId(Long courierId);

    // Маршруты, назначенные конкретным логистом
    List<RouteSheet> findByLogisticianId(Long logisticianId);

    // Маршруты по статусу (например, "Активен")
    List<RouteSheet> findByStatusName(String statusName);

    // Активные маршруты курьера
    List<RouteSheet> findByCourierIdAndStatusName(Long courierId, String statusName);

    // Маршруты на конкретном ТС
    List<RouteSheet> findByVehicleId(Long vehicleId);

    // Маршруты, стартующие в заданном окне времени (для планирования)
    @Query("SELECT r FROM RouteSheet r WHERE r.plannedStart BETWEEN :from AND :to")
    List<RouteSheet> findByPlannedStartBetween(
            @Param("from") LocalDateTime from,
            @Param("to")   LocalDateTime to
    );

    // Маршруты курьера, не завершённые и не отменённые
    @Query("SELECT r FROM RouteSheet r WHERE r.courier.id = :courierId " +
            "AND r.status.name NOT IN ('Завершён', 'Отменён')")
    List<RouteSheet> findActiveRoutesForCourier(@Param("courierId") Long courierId);
}
