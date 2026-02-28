package com.sufi.demo.ratelimit;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

  private static class Bucket {
    double tokens;
    long lastRefillMs;

    Bucket(double tokens, long lastRefillMs) {
      this.tokens = tokens;
      this.lastRefillMs = lastRefillMs;
    }
  }

  private static final int CAPACITY = 30;
  private static final double REFILL_PER_SEC = 0.5;
  private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

  @Override
  protected boolean shouldNotFilter(HttpServletRequest request) {
    String path = request.getRequestURI();
    return !path.startsWith("/api/");
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
      FilterChain filterChain) throws ServletException, IOException {
    String ip = getClientIp(request);
    long now = Instant.now().toEpochMilli();

    Bucket bucket = buckets.computeIfAbsent(ip, k -> new Bucket(CAPACITY, now));

    synchronized (bucket) {
      refill(bucket, now);
      if (bucket.tokens < 1.0) {
        response.setStatus(429);
        response.setContentType("application/json");
        response.getWriter().write(
            "{\"ok\":false,\"errors\":[{\"code\":\"RATE_LIMIT\",\"message\":\"Too many requests\"}],\"meta\":{}}");
        return;
      }
      bucket.tokens -= 1.0;
    }

    filterChain.doFilter(request, response);
  }

  private static void refill(Bucket bucket, long nowMs) {
    long elapsedMs = nowMs - bucket.lastRefillMs;
    if (elapsedMs <= 0) {
      return;
    }

    double refill = (elapsedMs / 1000.0) * REFILL_PER_SEC;
    bucket.tokens = Math.min(CAPACITY, bucket.tokens + refill);
    bucket.lastRefillMs = nowMs;
  }

  private static String getClientIp(HttpServletRequest request) {
    String forwarded = request.getHeader("X-Forwarded-For");
    if (forwarded != null && !forwarded.isBlank()) {
      return forwarded.split(",")[0].trim();
    }
    return request.getRemoteAddr();
  }
}
