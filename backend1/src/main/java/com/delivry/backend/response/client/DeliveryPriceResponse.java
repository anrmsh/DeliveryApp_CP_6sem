package com.delivry.backend.response.client;

public class DeliveryPriceResponse {

    private double price;
    private int estimatedMinutes;

    public DeliveryPriceResponse() {
    }

    public DeliveryPriceResponse(double price, int estimatedMinutes) {
        this.price = price;
        this.estimatedMinutes = estimatedMinutes;
    }

    public double getPrice() {
        return price;
    }

    public void setPrice(double price) {
        this.price = price;
    }

    public int getEstimatedMinutes() {
        return estimatedMinutes;
    }

    public void setEstimatedMinutes(int estimatedMinutes) {
        this.estimatedMinutes = estimatedMinutes;
    }
}