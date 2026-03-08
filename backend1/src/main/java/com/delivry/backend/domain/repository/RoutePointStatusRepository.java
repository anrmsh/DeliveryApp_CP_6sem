package com.delivry.backend.domain.repository;

import com.delivry.backend.domain.enums.RoutePointStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoutePointStatusRepository extends JpaRepository<RoutePointStatus, Integer> {
    Optional<RoutePointStatus> findByName(String name);
}

