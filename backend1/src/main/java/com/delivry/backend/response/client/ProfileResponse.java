package com.delivry.backend.response.client;

import com.delivry.backend.domain.entity.Client;
import com.delivry.backend.domain.entity.User;

import java.time.LocalDateTime;

public class ProfileResponse {

    private Long          id;
    private String        email;
    private String        fullName;
    private String        phone;
    private String        status;
    private String        oauthProvider;
    private LocalDateTime createdAt;
    private String        companyName;
    private String        contactPerson;
    private String        notes;

    public static ProfileResponse from(User user, Client client) {
        ProfileResponse r = new ProfileResponse();
        r.id            = user.getId();
        r.email         = user.getEmail();
        r.fullName      = user.getFullName();
        r.phone         = user.getPhone();
        r.status        = user.getStatus() != null ? user.getStatus().getName() : null;
        r.oauthProvider = user.getOauthProvider();
        r.createdAt     = user.getCreatedAt();
        if (client != null) {
            r.companyName   = client.getCompanyName();
            r.contactPerson = client.getContactPerson();
            r.notes         = client.getNotes();
        }
        return r;
    }

    public Long          getId()            { return id; }
    public String        getEmail()         { return email; }
    public String        getFullName()      { return fullName; }
    public String        getPhone()         { return phone; }
    public String        getStatus()        { return status; }
    public String        getOauthProvider() { return oauthProvider; }
    public LocalDateTime getCreatedAt()     { return createdAt; }
    public String        getCompanyName()   { return companyName; }
    public String        getContactPerson() { return contactPerson; }
    public String        getNotes()         { return notes; }
}
