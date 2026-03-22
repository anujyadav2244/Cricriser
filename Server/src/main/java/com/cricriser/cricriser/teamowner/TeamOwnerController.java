package com.cricriser.cricriser.teamowner;

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
@RequestMapping("/api/team-owner")
@RequiredArgsConstructor
public class TeamOwnerController {

    private final TeamOwnerService teamOwnerService;

    // ================= SIGNUP =================
    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody TeamOwner owner) {
        return ResponseEntity.ok(
                Map.of("message", teamOwnerService.signup(owner))
        );
    }

    // ================= VERIFY OTP =================
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(
                Map.of("message",
                        teamOwnerService.verifyOtp(body.get("email"), body.get("otp")))
        );
    }

    // ================= LOGIN =================
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(
                teamOwnerService.login(body.get("email"), body.get("password"))
        );
    }

    // ================= FORGOT PASSWORD =================
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgot(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(
                Map.of("message", teamOwnerService.forgotPassword(body.get("email")))
        );
    }

    // ================= VERIFY FORGOT OTP =================
    @PostMapping("/verify-forgot-otp")
    public ResponseEntity<?> verifyForgot(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(
                Map.of("message",
                        teamOwnerService.verifyForgotOtp(
                                body.get("email"),
                                body.get("otp"),
                                body.get("newPassword")))
        );
    }

    // ================= RESET PASSWORD =================
    @PutMapping("/reset-password")
    public ResponseEntity<?> resetPassword(
            @RequestHeader("Authorization") String token,
            @RequestBody Map<String, String> body) {

        return ResponseEntity.ok(
                Map.of("message",
                        teamOwnerService.resetPassword(
                                token.replace("Bearer ", ""),
                                body.get("oldPassword"),
                                body.get("newPassword")))
        );
    }

    // ================= CURRENT TEAM OWNER =================
    @GetMapping("/me")
    public ResponseEntity<?> me(@RequestHeader("Authorization") String token) {
        return ResponseEntity.ok(
                teamOwnerService.getCurrentOwner(token.replace("Bearer ", ""))
        );
    }

    // ================= DELETE =================
    @DeleteMapping("/delete")
    public ResponseEntity<?> delete(@RequestHeader("Authorization") String token) {
        return ResponseEntity.ok(
                Map.of("message",
                        teamOwnerService.deleteCurrentOwner(token.replace("Bearer ", "")))
        );
    }

    


}
