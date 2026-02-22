package com.ntmi.support.controller;

import com.ntmi.support.model.Notification;
import com.ntmi.support.repository.NotificationRepository;
import com.ntmi.support.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin("*")
public class NotificationController {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired 
    private com.ntmi.support.service.NotificationService notificationService;

    // 1. Get My Notifications
    @GetMapping("/{userId}")
    public ResponseEntity<List<Notification>> getUserNotifications(@PathVariable Long userId) {
        try {
            return ResponseEntity.ok(notificationRepository.findByRecipient_UserIdOrderByCreatedAtDesc(userId));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // 2. Mark as Read
    @PutMapping("/{id}/read")
    public ResponseEntity<Notification> markAsRead(@PathVariable Long id) {
        try {
            Notification n = notificationRepository.findById(id).orElseThrow(() -> new RuntimeException("Notification not found"));
            n.setRead(true);
            return ResponseEntity.ok(notificationRepository.save(n));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // 3. Mark All as Read for User
    @PutMapping("/user/{userId}/read-all")
    public ResponseEntity<Void> markAllRead(@PathVariable Long userId) {
        try {
            List<Notification> list = notificationRepository.findByRecipient_UserIdOrderByCreatedAtDesc(userId);
            list.forEach(n -> n.setRead(true));
            notificationRepository.saveAll(list);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    // 4. Delete Notification
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(@PathVariable Long id) {
        try {
            notificationRepository.deleteById(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // 5. Test Endpoint
    @GetMapping("/test/{userId}")
    public ResponseEntity<String> sendTestNotification(@PathVariable Long userId) {
        try {
            com.ntmi.support.model.User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
            notificationService.send(user, "Test Title", "This is a test message", "INFO");
            
            return ResponseEntity.ok("Test notification sent to " + user.getUsername());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
}