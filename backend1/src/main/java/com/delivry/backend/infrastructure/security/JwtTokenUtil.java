package com.delivry.backend.infrastructure.security;

import io.jsonwebtoken.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import io.jsonwebtoken.security.Keys;
import java.security.Key;

@Component
public class JwtTokenUtil {

    private final String secret = "deliveryApplicationJwtSecretKeyVerySecure123456789012345678901234567890";

    private static final long JWT_TOKEN_VALIDITY = 5 * 60 * 60;

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(
            String token,
            Function<Claims, T> claimsResolver) {

        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {

//        return Jwts.parser()
//                .setSigningKey(secret)
//                .parseClaimsJws(token)
//                .getBody();


        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private Boolean isTokenExpired(String token) {

        return extractExpiration(token).before(new Date());
    }

//    public String generateToken(
//            String username,
//            Collection<? extends GrantedAuthority> authorities) {
//
//        Map<String, Object> claims = new HashMap<>();
//
//        List<String> roles = authorities.stream()
//                .map(GrantedAuthority::getAuthority)
//                .collect(Collectors.toList());
//
//        claims.put("roles", roles);
//
//        return Jwts.builder()
//                .setClaims(claims)
//                .setSubject(username)
//                .setIssuedAt(new Date(System.currentTimeMillis()))
//                .setExpiration(
//                        new Date(System.currentTimeMillis()
//                                + JWT_TOKEN_VALIDITY * 1000)
//                )
//                .signWith(SignatureAlgorithm.HS512, secret)
//                .compact();
//    }


    private final Key key = Keys.hmacShaKeyFor(secret.getBytes());

    public String generateToken(
            String username,
            Collection<? extends GrantedAuthority> authorities) {

        Map<String, Object> claims = new HashMap<>();

        List<String> roles = authorities.stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        claims.put("roles", roles);

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(username)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + JWT_TOKEN_VALIDITY * 1000))
                .signWith(key, SignatureAlgorithm.HS512)
                .compact();
    }
    public Boolean validateToken(String token, String username) {

        final String extractedUsername = extractUsername(token);

        return extractedUsername.equals(username)
                && !isTokenExpired(token);
    }
}