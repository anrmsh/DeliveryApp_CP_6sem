package com.delivry.backend.domain.repository;

import com.delivry.backend.domain.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);

    java.util.Optional<Notification> findByIdAndUserId(Long id, Long userId);

    long countByUserIdAndStatusNotification(Long userId, Integer statusNotification);

    @Modifying
    @Query("UPDATE Notification n SET n.statusNotification = 1 WHERE n.user.id = :userId")
    void markAllReadByUserId(@Param("userId") Long userId);
}
