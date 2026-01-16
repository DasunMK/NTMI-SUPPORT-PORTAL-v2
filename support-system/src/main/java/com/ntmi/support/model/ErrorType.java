package com.ntmi.support.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "error_types")
public class ErrorType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long typeId;

    @Column(nullable = false)
    private String typeName; // e.g., "Printer Jam", "No Internet"

    // Relationship: Many Types belong to One Category
    // The field name here is "category".
    // Therefore, your Repository MUST use: findByCategory_CategoryId(Long id)
    @ManyToOne
    @JoinColumn(name = "category_id", nullable = false)
    private ErrorCategory category;
}