package com.sufi.demo.auth;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.nio.charset.StandardCharsets;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class VerificationMailService {

  private static final Logger log = LoggerFactory.getLogger(VerificationMailService.class);

  private final JavaMailSender mailSender;

  @Value("${app.auth.mock-email:true}")
  private boolean mockEmail;

  @Value("${spring.mail.username:no-reply@filewalaraja.com}")
  private String fromEmail;

  public VerificationMailService(JavaMailSender mailSender) {
    this.mailSender = mailSender;
  }

  public boolean sendVerificationOtp(String toEmail, String fullName, String otpCode) {
    if (mockEmail) {
      log.info("Mock verification email to {} with OTP: {}", toEmail, otpCode);
      return true;
    }

    try {
      MimeMessage mimeMessage = mailSender.createMimeMessage();
      MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, StandardCharsets.UTF_8.name());
      helper.setFrom(fromEmail);
      helper.setTo(toEmail);
      helper.setReplyTo(fromEmail);
      helper.setSubject("File Wala Raja | Email Verification OTP");
      String safeName = safeText(fullName);
      String plainText = """
          Dear %s,

          Your File Wala Raja verification OTP is: %s
          This OTP is valid for 30 minutes.

          If you did not request this OTP, please ignore this email.

          Regards,
          File Wala Raja Team
          """.formatted(safeName, otpCode);
      String htmlText = """
          <!doctype html>
          <html>
            <body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
              <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="background:#f8fafc;padding:24px 0;">
                <tr>
                  <td align="center">
                    <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
                      <tr>
                        <td style="background:#dc2626;color:#ffffff;padding:16px 20px;font-size:20px;font-weight:700;">
                          File Wala Raja
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:20px;">
                          <p style="margin:0 0 10px 0;font-size:14px;">Dear %s,</p>
                          <p style="margin:0 0 14px 0;font-size:14px;color:#334155;">
                            Use this OTP to verify your email address.
                          </p>
                          <div style="margin:0 0 14px 0;padding:14px;border:1px dashed #dc2626;border-radius:10px;background:#fff7f7;text-align:center;">
                            <span style="font-size:30px;letter-spacing:6px;font-weight:700;color:#b91c1c;">%s</span>
                          </div>
                          <p style="margin:0 0 8px 0;font-size:13px;color:#475569;">OTP validity: <strong>30 minutes</strong></p>
                          <p style="margin:0;font-size:12px;color:#64748b;">
                            If you did not request this OTP, you can safely ignore this email.
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:12px 20px;background:#f1f5f9;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;">
                          Regards, File Wala Raja Team
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
          </html>
          """.formatted(safeName, otpCode);
      helper.setText(plainText, htmlText);

      mailSender.send(mimeMessage);
      log.info("OTP email sent to {}", toEmail);
      return true;
    } catch (MessagingException | RuntimeException e) {
      log.error("Failed to send verification email to {}", toEmail, e);
      return false;
    }
  }

  private String safeText(String value) {
    return value == null ? "User" : value.replaceAll("\\s+", " ").trim();
  }
}
