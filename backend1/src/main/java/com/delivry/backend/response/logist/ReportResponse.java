package com.delivry.backend.response.logist;

public class ReportResponse {
    private String period;
    private long   totalRoutes;
    private long   completedRoutes;
    private long   cancelledRoutes;
    private double totalDistanceKm;
    private long   ordersDelivered;

    public ReportResponse(String period, long totalRoutes, long completedRoutes,
                          long cancelledRoutes, double totalDistanceKm, long ordersDelivered) {
        this.period          = period;
        this.totalRoutes     = totalRoutes;
        this.completedRoutes = completedRoutes;
        this.cancelledRoutes = cancelledRoutes;
        this.totalDistanceKm = totalDistanceKm;
        this.ordersDelivered = ordersDelivered;
    }

    public String getPeriod()          { return period; }
    public long   getTotalRoutes()     { return totalRoutes; }
    public long   getCompletedRoutes() { return completedRoutes; }
    public long   getCancelledRoutes() { return cancelledRoutes; }
    public double getTotalDistanceKm() { return totalDistanceKm; }
    public long   getOrdersDelivered() { return ordersDelivered; }
}
