package com.ntmi.support.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class DeviceType {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String name; // e.g., "Laptop", "Printer", "Scanner"
}