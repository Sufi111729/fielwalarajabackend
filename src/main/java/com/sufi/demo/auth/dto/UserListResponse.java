package com.sufi.demo.auth.dto;

import java.util.List;

public record UserListResponse(
    boolean success,
    String message,
    List<UserView> users
) {
}
