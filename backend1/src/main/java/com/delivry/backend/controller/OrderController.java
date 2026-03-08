package com.delivry.backend.controller;

import com.delivry.backend.application.dto.OrderDTO;
//import com.delivry.backend.application.service.OrderService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;
//
//@RestController
//@RequestMapping("/api/orders")
//public class OrderController {
//
//    private final OrderService orderService;
//
//    @PostMapping
//    public OrderDTO createOrder(@RequestBody CreateOrderDTO dto) {
//        return orderService.createOrder(dto);
//    }
//
//    @GetMapping
//    public Page<OrderDTO> getOrders(Pageable pageable) {
//        return orderService.getOrders(pageable);
//    }
//
//}
