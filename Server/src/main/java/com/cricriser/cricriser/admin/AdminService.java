package com.cricriser.cricriser.admin;

import java.util.Map;

import org.springframework.stereotype.Service;

import com.cricriser.cricriser.auth.AuthService;
import com.cricriser.cricriser.auth.AuthUser;
import com.cricriser.cricriser.auth.Role;
import com.cricriser.cricriser.security.JwtUtil;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final AuthService authService;
    private final JwtUtil jwtUtil;

    public String signup(Admin admin) {

        AuthUser user = new AuthUser();
        user.setName(admin.getName());
        user.setEmail(admin.getEmail());
        user.setPassword(admin.getPassword());
        user.setRole(Role.ADMIN);

        return authService.signup(user);
    }

    public String verifyOtp(String email, String otp) {
        return authService.verifyOtp(email, otp);
    }

    public Map<String, Object> login(String email, String password) {
        return authService.login(email, password, "ADMIN");
    }

    public String forgotPassword(String email) {
        return authService.forgotPassword(email);
    }

    public String verifyForgotOtp(String email, String otp, String newPassword) {
        return authService.verifyForgotOtp(email, otp, newPassword);
    }

    public String resetPassword(String token, String oldPassword, String newPassword) {

        String email = jwtUtil.extractEmail(token);
        return authService.resetPassword(email, oldPassword, newPassword);
    }

    public AuthUser getCurrentAdmin(String token) {

        String email = jwtUtil.extractEmail(token);
        return authService.me(email);
    }

    public String deleteCurrentAdmin(String token) {

        String email = jwtUtil.extractEmail(token);
        authService.deleteAccount(email);
        return "Admin account deleted";
    }

    public void logout(String token) {
        authService.logout(token);
    }
}
