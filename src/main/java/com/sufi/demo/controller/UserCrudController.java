package com.sufi.demo.controller;

import com.sufi.demo.auth.UserCrudService;
import com.sufi.demo.auth.dto.UserListResponse;
import com.sufi.demo.auth.dto.UserUpsertRequest;
import com.sufi.demo.auth.dto.UserView;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value = "/api/users", produces = MediaType.APPLICATION_JSON_VALUE)
@CrossOrigin(
    originPatterns = {
        "http://localhost:*",
        "https://*.vercel.app",
        "https://filewalaraja.com",
        "https://www.filewalaraja.com"
    },
    allowedHeaders = "*",
    methods = {
        RequestMethod.GET,
        RequestMethod.POST,
        RequestMethod.PUT,
        RequestMethod.DELETE,
        RequestMethod.OPTIONS
    }
)
public class UserCrudController {

  private final UserCrudService userCrudService;

  public UserCrudController(UserCrudService userCrudService) {
    this.userCrudService = userCrudService;
  }

  @GetMapping
  public UserListResponse listUsers() {
    return new UserListResponse(true, "Users fetched successfully.", userCrudService.listUsers());
  }

  @GetMapping("/{id}")
  public UserView getUser(@PathVariable Long id) {
    return userCrudService.getUser(id);
  }

  @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
  public UserView createUser(@Valid @RequestBody UserUpsertRequest req) {
    return userCrudService.createUser(req);
  }

  @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
  public UserView updateUser(@PathVariable Long id, @Valid @RequestBody UserUpsertRequest req) {
    return userCrudService.updateUser(id, req);
  }

  @DeleteMapping("/{id}")
  public Map<String, Object> deleteUser(@PathVariable Long id) {
    userCrudService.deleteUser(id);
    return Map.of("success", true, "message", "User deleted successfully.");
  }
}
