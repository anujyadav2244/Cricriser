package com.cricriser.cricriser.otp;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.cricriser.cricriser.service.EmailService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OtpService {

    private final OtpRepository otpRepository;
    private final PasswordEncoder passwordEncoder;
    private final Optional<EmailService> emailService;

    @Value("${app.otp.valid-minutes:10}")
    private int otpValidMinutes;

    @Value("${app.otp.log-to-console:true}")
    private boolean logOtpToConsole;

    public String generateOtp(String email, String purpose) {

        otpRepository.findAllByEmailAndPurposeAndUsedFalse(email, purpose)
                .forEach(otpRepository::delete);

        String otp = String.format("%06d", new Random().nextInt(1_000_000));

        OtpToken token = new OtpToken();
        token.setEmail(email);
        token.setPurpose(purpose);
        token.setOtp(passwordEncoder.encode(otp));
        token.setExpiresAt(LocalDateTime.now().plusMinutes(otpValidMinutes));
        token.setUsed(false);

        otpRepository.save(token);
        
        // Graceful fallback for deployments where SMTP is not configured yet.
        if (emailService.isPresent()) {
            try {
                emailService.get().sendOtpEmail(email, otp);
                System.out.println("[OtpService] OTP email sent for purpose: " + purpose);
                if (logOtpToConsole) {
                    System.out.println("[OtpService] OTP for " + email + " (" + purpose + "): " + otp);
                }
            } catch (RuntimeException e) {
                System.err.println("[OtpService] Email delivery failed for " + email + " reason: " + e.getMessage());
                System.out.println("[OtpService] Fallback OTP for " + email + " (" + purpose + "): " + otp);
            }
        } else {
            System.out.println("[OtpService] Email service not enabled. Fallback OTP for " + email + " (" + purpose + "): " + otp);
        }
        
        return otp;
    }

    public void verifyOtp(String email, String otp, String purpose) {

        OtpToken token = otpRepository
                .findByEmailAndPurposeAndUsedFalse(email, purpose)
                .orElseThrow(() -> new IllegalArgumentException("OTP not found"));

        if (LocalDateTime.now().isAfter(token.getExpiresAt())) {
            throw new IllegalArgumentException("OTP expired");
        }

        if (!passwordEncoder.matches(otp, token.getOtp())) {
            throw new IllegalArgumentException("Invalid OTP");
        }

        token.setUsed(true);
        otpRepository.delete(token); 

    }
}
