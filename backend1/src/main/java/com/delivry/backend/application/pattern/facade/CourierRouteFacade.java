package com.delivry.backend.application.pattern.facade;

import com.delivry.backend.application.service.CourierService;
import com.delivry.backend.request.courier.CompleteRouteRequest;
import com.delivry.backend.request.courier.UpdatePointStatusRequest;
import com.delivry.backend.response.courier.CourierRouteResponse;
import org.springframework.stereotype.Component;

@Component
public class CourierRouteFacade {

    private final CourierService courierService;

    public CourierRouteFacade(CourierService courierService) {
        this.courierService = courierService;
    }

    public CourierRouteResponse getCurrentRoute() {
        return courierService.getCurrentRoute();
    }

    public CourierRouteResponse startRoute(Long routeId) {
        return courierService.startRoute(routeId);
    }

    public CourierRouteResponse updatePointStatus(Long pointId, UpdatePointStatusRequest request) {
        return courierService.updatePointStatus(pointId, request);
    }

    public CourierRouteResponse completeRoute(Long routeId, CompleteRouteRequest request) {
        return courierService.completeRoute(routeId, request);
    }
}
