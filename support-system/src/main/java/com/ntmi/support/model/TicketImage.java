package com.ntmi.support.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "ticket_images")
public class TicketImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long imageId;

    // We store the URL/Path of the image, not the file itself in DB (Best Practice)
    private String imageUrl; 

    @ManyToOne
    @JoinColumn(name = "ticket_id", nullable = false)
    private Ticket ticket;
}