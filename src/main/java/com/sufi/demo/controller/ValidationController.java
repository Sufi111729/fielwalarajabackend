package com.sufi.demo.controller;

import com.sufi.demo.service.ImageValidationService;
import com.sufi.demo.service.ImageValidationService.Meta;
import com.sufi.demo.service.ImageValidationService.ValidationError;
import com.sufi.demo.service.ImageValidationService.ValidationResult;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api")
@CrossOrigin(
    originPatterns = {"http://localhost:*", "https://*.vercel.app", "https://filewalaraja.com", "https://www.filewalaraja.com"},
    allowedHeaders = "*",
    methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS}
)
public class ValidationController {

  private final ImageValidationService imageValidationService;

  @Value("${app.features.enhance-enabled:false}")
  private boolean enhanceEnabled;

  public ValidationController(ImageValidationService imageValidationService) {
    this.imageValidationService = imageValidationService;
  }

  @GetMapping(value = "/ping", produces = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<Map<String, String>> ping() {
    return ResponseEntity.ok(Map.of(
        "message", "pong",
        "time", Instant.now().toString()
    ));
  }

  @PostMapping(value = "/validate", consumes = MediaType.MULTIPART_FORM_DATA_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<ValidationResult> validate(@RequestPart("file") MultipartFile file,
      @RequestParam(required = false) String presetId,
      @RequestParam(required = false) Integer expectedWidth,
      @RequestParam(required = false) Integer expectedHeight) {
    ValidationResult result = imageValidationService.validate(file, presetId, expectedWidth, expectedHeight);
    return ResponseEntity.ok(result);
  }

  @PostMapping(value = "/enhance", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<?> enhance(@RequestPart("file") MultipartFile file,
      @RequestParam(defaultValue = "photo") String mode) {
    if (!enhanceEnabled) {
      ValidationResult disabled = new ValidationResult(false,
          List.of(new ValidationError("FEATURE_DISABLED", "Enhancement is disabled.")), new Meta());
      return ResponseEntity.status(HttpStatus.NOT_FOUND).body(disabled);
    }

    try {
      byte[] enhanced = imageValidationService.enhance(file);
      return ResponseEntity.ok().contentType(MediaType.IMAGE_JPEG)
          .header(HttpHeaders.CACHE_CONTROL, "no-store").header("X-Enhance-Mode", mode).body(enhanced);
    } catch (Exception e) {
      ValidationResult failed = new ValidationResult(false,
          List.of(new ValidationError("ENHANCE_FAILED", e.getMessage())), new Meta());
      return ResponseEntity.badRequest().body(failed);
    }
  }

  @PostMapping(value = "/remove-bg-white", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<?> removeBgWhite(@RequestPart("file") MultipartFile file) {
    try {
      byte[] cleaned = imageValidationService.removeBackgroundToWhite(file);
      return ResponseEntity.ok()
          .contentType(MediaType.IMAGE_JPEG)
          .header(HttpHeaders.CACHE_CONTROL, "no-store")
          .body(cleaned);
    } catch (Exception e) {
      ValidationResult failed = new ValidationResult(
          false,
          List.of(new ValidationError("BG_REMOVE_FAILED", e.getMessage())),
          new Meta());
      return ResponseEntity.badRequest().body(failed);
    }
  }
}
