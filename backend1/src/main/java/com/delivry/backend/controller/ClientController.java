package com.delivry.backend.controller;

import com.delivry.backend.application.service.ClientService;

import com.delivry.backend.request.client.CreateOrderRequest;
import com.delivry.backend.request.client.RatingRequest;
import com.delivry.backend.response.client.DeliveryOrderResponse;
import com.delivry.backend.response.client.DeliveryPriceResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/client")
@PreAuthorize("hasRole('CLIENT')")
@SecurityRequirement(name = "bearerAuth")
public class ClientController {

    private final ClientService clientService;

    public ClientController(ClientService clientService) {
        this.clientService = clientService;
    }

    // Создать заказ
    @PostMapping("/orders")
    public DeliveryOrderResponse createOrder(
            @Valid @RequestBody CreateOrderRequest request
    ){
        return clientService.createOrder(request);
    }

    // История заказов
    @GetMapping("/orders")
    public List<DeliveryOrderResponse> getMyOrders(){
        return clientService.getMyOrders();
    }

    // Один заказ
    @GetMapping("/orders/{id}")
    public DeliveryOrderResponse getOrder(@PathVariable Long id){
        return clientService.getOrder(id);
    }

    // Расчет стоимости
    @PostMapping("/calculate")
    public DeliveryPriceResponse calculate(
            @RequestBody CreateOrderRequest request
    ){
        return clientService.calculatePrice(request);
    }

    // Оставить рейтинг
    @PostMapping("/rating")
    public void rateCourier(
            @RequestBody RatingRequest request
    ){
        clientService.rateCourier(request);
    }
}
