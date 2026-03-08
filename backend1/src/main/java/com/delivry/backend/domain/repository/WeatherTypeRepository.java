package com.delivry.backend.domain.repository;
import com.delivry.backend.domain.entity.*;
import com.delivry.backend.domain.enums.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;


@Repository
public interface WeatherTypeRepository extends JpaRepository<WeatherType, Integer> {
    Optional<WeatherType> findByName(String name);
}
