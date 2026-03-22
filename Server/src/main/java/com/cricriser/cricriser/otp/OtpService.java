package com.cricriser.cricriser.otp;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

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

    private static final int OTP_EXPIRY_MINUTES = 5;

    public String generateOtp(String email, String purpose) {

        otpRepository.findAllByEmailAndPurposeAndUsedFalse(email, purpose)
                .forEach(otpRepository::delete);

        String otp = String.format("%06d", new Random().nextInt(1_000_000));

        OtpToken token = new OtpToken();
        token.setEmail(email);
        token.setPurpose(purpose);
        token.setOtp(passwordEncoder.encode(otp));
        token.setExpiresAt(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES));
        token.setUsed(false);

        otpRepository.save(token);
        
        // OTP-based auth depends on email delivery; fail fast if unavailable.
        EmailService sender = emailService.orElseThrow(
                () -> new IllegalStateException("OTP email service is disabled. Please enable EMAIL_ENABLED and mail credentials.")
        );

        sender.sendOtpEmail(email, otp);
        System.out.println("[OtpService] OTP email sent for purpose: " + purpose);
        
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
