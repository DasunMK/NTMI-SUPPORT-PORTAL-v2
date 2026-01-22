package com.ntmi.support.dto;

import lombok.Data;

@Data
public class CommentDTO {
    private String text;
    private Long ticketId;
    // We don't need userId here, we'll get it from the Security Token
}