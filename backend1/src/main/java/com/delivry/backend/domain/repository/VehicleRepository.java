package com.delivry.backend.domain.repository;
import com.delivry.backend.domain.entity.*;
import com.delivry.backend.domain.enums.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Long> {

    Optional<Vehicle> findByPlateNumber(String plateNumber);

    // Все доступные ТС (статус = "Доступен")
    List<Vehicle> findByStatusName(String statusName);

    // ТС с грузоподъёмностью не менее нужной
    @Query("SELECT v FROM Vehicle v WHERE v.status.name = 'Доступен' " +
            "AND v.capacityKg >= :minCapacity AND v.volumeM3 >= :minVolume")
    List<Vehicle> findAvailableByCapacity(
            @Param("minCapacity") BigDecimal minCapacity,
            @Param("minVolume")   BigDecimal minVolume
    );
}
