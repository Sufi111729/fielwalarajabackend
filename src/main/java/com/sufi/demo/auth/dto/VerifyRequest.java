package com.sufi.demo.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record VerifyRequest(
    @NotBlank @Size(min = 4, max = 150) String token
) {
}
