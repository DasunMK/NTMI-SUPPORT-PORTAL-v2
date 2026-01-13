package com.ntmi.support.config;

import com.ntmi.support.security.AuthTokenFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter; // <--- This was the missing import

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private AuthTokenFilter authTokenFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable()) // Disable CSRF
            .authorizeHttpRequests(auth -> auth
                // 1. PUBLIC ENDPOINTS (No Login Required)
                .requestMatchers("/api/auth/**").permitAll()  // Login & Register
                .requestMatchers("/ws/**").permitAll()        // WebSocket Connection
                .requestMatchers("/uploads/**").permitAll()   // Access to uploaded images
                
                // 2. PROTECTED ENDPOINTS (Login Required)
                .anyRequest().authenticated()
            )
            // 3. Add our Custom Token Check Filter BEFORE the standard Spring Login Filter
            // (Note: We use UsernamePasswordAuthenticationFilter.class here, NOT Token)
            .addFilterBefore(authTokenFilter, UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}