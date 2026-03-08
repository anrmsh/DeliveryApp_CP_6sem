package com.delivry.backend.application.service;


import com.delivry.backend.domain.entity.DeliveryOrder;
import com.delivry.backend.domain.repository.OrderRepository;
import org.springframework.stereotype.Service;

//@Service
//public class OrderService {
//
//    private final OrderRepository orderRepository;
//
//    public DeliveryOrder createOrder(CreateOrderDTO dto) {
//
//        DeliveryOrder order = new DeliveryOrder();
//        order.setPickupAddress(dto.getPickupAddress());
//        order.setDeliveryAddress(dto.getDeliveryAddress());
//
//        return orderRepository.save(order);
//    }
//
//}
