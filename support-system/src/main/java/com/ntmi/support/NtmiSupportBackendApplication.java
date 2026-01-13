package com.ntmi.support;

import com.fasterxml.jackson.databind.ObjectMapper; // Import this
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;     // Import this

@SpringBootApplication
public class NtmiSupportBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(NtmiSupportBackendApplication.class, args);
    }

    // --- FIX STARTS HERE ---
    // We explicitly tell Spring: "Here is the ObjectMapper you are looking for!"
    @Bean
    public ObjectMapper objectMapper() {
        return new ObjectMapper();
    }
    // --- FIX ENDS HERE ---
}