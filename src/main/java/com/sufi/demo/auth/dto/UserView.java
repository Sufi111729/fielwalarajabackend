package com.sufi.demo.auth.dto;

import java.time.Instant;

public record UserView(
    Long id,
    String firstName,
    String lastName,
    String fullName,
    String email,
    String mobile,
    boolean emailVerified,
    Instant createdAt,
    Instant updatedAt
) {
}
