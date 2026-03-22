package com.cricriser.cricriser.auth;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cricriser.cricriser.security.JwtUtil;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final JwtUtil jwtUtil;

    // ================= SIGNUP =================
    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody AuthUser user) {
        return ResponseEntity.ok(       
                Map.of("message", authService.signup(user))
        );
    }

    // ================= VERIFY SIGNUP OTP =================
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verify(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(
                Map.of(
                        "message",
                        authService.verifyOtp(body.get("email"), body.get("otp"))
                )
        );
    }

    // ================= LOGIN (FIXED) =================
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {

        String email = body.get("email");
        String password = body.get("password");
        String roleStr = body.get("role"); 

        System.out.println("Email"+email);
        System.out.println("Password"+password);
        System.out.println("Role"+roleStr);

        if (email == null || password == null || roleStr == null) {
            throw new RuntimeException("Email, password and role are required");
        }

        return ResponseEntity.ok(
                authService.login(email, password, roleStr)
        );
    }

    // ================= FORGOT PASSWORD =================
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgot(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(
                Map.of("message",
                        authService.forgotPassword(body.get("email")))
        );
    }

    // ================= VERIFY FORGOT OTP =================
    @PostMapping("/verify-forgot-otp")
    public ResponseEntity<?> verifyForgot(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(
                Map.of("message",
                        authService.verifyForgotOtp(
                                body.get("email"),
                                body.get("otp"),
                                body.get("newPassword")))
        );
    }

    // ================= RESET PASSWORD (LOGGED IN) =================
    @PutMapping("/reset-password")
    public ResponseEntity<?> reset(
            @RequestHeader("Authorization") String token,
            @RequestBody Map<String, String> body) {

        String email = jwtUtil.extractEmail(token.replace("Bearer ", ""));

        return ResponseEntity.ok(
                Map.of("message",
                        authService.resetPassword(
                                email,
                                body.get("oldPassword"),
                                body.get("newPassword")))
        );
    }

    // ================= DELETE ACCOUNT =================
    @DeleteMapping("/delete")
    public ResponseEntity<?> delete(@RequestHeader("Authorization") String token) {

        authService.deleteAccount(
                jwtUtil.extractEmail(token.replace("Bearer ", ""))
        );

        return ResponseEntity.ok(
                Map.of("message", "Account deleted")
        );
    }
}
