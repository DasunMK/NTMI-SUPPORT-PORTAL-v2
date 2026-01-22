package com.ntmi.support.controller;

import com.ntmi.support.model.Notification;
import com.ntmi.support.repository.NotificationRepository;
import com.ntmi.support.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
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
    public List<Notification> getUserNotifications(@PathVariable Long userId) {
        return notificationRepository.findByRecipient_UserIdOrderByCreatedAtDesc(userId);
    }

    // 2. Mark as Read
    @PutMapping("/{id}/read")
    public Notification markAsRead(@PathVariable Long id) {
        Notification n = notificationRepository.findById(id).orElseThrow();
        n.setRead(true);
        return notificationRepository.save(n);
    }

    // 3. Mark All as Read for User
    @PutMapping("/user/{userId}/read-all")
    public void markAllRead(@PathVariable Long userId) {
        List<Notification> list = notificationRepository.findByRecipient_UserIdOrderByCreatedAtDesc(userId);
        list.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(list);
    }
    
    // 4. Delete Notification
    @DeleteMapping("/{id}")
    public void deleteNotification(@PathVariable Long id) {
        notificationRepository.deleteById(id);
    }


    @GetMapping("/test/{userId}")
    public String sendTestNotification(@PathVariable Long userId) {
        com.ntmi.support.model.User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
            
        notificationService.send(user, "Test Title", "This is a test message", "INFO");
        
        return "Test notification sent to " + user.getUsername();
    }
}