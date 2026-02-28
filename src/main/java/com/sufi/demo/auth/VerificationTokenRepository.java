package com.sufi.demo.auth;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VerificationTokenRepository extends JpaRepository<VerificationToken, Long> {
  Optional<VerificationToken> findByToken(String token);
  Optional<VerificationToken> findTopByTokenAndUserEmailIgnoreCaseOrderByIdDesc(String token, String email);
  void deleteByUser(AppUser user);
}
