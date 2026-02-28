package com.sufi.demo.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record SignupCompleteRequest(
    @NotBlank @Size(min = 2, max = 60) String firstName,
    @NotBlank @Size(min = 1, max = 60) String lastName,
    @NotBlank @Email @Size(max = 180) String email,
    @NotBlank @Pattern(regexp = "[0-9]{10,15}") String mobile,
    @NotBlank @Size(min = 8, max = 80) String password
) {
}
