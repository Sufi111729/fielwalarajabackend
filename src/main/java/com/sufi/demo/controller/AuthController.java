package com.sufi.demo.controller;

import com.sufi.demo.auth.AuthService;
import com.sufi.demo.auth.dto.AuthResponse;
import com.sufi.demo.auth.dto.EmailRequest;
import com.sufi.demo.auth.dto.LoginRequest;
import com.sufi.demo.auth.dto.OtpVerifyRequest;
import com.sufi.demo.auth.dto.SignupCompleteRequest;
import com.sufi.demo.auth.dto.SignupRequest;
import com.sufi.demo.auth.dto.SignupStartRequest;
import com.sufi.demo.auth.dto.VerifyRequest;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value = "/api/auth", produces = MediaType.APPLICATION_JSON_VALUE)
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
public class AuthController {

  private final AuthService authService;

  public AuthController(AuthService authService) {
    this.authService = authService;
  }

  @PostMapping("/signup")
  public AuthResponse signup(@Valid @RequestBody SignupRequest req) {
    return authService.signup(req);
  }

  @PostMapping("/signup/send-otp")
  public AuthResponse sendSignupOtp(@Valid @RequestBody SignupStartRequest req) {
    return authService.startSignup(req);
  }

  @PostMapping("/signup/verify-otp")
  public AuthResponse verifySignupOtp(@Valid @RequestBody OtpVerifyRequest req) {
    return authService.verifySignupOtp(req);
  }

  @PostMapping("/signup/complete")
  public AuthResponse completeSignup(@Valid @RequestBody SignupCompleteRequest req) {
    return authService.completeSignup(req);
  }

  @PostMapping("/verify-email")
  public AuthResponse verifyEmail(@Valid @RequestBody VerifyRequest req) {
    return authService.verifyEmail(req);
  }

  @PostMapping("/resend-verification")
  public AuthResponse resendVerification(@Valid @RequestBody EmailRequest req) {
    return authService.resendVerification(req);
  }

  @PostMapping("/login")
  public AuthResponse login(@Valid @RequestBody LoginRequest req) {
    return authService.login(req);
  }
}
