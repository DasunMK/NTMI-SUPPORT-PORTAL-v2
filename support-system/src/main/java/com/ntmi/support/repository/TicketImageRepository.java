package com.ntmi.support.repository;

import com.ntmi.support.model.TicketImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TicketImageRepository extends JpaRepository<TicketImage, Long> {
}