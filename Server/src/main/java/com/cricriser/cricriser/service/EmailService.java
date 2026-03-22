package com.cricriser.cricriser.service;

import java.util.Objects;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
@ConditionalOnProperty(name = "email.enabled", havingValue = "true")
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String senderEmail;

    @Value("${app.otp.valid-minutes:10}")
    private int otpValidMinutes;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendOtpEmail(String toEmail, String otp) {
        try {
            System.out.println("[EmailService] Preparing to send OTP to: " + toEmail);

            if (senderEmail == null || senderEmail.isBlank()) {
                throw new IllegalStateException("SPRING_MAIL_USERNAME is missing. Configure SMTP sender email.");
            }

            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setTo(Objects.requireNonNull(toEmail));
            helper.setFrom(Objects.requireNonNull(senderEmail));
            helper.setReplyTo(Objects.requireNonNull(senderEmail));
            helper.setSubject("Your cricriser OTP");

                String textContent = "Your Cricriser OTP is " + otp
                    + ". It is valid for " + otpValidMinutes
                    + " minutes. If you did not request this, please ignore this message.";

            String htmlContent = """
                <html>
                    <body style="font-family: 'Segoe UI', sans-serif; background-color: #F9FAFB; padding: 20px;">
                        <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                            <h1 style="color: #10B981; text-align:center;">cricriser Verification</h1>
                            <p style="font-size: 16px; color: #0F172A;">
                                Thank you for registering with <strong>cricriser</strong>!
                            </p>
                            <p style="font-size: 16px; color: #0F172A;">
                                Your One-Time Password (OTP) is:
                            </p>
                            <div style="font-size: 24px; font-weight: bold; color: #14B8A6; margin: 20px 0; text-align:center;">
                                %s
                            </div>
                            <p style="font-size: 14px; color: #0F172A;">
                                Please enter this OTP in the app to verify your account. This code is valid for %d minutes.
                            </p>
                            <p style="font-size: 14px; color: #0F172A;">If you didn’t request this email, you can safely ignore it.</p>
                        </div>
                    </body>
                </html>
            """.formatted(otp, otpValidMinutes);

            helper.setText(textContent, Objects.requireNonNull(htmlContent));

            mailSender.send(mimeMessage);

            System.out.println("[EmailService] OTP email sent to: " + toEmail);

        } catch (MessagingException e) {
            System.err.println("[EmailService] Failed to send OTP email to: " + toEmail);
            throw new RuntimeException("Failed to send OTP email. Please try again later.", e);
        } catch (MailException e) {
            System.err.println("[EmailService] Failed to send OTP email to: " + toEmail + " reason: " + e.getMessage());
            throw new RuntimeException("Failed to send OTP email. Check SMTP configuration and credentials.", e);
        }
    }
}