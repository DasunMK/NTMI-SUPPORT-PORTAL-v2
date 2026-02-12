package com.ntmi.support.config;

import com.ntmi.support.filter.JwtAuthTokenFilter;
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

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // 1. PUBLIC ACCESS
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/master-data/**").permitAll()
                .requestMatchers("/error").permitAll()
                .requestMatchers("/api/notifications/**").permitAll()
                .requestMatchers("/ws/**").permitAll()
                
                // 2. PROFILE & SELF SERVICE (✅ FIX: Allow any logged-in user)
                .requestMatchers(HttpMethod.GET, "/api/users/{id}").authenticated()
                .requestMatchers(HttpMethod.PUT, "/api/users/{id}/password").authenticated()

                // 3. ADMIN RESTRICTIONS
                // Only Admin can see the full user list or create/delete users
                .requestMatchers("/api/users/**").hasAuthority("ADMIN") 
                .requestMatchers("/api/dashboard/admin").hasAuthority("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/tickets").hasAuthority("ADMIN") // 🛑 This was blocking Branch Users

                // 4. SHARED / BRANCH ACCESS
                .requestMatchers(HttpMethod.POST, "/api/tickets").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/tickets/branch/**").authenticated()
                .requestMatchers(HttpMethod.PUT, "/api/tickets/**").authenticated() // Allow cancel/update

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
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}