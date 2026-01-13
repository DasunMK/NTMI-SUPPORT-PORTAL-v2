package com.ntmi.support.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "error_categories")
public class ErrorCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long categoryId;

    @Column(nullable = false, unique = true)
    private String categoryName; // e.g., "Hardware", "Network", "Software"
}