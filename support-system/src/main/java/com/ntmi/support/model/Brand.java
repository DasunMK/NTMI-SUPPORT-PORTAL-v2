package com.ntmi.support.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class Brand {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true)
    private String name; // e.g., "Dell", "HP"
}