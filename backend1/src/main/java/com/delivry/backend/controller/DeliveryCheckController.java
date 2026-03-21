package com.delivry.backend.controller;

import com.delivry.backend.application.service.DeliveryCheckService;
import com.delivry.backend.response.courier.DeliveryCheckResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/logist")
@PreAuthorize("hasRole('LOGIST')")
@SecurityRequirement(name = "bearerAuth")
public class DeliveryCheckController {

    private final DeliveryCheckService checkService;

    public DeliveryCheckController(DeliveryCheckService checkService) {
        this.checkService = checkService;
    }

    /** Все чеки (точки со статусом "Посещена") по маршруту */
    @GetMapping("/routes/{routeId}/checks")
    public List<DeliveryCheckResponse> getChecks(@PathVariable Long routeId) {
        return checkService.getChecksForRoute(routeId);
    }
}
