package com.delivry.backend.response.logist;

public class DashboardResponse {
    private long totalOrders;
    private long pendingOrders;
    private long activeRoutes;
    private long totalVehicles;
    private long freeVehicles;
    private long totalCouriers;

    public DashboardResponse(long totalOrders, long pendingOrders, long activeRoutes,
                             long totalVehicles, long freeVehicles, long totalCouriers) {
        this.totalOrders   = totalOrders;
        this.pendingOrders = pendingOrders;
        this.activeRoutes  = activeRoutes;
        this.totalVehicles = totalVehicles;
        this.freeVehicles  = freeVehicles;
        this.totalCouriers = totalCouriers;
    }

    public long getTotalOrders()   { return totalOrders; }
    public long getPendingOrders() { return pendingOrders; }
    public long getActiveRoutes()  { return activeRoutes; }
    public long getTotalVehicles() { return totalVehicles; }
    public long getFreeVehicles()  { return freeVehicles; }
    public long getTotalCouriers() { return totalCouriers; }
}
