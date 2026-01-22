package com.ntmi.support.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Data;
import lombok.ToString;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "ticket_images")
@Data
public class TicketImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // ✅ Ensure this is 'id', not 'imageId'

    @Lob
    @Column(columnDefinition = "VARCHAR(MAX)") // ✅ Correct for MSSQL
    private String base64Data;

    @ManyToOne
    @JoinColumn(name = "ticket_id", nullable = false)
    @JsonBackReference // ✅ Prevents infinite loop
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Ticket ticket;
}