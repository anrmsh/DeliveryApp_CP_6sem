package com.delivry.backend.application.service;

import com.delivry.backend.domain.entity.RoutePoint;
import com.delivry.backend.domain.entity.RouteSheet;
import com.delivry.backend.domain.repository.RoutePointRepository;
import com.delivry.backend.domain.repository.RouteSheetRepository;
import com.delivry.backend.response.courier.DeliveryCheckResponse;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Transactional
public class DeliveryCheckService {

    private final RouteSheetRepository routeSheetRepository;
    private final RoutePointRepository routePointRepository;

    public DeliveryCheckService(
            RouteSheetRepository routeSheetRepository,
            RoutePointRepository routePointRepository
    ) {
        this.routeSheetRepository = routeSheetRepository;
        this.routePointRepository = routePointRepository;
    }

    public List<DeliveryCheckResponse> getChecksForRoute(Long routeId) {
        RouteSheet route = routeSheetRepository.findById(routeId)
                .orElseThrow(() -> new IllegalArgumentException("Route not found: " + routeId));

        List<RoutePoint> points = routePointRepository
                .findByRouteIdOrderBySequenceNumber(routeId);

        return points.stream()
                .filter(p -> p.getStatus() != null && "Посещена".equals(p.getStatus().getName()))
                .map(p -> DeliveryCheckResponse.from(route, p))
                .toList();
    }
}

