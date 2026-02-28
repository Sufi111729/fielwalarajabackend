package com.sufi.demo.auth.dto;

public record AuthResponse(
    boolean success,
    String message,
    String token,
    String email,
    String fullName,
    boolean emailVerified
) {
}

