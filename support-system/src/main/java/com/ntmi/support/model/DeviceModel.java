package com.ntmi.support.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class DeviceModel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String name; // e.g., "Latitude 3520"

    @ManyToOne
    @JoinColumn(name = "brand_id", nullable = false) 
    private Brand brand;

    // ✅ ADD THIS: Link Model to Device Type
    @ManyToOne
    @JoinColumn(name = "device_type_id", nullable = false)
    private DeviceType deviceType;
}