package com.delivry.backend.request.client;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ChangePasswordRequest {

    @NotBlank
    private String currentPassword;

    @NotBlank
    @Size(min = 6, message = "Пароль должен быть не менее 6 символов")
    private String newPassword;

    public String getCurrentPassword()       { return currentPassword; }
    public void   setCurrentPassword(String v){ this.currentPassword = v; }

    public String getNewPassword()           { return newPassword; }
    public void   setNewPassword(String v)   { this.newPassword = v; }
}
