package com.delivry.backend.response.client;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
//@AllArgsConstructor
public class DeliveryPriceResponse {

    /** Final price in roubles (rounded) */
    private long price;

    /** Total estimated delivery time in minutes (including traffic & weather) */
    private int estimatedMinutes;

    /** Route distance in kilometres */
    private double distanceKm;

    /** Traffic multiplier applied (1.0 = no rush hour, 1.35 = rush hour) */
    private double trafficMultiplier;

    /** Weather multiplier applied (1.0 = clear, up to 1.5 = thunderstorm) */
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

    // Убери @Data и @AllArgsConstructor — они не работают
// Просто добавь конструктор:

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