package com.sufi.demo.auth;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class UserDataSeeder implements CommandLineRunner {

  private final AppUserRepository userRepository;
  private final BCryptPasswordEncoder passwordEncoder;

  public UserDataSeeder(AppUserRepository userRepository, BCryptPasswordEncoder passwordEncoder) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
  }

  @Override
  public void run(String... args) {
    if (userRepository.count() > 0) {
      return;
    }

    AppUser demo = new AppUser();
    demo.setFullName("Demo User");
    demo.setEmail("demo@filewalaraja.com");
    demo.setMobileNumber("9999999999");
    demo.setEmailVerified(true);
    demo.setPasswordHash(passwordEncoder.encode("Demo@12345"));
    userRepository.save(demo);
  }
}
