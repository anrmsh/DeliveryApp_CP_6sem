package com.delivry.backend.response.client;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
//@AllArgsConstructor
public class DeliveryPriceResponse {


    private long price;
    private int estimatedMinutes;
    private double distanceKm;
    private double trafficMultiplier;
    private double weatherMultiplier;

    public long getPrice() {
        return price;
    }

    public void setPrice(long price) {
        this.price = price;
    }

    public int getEstimatedMinutes() {
        return estimatedMinutes;
    }

    public void setEstimatedMinutes(int estimatedMinutes) {
        this.estimatedMinutes = estimatedMinutes;
    }

    public double getDistanceKm() {
        return distanceKm;
    }

    public void setDistanceKm(double distanceKm) {
        this.distanceKm = distanceKm;
    }

    public double getTrafficMultiplier() {
        return trafficMultiplier;
    }

    public void setTrafficMultiplier(double trafficMultiplier) {
        this.trafficMultiplier = trafficMultiplier;
    }

    public double getWeatherMultiplier() {
        return weatherMultiplier;
    }

    public void setWeatherMultiplier(double weatherMultiplier) {
        this.weatherMultiplier = weatherMultiplier;
    }


    public DeliveryPriceResponse(long price, int estimatedMinutes,
                                 double distanceKm, double trafficMultiplier,
                                 double weatherMultiplier) {
        this.price = price;
        this.estimatedMinutes = estimatedMinutes;
        this.distanceKm = distanceKm;
        this.trafficMultiplier = trafficMultiplier;
        this.weatherMultiplier = weatherMultiplier;
    }

}