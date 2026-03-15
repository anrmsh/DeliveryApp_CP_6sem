package com.delivry.backend.infrastructure.security;


import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public class SecurityUtils {

    public static Long getCurrentUserId(){

        Authentication auth =
                SecurityContextHolder.getContext().getAuthentication();

        return Long.parseLong(auth.getName());
    }

}
