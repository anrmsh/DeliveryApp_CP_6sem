package com.delivry.backend.request.courier;

public class UpdatePointStatusRequest {
    private String status; // "Посещена" | "Пропущена"
    public String getStatus()         { return status; }
    public void   setStatus(String v) { this.status = v; }
}
