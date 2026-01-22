package com.ntmi.support.service;

import com.ntmi.support.model.Notification;
import com.ntmi.support.model.Role;
import com.ntmi.support.model.User;
import com.ntmi.support.repository.NotificationRepository;
import com.ntmi.support.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; // ✅ Import Transactional

import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    // 1. Send to a Specific User
    @Transactional // ✅ Ensures DB transaction is active
    public void send(User recipient, String title, String message, String type) {
        if(recipient == null) {
            System.err.println("❌ [NotificationService] Error: Recipient is NULL. Cannot save.");
            return;
        }

        try {
            System.out.println("⏳ [NotificationService] Preparing to save for user: " + recipient.getUsername());

            Notification n = new Notification();
            n.setRecipient(recipient);
            n.setTitle(title);
            n.setMessage(message);
            n.setType(type);
            n.setRead(false);
            n.setCreatedAt(LocalDateTime.now());
            
            // ✅ FORCE WRITE TO DB IMMEDIATELY
            notificationRepository.saveAndFlush(n);
            
            System.out.println("✅ [NotificationService] SUCCESS! Saved to DB. Notification ID: " + n.getId());
        } catch (Exception e) {
            System.err.println("❌ [NotificationService] Database Write Failed: " + e.getMessage());
            e.printStackTrace();
        }
    }

    // 2. Send to All Admins
    @Transactional
    public void notifyAllAdmins(String title, String message, String type) {
        System.out.println("📢 [NotificationService] Looking for admins...");

        List<User> admins = userRepository.findByRole(Role.ADMIN);

        if (admins.isEmpty()) {
            System.err.println("❌ [NotificationService] CRITICAL: No users found with Role.ADMIN.");
            return;
        }

        System.out.println("📢 Found " + admins.size() + " Admins. Sending now...");
        
        for (User admin : admins) {
            send(admin, title, message, type);
        }
    }
}