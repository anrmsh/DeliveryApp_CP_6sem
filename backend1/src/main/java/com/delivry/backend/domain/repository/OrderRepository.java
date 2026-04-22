package com.delivry.backend.domain.repository;

import com.delivry.backend.domain.entity.DeliveryOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderRepository extends JpaRepository<DeliveryOrder, Long> {


    Page<DeliveryOrder> findByClientUserId(Long clientUserId, Pageable pageable);

}