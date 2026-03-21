package com.delivry.backend.response.logist;

public class CourierRatingResponse {
    private Long   courierId;
    private String courierName;
    private String courierPhone;
    private String courierEmail;
    private String courierStatus;
    private double averageRating;
    private int    totalRatings;
    private long   completedRoutes;
    private long   totalDeliveries;

    public CourierRatingResponse(
            Long courierId, String courierName, String courierPhone,
            String courierEmail, String courierStatus,
            double averageRating, int totalRatings,
            long completedRoutes, long totalDeliveries
    ) {
        this.courierId       = courierId;
        this.courierName     = courierName;
        this.courierPhone    = courierPhone;
        this.courierEmail    = courierEmail;
        this.courierStatus   = courierStatus;
        this.averageRating   = averageRating;
        this.totalRatings    = totalRatings;
        this.completedRoutes = completedRoutes;
        this.totalDeliveries = totalDeliveries;
    }

    public Long   getCourierId()       { return courierId; }
    public String getCourierName()     { return courierName; }
    public String getCourierPhone()    { return courierPhone; }
    public String getCourierEmail()    { return courierEmail; }
    public String getCourierStatus()   { return courierStatus; }
    public double getAverageRating()   { return averageRating; }
    public int    getTotalRatings()    { return totalRatings; }
    public long   getCompletedRoutes() { return completedRoutes; }
    public long   getTotalDeliveries() { return totalDeliveries; }
}