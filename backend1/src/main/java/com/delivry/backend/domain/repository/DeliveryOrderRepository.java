package com.delivry.backend.domain.repository;

import com.delivry.backend.domain.entity.DeliveryOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import com.delivry.backend.domain.entity.*;
import com.delivry.backend.domain.enums.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
@Repository
public interface DeliveryOrderRepository extends JpaRepository<DeliveryOrder, Long> {

    // Все заказы конкретного клиента
    List<DeliveryOrder> findByClientUserId(Long clientUserId);

    // Заказы по статусу (например, "Создан" — не назначенные)
    List<DeliveryOrder> findByStatusName(String statusName);

    // Заказы клиента с нужным статусом
    List<DeliveryOrder> findByClientUserIdAndStatusName(Long clientUserId, String statusName);

    // Заказы, запрошенные в диапазоне времени (для планирования маршрутов)
    @Query("SELECT o FROM DeliveryOrder o WHERE o.requestedTime BETWEEN :from AND :to")
    List<DeliveryOrder> findByRequestedTimeBetween(
            @Param("from") LocalDateTime from,
            @Param("to")   LocalDateTime to
    );

     @Query("SELECT COUNT(o) FROM DeliveryOrder o WHERE o.status.name = :name")
     long countByStatusName(@Param("name") String name);

}
