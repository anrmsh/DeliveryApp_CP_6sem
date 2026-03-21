package com.delivry.backend.response.courier;

public class CourierDashboardResponse {
    private long   totalRoutes;
    private long   completedRoutes;
    private long   activeRoutes;
    private double totalKm;
    private long   unreadNotifications;
    private double averageRating;
    private int    totalRatings;

    public CourierDashboardResponse(long totalRoutes, long completedRoutes, long activeRoutes,
                                    double totalKm, long unreadNotifications,
                                    double averageRating, int totalRatings) {
        this.totalRoutes          = totalRoutes;
        this.completedRoutes      = completedRoutes;
        this.activeRoutes         = activeRoutes;
        this.totalKm              = totalKm;
        this.unreadNotifications  = unreadNotifications;
        this.averageRating        = averageRating;
        this.totalRatings         = totalRatings;
    }

    public long   getTotalRoutes()         { return totalRoutes; }
    public long   getCompletedRoutes()     { return completedRoutes; }
    public long   getActiveRoutes()        { return activeRoutes; }
    public double getTotalKm()             { return totalKm; }
    public long   getUnreadNotifications() { return unreadNotifications; }
    public double getAverageRating()       { return averageRating; }
    public int    getTotalRatings()        { return totalRatings; }
}

