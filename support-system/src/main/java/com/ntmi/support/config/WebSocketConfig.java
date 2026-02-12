package com.ntmi.support.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // 1. Enable simple broker for /topic (public) and /queue (private)
        config.enableSimpleBroker("/topic", "/queue");
        
        // 2. Messages sent from the client to the server should start with "/app"
        config.setApplicationDestinationPrefixes("/app");

        // 3. ✅ CRITICAL FOR NOTIFICATIONS: 
        // This tells Spring that paths starting with "/user" are for specific users.
        // It allows 'messagingTemplate.convertAndSendToUser' to work.
        config.setUserDestinationPrefix("/user"); 
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // This is the URL the Frontend connects to: http://localhost:8080/ws
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*") // Allow React (localhost:3000) to connect
                .withSockJS(); // Enable SockJS fallback
    }
}