package com.cricriser.cricriser.admin;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody Admin admin) {
        return ResponseEntity.ok(
                Map.of("message", adminService.signup(admin))
        );
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(
                Map.of("message",
                        adminService.verifyOtp(body.get("email"), body.get("otp")))
        );
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(
                adminService.login(body.get("email"), body.get("password"))
        );
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgot(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(
                Map.of("message", adminService.forgotPassword(body.get("email")))
        );
    }

    @PostMapping("/verify-forgot-otp")
    public ResponseEntity<?> verifyForgot(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(
                Map.of("message",
                        adminService.verifyForgotOtp(
                                body.get("email"),
                                body.get("otp"),
                                body.get("newPassword")))
        );
    }

    @PutMapping("/reset-password")
    public ResponseEntity<?> resetPassword(
            @RequestHeader("Authorization") String token,
            @RequestBody Map<String, String> body) {

        return ResponseEntity.ok(
                Map.of("message",
                        adminService.resetPassword(
                                token.replace("Bearer ", ""),
                                body.get("oldPassword"),
                                body.get("newPassword")))
        );
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(@RequestHeader("Authorization") String token) {
        return ResponseEntity.ok(
                adminService.getCurrentAdmin(token.replace("Bearer ", ""))
        );
    }

    @DeleteMapping("/delete")
    public ResponseEntity<?> delete(@RequestHeader("Authorization") String token) {
        return ResponseEntity.ok(
                Map.of("message",
                        adminService.deleteCurrentAdmin(token.replace("Bearer ", "")))
        );
    }
}
