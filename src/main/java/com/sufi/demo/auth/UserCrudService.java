package com.sufi.demo.auth;

import com.sufi.demo.auth.dto.UserUpsertRequest;
import com.sufi.demo.auth.dto.UserView;
import java.util.List;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UserCrudService {

  private final AppUserRepository userRepository;
  private final BCryptPasswordEncoder passwordEncoder;

  public UserCrudService(AppUserRepository userRepository, BCryptPasswordEncoder passwordEncoder) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
  }

  @Transactional(readOnly = true)
  public List<UserView> listUsers() {
    return userRepository.findAll().stream().map(this::toView).toList();
  }

  @Transactional(readOnly = true)
  public UserView getUser(Long id) {
    AppUser user = userRepository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));
    return toView(user);
  }

  @Transactional
  public UserView createUser(UserUpsertRequest req) {
    String email = normalizeEmail(req.email());
    if (userRepository.existsByEmailIgnoreCase(email)) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered.");
    }

    AppUser user = new AppUser();
    user.setFullName(buildFullName(req.firstName(), req.lastName()));
    user.setEmail(email);
    user.setMobileNumber(normalizeMobile(req.mobile()));
    user.setEmailVerified(req.emailVerified() != null && req.emailVerified());
    String rawPassword = req.password() == null ? "ChangeMe@123" : req.password();
    user.setPasswordHash(passwordEncoder.encode(rawPassword));

    return toView(userRepository.save(user));
  }

  @Transactional
  public UserView updateUser(Long id, UserUpsertRequest req) {
    AppUser user = userRepository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));

    String email = normalizeEmail(req.email());
    if (userRepository.existsByEmailIgnoreCaseAndIdNot(email, id)) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered.");
    }

    user.setFullName(buildFullName(req.firstName(), req.lastName()));
    user.setEmail(email);
    user.setMobileNumber(normalizeMobile(req.mobile()));
    if (req.emailVerified() != null) {
      user.setEmailVerified(req.emailVerified());
    }
    if (req.password() != null && !req.password().isBlank()) {
      user.setPasswordHash(passwordEncoder.encode(req.password()));
    }

    return toView(userRepository.save(user));
  }

  @Transactional
  public void deleteUser(Long id) {
    if (!userRepository.existsById(id)) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found.");
    }
    userRepository.deleteById(id);
  }

  private UserView toView(AppUser user) {
    String fullName = user.getFullName() == null ? "" : user.getFullName().trim();
    String[] parts = fullName.isEmpty() ? new String[]{"", ""} : fullName.split("\\s+", 2);
    String firstName = parts.length > 0 ? parts[0] : "";
    String lastName = parts.length > 1 ? parts[1] : "";
    return new UserView(
        user.getId(),
        firstName,
        lastName,
        fullName,
        user.getEmail(),
        user.getMobileNumber(),
        user.isEmailVerified(),
        user.getCreatedAt(),
        user.getUpdatedAt()
    );
  }

  private String buildFullName(String firstName, String lastName) {
    return (firstName == null ? "" : firstName.trim()) + " " + (lastName == null ? "" : lastName.trim());
  }

  private String normalizeMobile(String mobile) {
    return mobile == null ? "" : mobile.replaceAll("[^0-9]", "");
  }

  private String normalizeEmail(String email) {
    return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
  }
}
