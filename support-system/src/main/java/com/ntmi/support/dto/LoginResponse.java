package com.ntmi.support.dto;
import lombok.Data;

@Data
public class LoginResponse {
    private String token;
    private Long userId;
    private String username;
    private String role;
    private Long branchId; // Null if Admin

    public LoginResponse(String token, Long userId, String username, String role, Long branchId) {
        this.token = token;
        this.userId = userId;
        this.username = username;
        this.role = role;
        this.branchId = branchId;
    }
}