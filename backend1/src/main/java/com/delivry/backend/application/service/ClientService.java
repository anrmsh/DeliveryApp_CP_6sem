package com.delivry.backend.application.service;

import com.delivry.backend.domain.entity.*;
import com.delivry.backend.domain.enums.DeliveryStatus;
import com.delivry.backend.domain.repository.*;
import com.delivry.backend.infrastructure.security.SecurityUtils;
import com.delivry.backend.request.client.CreateOrderRequest;
import com.delivry.backend.request.client.RatingRequest;
import com.delivry.backend.response.client.DeliveryOrderResponse;
import com.delivry.backend.response.client.DeliveryPriceResponse;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Transactional
public class ClientService {

    private final UserRepository userRepository;
    private final RouteSheetRepository routeSheetRepository;

    private final DeliveryOrderRepository orderRepository;
    private final CourierRatingsRepository ratingRepository;
    private final ClientRepository clientRepository;
    private final DeliveryStatusRepository statusRepository;

    public ClientService(
            DeliveryOrderRepository orderRepository,
            CourierRatingsRepository ratingRepository,
            ClientRepository clientRepository,
            DeliveryStatusRepository statusRepository,
            UserRepository userRepository,
            RouteSheetRepository routeSheetRepository
    ){
        this.orderRepository = orderRepository;
        this.ratingRepository = ratingRepository;
        this.clientRepository = clientRepository;
        this.statusRepository = statusRepository;
        this.userRepository = userRepository;
        this.routeSheetRepository = routeSheetRepository;
    }

    public DeliveryOrderResponse createOrder(CreateOrderRequest request){

        Client client = getCurrentClient();

        DeliveryStatus status = statusRepository
                .findByName("Создан")
                .orElseThrow();

        DeliveryOrder order = new DeliveryOrder();

        order.setClient(client);
        order.setPickupAddress(request.getPickupAddress());
        order.setDeliveryAddress(request.getDeliveryAddress());
        order.setLatitude(request.getLatitude());
        order.setLongitude(request.getLongitude());
        order.setRequestedTime(request.getRequestedTime());
        order.setStatus(status);

        orderRepository.save(order);

        return DeliveryOrderResponse.from(order);
    }

    public List<DeliveryOrderResponse> getMyOrders(){

        Client client = getCurrentClient();

        return orderRepository
                .findByClientUserId(client.getUserId())
                .stream()
                .map(DeliveryOrderResponse::from)
                .toList();
    }

    public DeliveryOrderResponse getOrder(Long id){

        DeliveryOrder order = orderRepository
                .findById(id)
                .orElseThrow();

        return DeliveryOrderResponse.from(order);
    }

    public DeliveryPriceResponse calculatePrice(CreateOrderRequest request){

        double distance = 10; // потом API карт

        double price = distance * 1.5;

        int minutes = (int)(distance * 3);

        return new DeliveryPriceResponse(price, minutes);
    }

    public void rateCourier(RatingRequest request){

        Client client = getCurrentClient();

        User courier = userRepository
                .findById(request.getCourierId())
                .orElseThrow();

        RouteSheet route = routeSheetRepository
                .findById(request.getRouteId())
                .orElseThrow();

        CourierRating rating = new CourierRating();

        rating.setCourier(courier);
        rating.setClient(client);
        rating.setRoute(route);
        rating.setRating(request.getRating());
        rating.setComment(request.getComment());

        ratingRepository.save(rating);
    }

    private Client getCurrentClient(){

        Long userId = SecurityUtils.getCurrentUserId();
        return clientRepository.findById(userId).orElseThrow();
    }
}
