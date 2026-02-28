package com.sufi.demo.auth;

import com.sufi.demo.auth.dto.AuthResponse;
import com.sufi.demo.auth.dto.EmailRequest;
import com.sufi.demo.auth.dto.LoginRequest;
import com.sufi.demo.auth.dto.OtpVerifyRequest;
import com.sufi.demo.auth.dto.SignupCompleteRequest;
import com.sufi.demo.auth.dto.SignupRequest;
import com.sufi.demo.auth.dto.SignupStartRequest;
import com.sufi.demo.auth.dto.VerifyRequest;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

  private final AppUserRepository userRepository;
  private final VerificationTokenRepository verificationTokenRepository;
  private final AuthSessionRepository authSessionRepository;
  private final VerificationMailService verificationMailService;
  private final BCryptPasswordEncoder passwordEncoder;

  @Value("${app.auth.verify-token-minutes:30}")
  private long verifyTokenMinutes;

  @Value("${app.auth.session-hours:48}")
  private long sessionHours;

  public AuthService(
      AppUserRepository userRepository,
      VerificationTokenRepository verificationTokenRepository,
      AuthSessionRepository authSessionRepository,
      VerificationMailService verificationMailService,
      BCryptPasswordEncoder passwordEncoder) {
    this.userRepository = userRepository;
    this.verificationTokenRepository = verificationTokenRepository;
    this.authSessionRepository = authSessionRepository;
    this.verificationMailService = verificationMailService;
    this.passwordEncoder = passwordEncoder;
  }

  @Transactional
  public AuthResponse startSignup(SignupStartRequest req) {
    String email = normalizeEmail(req.email());
    String fullName = buildFullName(req.firstName(), req.lastName());

    AppUser user = userRepository.findByEmailIgnoreCase(email).orElse(null);
    if (user != null && user.isEmailVerified()) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered.");
    }

    if (user == null) {
      user = new AppUser();
      user.setEmail(email);
      user.setFullName(fullName);
      user.setPasswordHash(passwordEncoder.encode(UUID.randomUUID().toString()));
      user.setMobileNumber(null);
      user.setEmailVerified(false);
    } else {
      user.setFullName(fullName);
    }
    user = userRepository.save(user);

    createAndSendOtp(user);
    return new AuthResponse(
        true,
        "OTP sent to your email.",
        null,
        user.getEmail(),
        user.getFullName(),
        false
    );
  }

  @Transactional
  public AuthResponse verifySignupOtp(OtpVerifyRequest req) {
    String email = normalizeEmail(req.email());
    AppUser user = userRepository.findByEmailIgnoreCase(email)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found. Send OTP first."));

    VerificationToken token = verificationTokenRepository
        .findTopByTokenAndUserEmailIgnoreCaseOrderByIdDesc(req.otp(), email)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid OTP."));

    if (token.isUsed()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "OTP already used.");
    }
    if (token.isExpired()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "OTP expired. Please resend OTP.");
    }

    token.setUsedAt(Instant.now());
    user.setEmailVerified(true);
    verificationTokenRepository.save(token);
    userRepository.save(user);

    return new AuthResponse(
        true,
        "OTP verified. Now add mobile number and password.",
        null,
        user.getEmail(),
        user.getFullName(),
        true
    );
  }

  @Transactional
  public AuthResponse completeSignup(SignupCompleteRequest req) {
    String email = normalizeEmail(req.email());
    AppUser user = userRepository.findByEmailIgnoreCase(email)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found. Send OTP first."));

    if (!user.isEmailVerified()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Verify OTP first.");
    }

    user.setFullName(buildFullName(req.firstName(), req.lastName()));
    user.setMobileNumber(normalizeMobile(req.mobile()));
    user.setPasswordHash(passwordEncoder.encode(req.password()));
    userRepository.save(user);

    return new AuthResponse(
        true,
        "Account created successfully. Please login.",
        null,
        user.getEmail(),
        user.getFullName(),
        true
    );
  }

  @Transactional
  public AuthResponse signup(SignupRequest req) {
    String fullName = req.fullName() == null ? "" : req.fullName().trim();
    String[] parts = fullName.split("\\s+", 2);
    String firstName = parts.length > 0 ? parts[0] : fullName;
    String lastName = parts.length > 1 ? parts[1] : "User";

    startSignup(new SignupStartRequest(firstName, lastName, req.email()));

    return new AuthResponse(
        true,
        "OTP sent to your email. Verify OTP to continue signup.",
        null,
        normalizeEmail(req.email()),
        buildFullName(firstName, lastName),
        false
    );
  }

  @Transactional
  public AuthResponse verifyEmail(VerifyRequest req) {
    VerificationToken token = verificationTokenRepository.findByToken(req.token())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid verification token."));

    if (token.isUsed()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Token already used.");
    }
    if (token.isExpired()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Token expired.");
    }

    AppUser user = token.getUser();
    user.setEmailVerified(true);
    token.setUsedAt(Instant.now());
    userRepository.save(user);
    verificationTokenRepository.save(token);

    return new AuthResponse(
        true,
        "Email verified successfully.",
        null,
        user.getEmail(),
        user.getFullName(),
        true
    );
  }

  @Transactional
  public AuthResponse resendVerification(EmailRequest req) {
    AppUser user = userRepository.findByEmailIgnoreCase(normalizeEmail(req.email()))
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found."));

    if (user.isEmailVerified() && user.getMobileNumber() != null && !user.getMobileNumber().isBlank()) {
      return new AuthResponse(
          true,
          "Email already verified.",
          null,
          user.getEmail(),
          user.getFullName(),
          true
      );
    }

    user.setEmailVerified(false);
    userRepository.save(user);
    createAndSendOtp(user);
    return new AuthResponse(
        true,
        "OTP resent successfully.",
        null,
        user.getEmail(),
        user.getFullName(),
        false
    );
  }

  @Transactional
  public AuthResponse login(LoginRequest req) {
    AppUser user = userRepository.findByEmailIgnoreCase(normalizeEmail(req.email()))
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password."));

    if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password.");
    }
    if (!user.isEmailVerified()) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Email not verified.");
    }
    if (user.getMobileNumber() == null || user.getMobileNumber().isBlank()) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Complete signup profile first.");
    }

    AuthSession session = new AuthSession();
    session.setUser(user);
    session.setSessionToken(UUID.randomUUID().toString().replace("-", ""));
    session.setExpiresAt(Instant.now().plus(Duration.ofHours(sessionHours)));
    authSessionRepository.save(session);

    return new AuthResponse(
        true,
        "Login successful.",
        session.getSessionToken(),
        user.getEmail(),
        user.getFullName(),
        true
    );
  }

  private void createAndSendOtp(AppUser user) {
    verificationTokenRepository.deleteByUser(user);

    VerificationToken token = new VerificationToken();
    token.setUser(user);
    token.setToken(generateOtp());
    token.setExpiresAt(Instant.now().plus(Duration.ofMinutes(verifyTokenMinutes)));
    verificationTokenRepository.save(token);

    boolean sent = verificationMailService.sendVerificationOtp(user.getEmail(), user.getFullName(), token.getToken());
    if (!sent) {
      throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Unable to send OTP email.");
    }
  }

  private String generateOtp() {
    return String.valueOf(ThreadLocalRandom.current().nextInt(100000, 1000000));
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
