package com.delivry.backend.domain.repository;
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
public interface CourierRatingsRepository extends JpaRepository<CourierRating, Long> {

    // Все оценки конкретного курьера
    List<CourierRating> findByCourierIdOrderByCreatedAtDesc(Long courierId);

    // Средний рейтинг курьера
    @Query("SELECT AVG(r.rating) FROM CourierRating r WHERE r.courier.id = :courierId")
    Double findAverageRatingByCourierId(@Param("courierId") Long courierId);

    // Все оценки, оставленные клиентом
    List<CourierRating> findByClientUserId(Long clientUserId);

    // Оценки по маршруту
    List<CourierRating> findByRouteId(Long routeId);
}
