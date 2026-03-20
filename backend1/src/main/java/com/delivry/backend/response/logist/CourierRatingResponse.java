package com.delivry.backend.response.logist;

public class CourierRatingResponse {
    private Long   courierId;
    private String courierName;
    private double averageRating;
    private int    totalRatings;

    public CourierRatingResponse(Long courierId, String courierName,
                                 double averageRating, int totalRatings) {
        this.courierId     = courierId;
        this.courierName   = courierName;
        this.averageRating = averageRating;
        this.totalRatings  = totalRatings;
    }

    public Long   getCourierId()     { return courierId; }
    public String getCourierName()   { return courierName; }
    public double getAverageRating() { return averageRating; }
    public int    getTotalRatings()  { return totalRatings; }
}
