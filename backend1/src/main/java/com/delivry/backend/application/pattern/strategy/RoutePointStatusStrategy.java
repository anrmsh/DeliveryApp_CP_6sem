package com.delivry.backend.application.pattern.strategy;

import com.delivry.backend.domain.entity.RoutePoint;

public interface RoutePointStatusStrategy {

    boolean supports(String statusName);

    void apply(RoutePoint routePoint);
}
