package com.ntmi.support.config;

import com.ntmi.support.filter.JwtAuthTokenFilter; // Ensure this matches your actual file name
import com.ntmi.support.security.AuthEntryPointJwt;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod; 
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthTokenFilter jwtAuthTokenFilter;

    @Autowired
    private AuthEntryPointJwt unauthorizedHandler;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(exception -> exception
                    .authenticationEntryPoint(unauthorizedHandler) // Handles 401 errors as JSON
            )
            .authorizeHttpRequests(auth -> auth
                // 1. PUBLIC ACCESS (No Login Required)
                .requestMatchers("/api/auth/**").permitAll() // Login/Register
                .requestMatchers("/error").permitAll()
                .requestMatchers("/ws/**").permitAll() // WebSockets
                .requestMatchers("/uploads/**").permitAll() // Public asset images (if any)
                
                // 2. MASTER DATA (Branches, Categories)
                // If you want dropdowns to load on the Login page, change .authenticated() to .permitAll()
                .requestMatchers("/api/master-data/**").authenticated() 
                .requestMatchers("/api/branches/**").authenticated()

                // 3. USER MANAGEMENT
                .requestMatchers("/api/users/**").authenticated()

                // 4. TICKETS & DASHBOARDS
                .requestMatchers("/api/tickets/**").authenticated()
                .requestMatchers("/api/dashboard/**").authenticated()

                // 5. ASSET MANAGEMENT
                .requestMatchers("/api/assets/**").authenticated()

                // 6. APPROVAL WORKFLOW
                .requestMatchers("/api/approvals/**").authenticated()
                
                // 7. NOTIFICATIONS
                .requestMatchers("/api/notifications/**").authenticated()

                // Default: Block anything else not authenticated
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthTokenFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public UrlBasedCorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("*")); 
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}