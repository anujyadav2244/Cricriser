package com.cricriser.cricriser.teamowner;

import java.util.Map;

import org.springframework.stereotype.Service;

import com.cricriser.cricriser.auth.AuthService;
import com.cricriser.cricriser.auth.AuthUser;
import com.cricriser.cricriser.auth.Role;
import com.cricriser.cricriser.security.JwtUtil;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TeamOwnerService {

    private final AuthService authService;
    private final JwtUtil jwtUtil;

    // ================= SIGNUP =================
    public String signup(TeamOwner owner) {

        AuthUser user = new AuthUser();
        user.setName(owner.getName());
        user.setEmail(owner.getEmail());
        user.setPassword(owner.getPassword());
        user.setRole(Role.TEAM_OWNER);

        return authService.signup(user);
    }

    // ================= VERIFY OTP =================
    public String verifyOtp(String email, String otp) {
        return authService.verifyOtp(email, otp);
    }

    // ================= LOGIN =================
    public Map<String, Object> login(String email, String password) {
        return authService.login(email, password, "TEAM_OWNER");
    }

    // ================= FORGOT PASSWORD =================
    public String forgotPassword(String email) {
        return authService.forgotPassword(email);
    }

    // ================= VERIFY FORGOT OTP =================
    public String verifyForgotOtp(String email, String otp, String newPassword) {
        return authService.verifyForgotOtp(email, otp, newPassword);
    }

    // ================= RESET PASSWORD =================
    public String resetPassword(String token, String oldPassword, String newPassword) {

        String email = jwtUtil.extractEmail(token);
        return authService.resetPassword(email, oldPassword, newPassword);
    }

    // ================= CURRENT TEAM OWNER =================
    public AuthUser getCurrentOwner(String token) {

        String email = jwtUtil.extractEmail(token);
        return authService.me(email);
    }

    // ================= DELETE =================
    public String deleteCurrentOwner(String token) {

        String email = jwtUtil.extractEmail(token);
        authService.deleteAccount(email);
        return "Team Owner account deleted";
    }

    // ================= LOGOUT =================
    public void logout(String token) {
        authService.logout(token);
    }

    


}
