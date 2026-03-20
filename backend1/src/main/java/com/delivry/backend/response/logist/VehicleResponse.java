package com.delivry.backend.response.logist;

// ═══════════════════════════════════════════════════════════════════
// Путь: response/logist/VehicleResponse.java
// ═══════════════════════════════════════════════════════════════════

import com.delivry.backend.domain.entity.Vehicle;

import java.math.BigDecimal;

public class VehicleResponse {
    private Long       id;
    private String     model;
    private String     plateNumber;
    private BigDecimal capacityKg;
    private BigDecimal volumeM3;
    private String     status;

    public static VehicleResponse from(Vehicle v) {
        VehicleResponse r = new VehicleResponse();
        r.id          = v.getId();
        r.model       = v.getModel();
        r.plateNumber = v.getPlateNumber();
        r.capacityKg  = BigDecimal.valueOf(v.getCapacityKg());
        r.volumeM3    = BigDecimal.valueOf(v.getVolumeM3());
        r.status      = v.getStatus() != null ? v.getStatus().getName() : null;
        return r;
    }

    public Long       getId()          { return id; }
    public String     getModel()       { return model; }
    public String     getPlateNumber() { return plateNumber; }
    public BigDecimal getCapacityKg()  { return capacityKg; }
    public BigDecimal getVolumeM3()    { return volumeM3; }
    public String     getStatus()      { return status; }
}
