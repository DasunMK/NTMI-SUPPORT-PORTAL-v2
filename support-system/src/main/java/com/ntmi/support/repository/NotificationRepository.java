package com.ntmi.support.repository;

import com.ntmi.support.model.Notification;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    // Fetch notifications for a specific user, sorted by newest first
    List<Notification> findByRecipient_UserIdOrderByCreatedAtDesc(Long userId);
    
    // Optional: Count unread
    long countByRecipient_UserIdAndIsReadFalse(Long userId);
}