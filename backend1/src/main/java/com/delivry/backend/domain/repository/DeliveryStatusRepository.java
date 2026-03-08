package com.delivry.backend.domain.repository;

import com.delivry.backend.domain.enums.DeliveryStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DeliveryStatusRepository extends JpaRepository<DeliveryStatus, Integer> {
    Optional<DeliveryStatus> findByName(String name);
}
