package com.ntmi.support.service;

import com.ntmi.support.dto.NotificationMsg;
import com.ntmi.support.model.Notification;
import com.ntmi.support.model.Role;
import com.ntmi.support.model.User;
import com.ntmi.support.repository.NotificationRepository;
import com.ntmi.support.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate; 

    /**
     * CORE METHOD: Saves to DB AND sends Real-Time WebSocket alert.
     */
    @Transactional
    public void send(User recipient, String title, String message, String type) {
        if (recipient == null) {
            System.err.println("❌ [NotificationService] Error: Recipient is NULL.");
            return;
        }

        try {
            // 1. SAVE TO DATABASE
            Notification n = new Notification();
            n.setRecipient(recipient);
            n.setTitle(title);
            n.setMessage(message);
            n.setType(type);
            n.setRead(false);
            n.setCreatedAt(LocalDateTime.now());

            notificationRepository.saveAndFlush(n);
            System.out.println("✅ [DB] Saved Notification ID: " + n.getId() + " for " + recipient.getUsername());

            // 2. PUSH TO WEBSOCKET
            NotificationMsg wsMsg = new NotificationMsg(title, message);
            messagingTemplate.convertAndSendToUser(
                recipient.getUsername(), 
                "/queue/notifications", 
                wsMsg
            );

        } catch (Exception e) {
            System.err.println("❌ [NotificationService] Failed: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Helper: Send by Username (Updated to accept 'type')
     */
    @Transactional
    public void sendPrivateNotification(String username, String title, String message, String type) {
        User user = userRepository.findByUsername(username).orElse(null);
        if (user != null) {
            send(user, title, message, type);
        } else {
            System.err.println("❌ User not found for notification: " + username);
        }
    }

    // ✅ Overload for backward compatibility (defaults to "INFO")
    public void sendPrivateNotification(String username, String title, String message) {
        sendPrivateNotification(username, title, message, "INFO");
    }

    /**
     * Helper: Notify All Admins (Updated to accept 'type')
     */
    @Transactional
    public void notifyAllAdmins(String title, String message, String type) {
        List<User> admins = userRepository.findByRole(Role.ADMIN);
        
        if (admins.isEmpty()) {
            System.out.println("⚠️ No Admins found to notify.");
            return;
        }

        for (User admin : admins) {
            send(admin, title, message, type);
        }
    }

    // ✅ Overload for backward compatibility (defaults to "INFO")
    public void notifyAllAdmins(String title, String message) {
        notifyAllAdmins(title, message, "INFO");
    }
}