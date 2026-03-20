package com.delivry.backend.response.logist;

import com.delivry.backend.domain.entity.User;

public class CourierResponse {
    private Long   id;
    private String fullName;
    private String email;
    private String phone;
    private String status;

    public static CourierResponse from(User u) {
        CourierResponse r = new CourierResponse();
        r.id       = u.getId();
        r.fullName = u.getFullName();
        r.email    = u.getEmail();
        r.phone    = u.getPhone();
        r.status   = u.getStatus() != null ? u.getStatus().getName() : null;
        return r;
    }

    public Long   getId()       { return id; }
    public String getFullName() { return fullName; }
    public String getEmail()    { return email; }
    public String getPhone()    { return phone; }
    public String getStatus()   { return status; }
}
