package com.delivry.backend.domain.repository;

import com.delivry.backend.domain.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
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
public interface UserRepository extends JpaRepository<User, Long> {

    boolean existsByEmail(String email);

    Optional<User> findByEmail(String email);

    // Все курьеры
    @Query("SELECT u FROM User u WHERE u.role.name = 'Курьер'")
    List<User> findAllCouriers();

    // Все логисты
    @Query("SELECT u FROM User u WHERE u.role.name = 'Логист'")
    List<User> findAllLogisticians();

    // Пользователи по статусу (активен / заблокирован)
    List<User> findByStatusName(String statusName);
}
