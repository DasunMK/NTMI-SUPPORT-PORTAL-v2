package com.ntmi.support.config;

import io.jsonwebtoken.*; // Imported for Jwts, Claims, JwtException
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtUtils {

    // Generate a secure key for signing
    // Note: Since this is random, every time you restart the server, old tokens will stop working.
    // In a real production app, you would read this key from application.properties.
    private final SecretKey key = Keys.secretKeyFor(SignatureAlgorithm.HS256);
    
    // Token validity (e.g., 24 hours)
    private final int jwtExpirationMs = 86400000;

    // 1. Generate Token
    public String generateToken(String username) {
        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(new Date())
                .setExpiration(new Date((new Date()).getTime() + jwtExpirationMs))
                .signWith(key)
                .compact();
    }

    // 2. Get Username from Token (NEEDED FOR FILTER)
    public String getUserNameFromJwtToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    // 3. Validate Token
    public boolean validateJwtToken(String authToken) {
        try {
            Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(authToken);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            // Token is invalid, expired, or modified
            System.err.println("Invalid JWT Token: " + e.getMessage());
        }
        return false;
    }
}