package com.delivry.backend.domain.repository;

import com.delivry.backend.domain.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {

    boolean existsByEmail(String email);

    Optional<User> findByEmail(String email);

    // Все курьеры
    @Query("SELECT u FROM User u WHERE u.role.name = 'COURIER'")
    List<User> findAllCouriers();

    // Все логисты
    @Query("SELECT u FROM User u WHERE u.role.name = 'LOGIST'")
    List<User> findAllLogisticians();

    // Пользователи по статусу
    List<User> findByStatusName(String statusName);

    // Пагинация + фильтр по роли
    @Query("SELECT u FROM User u WHERE (:roleName IS NULL OR u.role.name = :roleName) " +
            "AND (:statusName IS NULL OR u.status.name = :statusName)")
    Page<User> findAllWithFilters(
            @Param("roleName") String roleName,
            @Param("statusName") String statusName,
            Pageable pageable
    );

    // Счётчики для дашборда
    @Query("SELECT COUNT(u) FROM User u WHERE u.role.name = :roleName")
    long countByRoleName(@Param("roleName") String roleName);

    @Query("SELECT COUNT(u) FROM User u WHERE u.status.name = 'Заблокирован'")
    long countBlockedUsers();
}