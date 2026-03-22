package com.cricriser.cricriser.auth;

import java.util.Map;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.cricriser.cricriser.otp.OtpService;
import com.cricriser.cricriser.security.JwtBlacklistService;
import com.cricriser.cricriser.security.JwtUtil;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthRepository authRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final JwtBlacklistService jwtBlacklistService;
    private final OtpService otpService;

    // ================= SIGNUP =================
    public String signup(AuthUser user) {

        // Validate required fields
        if (user.getEmail() == null || user.getEmail().isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (user.getPassword() == null || user.getPassword().isBlank()) {
            throw new IllegalArgumentException("Password is required");
        }
        if (user.getRole() == null) {
            throw new IllegalArgumentException("Role is required");
        }

        authRepository.findByEmail(user.getEmail()).ifPresent(existing -> {
            if (Boolean.TRUE.equals(existing.getVerified())) {
                throw new IllegalArgumentException("Email already registered");
            }
            authRepository.delete(existing);
        });

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setVerified(false);

        authRepository.save(user);

        String otp = otpService.generateOtp(user.getEmail(), "SIGNUP");

    }
        return "OTP has been sent to your email";

    // ================= VERIFY OTP =================
    public String verifyOtp(String email, String otp) {

        otpService.verifyOtp(email, otp, "SIGNUP");

        AuthUser user = authRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setVerified(true);
        authRepository.save(user);

        return "Email verified successfully";
    }

    // ================= LOGIN =================
    public Map<String, Object> login(String email, String password, String roleStr) {

        Role role;
        try {
            role = Role.valueOf(roleStr);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid role");
        }

        AuthUser user = authRepository
                .findByEmailAndRole(email, role)
                .orElseThrow(() -> new RuntimeException("Invalid email or role"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        if (!Boolean.TRUE.equals(user.getVerified())) {
            throw new RuntimeException("Account not verified");
        }

        String token = jwtUtil.generateToken(
                user.getId(),
                user.getEmail(),
                user.getRole().name()
        );

        return Map.of(
                "token", token,
                "email", user.getEmail(),
                "role", user.getRole().name()
        );
    }

    // ================= FORGOT PASSWORD =================
    public String forgotPassword(String email) {

        authRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String otp = otpService.generateOtp(email, "FORGOT_PASSWORD");

        // ❌ Email removed
    }
        return "OTP has been sent to your email";

    // ================= VERIFY FORGOT OTP =================
    public String verifyForgotOtp(String email, String otp, String newPassword) {

        otpService.verifyOtp(email, otp, "FORGOT_PASSWORD");

        AuthUser user = authRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setPassword(passwordEncoder.encode(newPassword));
        authRepository.save(user);

        return "Password updated successfully";
    }

    // ================= RESET PASSWORD =================
    public String resetPassword(String email, String oldPassword, String newPassword) {

        AuthUser user = authRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new RuntimeException("Old password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        authRepository.save(user);

        return "Password changed successfully";
    }

    public void logout(String token) {
        jwtBlacklistService.blacklistToken(token);
    }

    public AuthUser me(String email) {
        return authRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public void deleteAccount(String email) {
        authRepository.delete(me(email));
    }

    public void deleteUserByEmail(String email) {
        authRepository.deleteByEmail(email);
    }
}