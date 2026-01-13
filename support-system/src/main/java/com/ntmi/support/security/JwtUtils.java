package com.ntmi.support.security;

import com.ntmi.support.model.User;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtils {

    // Ideally, this should be in application.properties, but for now we hardcode it.
    // It must be at least 256 bits (32 characters) long.
    private static final String SECRET_KEY = "YourSecretKeyMustBeVeryLongToSecureTheToken123";
    private static final int EXPIRATION_MS = 86400000; // 24 Hours

    // Generate Token
    public String generateToken(User user) {
        return Jwts.builder()
                .setSubject(user.getUsername())
                .claim("userId", user.getUserId()) // Add User ID to token
                .claim("role", user.getRole().name()) // Add Role to token
                .setIssuedAt(new Date())
                .setExpiration(new Date(new Date().getTime() + EXPIRATION_MS))
                .signWith(key(), SignatureAlgorithm.HS256)
                .compact();
    }

    private Key key() {
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(
            java.util.Base64.getEncoder().encodeToString(SECRET_KEY.getBytes())
        ));
    }
}