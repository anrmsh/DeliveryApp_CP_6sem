package com.delivry.backend.request.client;

public class UpdateProfileRequest {

    private String fullName;
    private String phone;
    private String companyName;
    private String contactPerson;
    private String notes;

    public String getFullName()             { return fullName; }
    public void   setFullName(String v)     { this.fullName = v; }

    public String getPhone()                { return phone; }
    public void   setPhone(String v)        { this.phone = v; }

    public String getCompanyName()          { return companyName; }
    public void   setCompanyName(String v)  { this.companyName = v; }

    public String getContactPerson()        { return contactPerson; }
    public void   setContactPerson(String v){ this.contactPerson = v; }

    public String getNotes()                { return notes; }
    public void   setNotes(String v)        { this.notes = v; }
}