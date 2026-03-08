package com.delivry.backend.domain.repository;

import com.delivry.backend.domain.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // Все уведомления пользователя, новые первыми
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);

    // Непрочитанные уведомления (status_notification = 0)
    List<Notification> findByUserIdAndStatusNotification(Long userId, Integer status);

    // Количество непрочитанных
    long countByUserIdAndStatusNotification(Long userId, Integer status);
}
