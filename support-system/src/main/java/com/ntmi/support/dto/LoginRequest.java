package com.ntmi.support.dto;
import lombok.Data;

@Data
public class LoginRequest {
    private String username;
    private String password;
}