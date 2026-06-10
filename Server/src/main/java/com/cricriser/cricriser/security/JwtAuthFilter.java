package com.cricriser.cricriser.security;

import java.io.IOException;
import java.util.List;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final JwtBlacklistService jwtBlacklistService;

    public JwtAuthFilter(JwtUtil jwtUtil, JwtBlacklistService jwtBlacklistService) {
        this.jwtUtil = jwtUtil;
        this.jwtBlacklistService = jwtBlacklistService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        // Allow preflight
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            response.setStatus(HttpServletResponse.SC_OK);
            return;
        }

        String path = request.getRequestURI();
        String authHeader = request.getHeader("Authorization");

        // Public routes
        if (isPublicPath(path)) {
            // If a token is provided even on public routes, populate auth context
            // so downstream service-level auth checks can use the logged-in user.
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                try {
                    String token = authHeader.substring(7);
                    if (!jwtBlacklistService.isBlacklisted(token)) {
                        tryAuthenticate(token, request);
                    }
                } catch (RuntimeException ignored) {
                    // Keep public routes public even when token is invalid/expired.
                }
            }
            filterChain.doFilter(request, response);
            return;
        }

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("""
            { "error": "Authorization token missing" }
        """);
            return;
        }

        String token = authHeader.substring(7);

        // Blacklist check
        if (jwtBlacklistService.isBlacklisted(token)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("""
            { "error": "You are logged out. Please login again." }
        """);
            return;
        }

        try {
            // 🔑 Parse JWT ONLY ONCE
            String email = jwtUtil.extractEmail(token);

            UsernamePasswordAuthenticationToken authToken
                    = new UsernamePasswordAuthenticationToken(email, null, List.of());

            authToken.setDetails(
                    new WebAuthenticationDetailsSource().buildDetails(request));

            SecurityContextHolder.getContext().setAuthentication(authToken);

            filterChain.doFilter(request, response);

        } catch (RuntimeException e) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("""
            { "error": "Session expired. Please login again." }
        """);
        }
    }

    private void tryAuthenticate(String token, HttpServletRequest request) {
        String email = jwtUtil.extractEmail(token);

        UsernamePasswordAuthenticationToken authToken
                = new UsernamePasswordAuthenticationToken(email, null, List.of());

        authToken.setDetails(
                new WebAuthenticationDetailsSource().buildDetails(request));

        SecurityContextHolder.getContext().setAuthentication(authToken);
    }

    //  PUBLIC URL HELPER
    private boolean isPublicPath(String path) {
        return path.startsWith("/api/auth/signup")
                || path.startsWith("/api/auth/login")
                || path.startsWith("/api/auth/verify-otp")
                || path.startsWith("/api/auth/forgot-password")
                || path.startsWith("/api/auth/verify-forgot-otp")
                || path.startsWith("/api/admin/signup")
                || path.startsWith("/api/admin/login")
                || path.startsWith("/api/admin/verify-otp")
                || path.startsWith("/api/admin/forgot-password")
                || path.startsWith("/api/admin/verify-forgot-otp")
                || path.startsWith("/api/player/signup")
                || path.startsWith("/api/player/login")
                || path.startsWith("/api/player/forgot-password")
                || path.startsWith("/api/player/verify-otp")
                || path.startsWith("/api/player/verify-forgot-otp")
                || path.startsWith("/api/team-owner/signup")
                || path.startsWith("/api/team-owner/login")
                || path.startsWith("/api/team-owner/forgot-password")
                || path.startsWith("/api/team-owner/verify-otp")
                || path.startsWith("/api/team-owner/verify-forgot-otp")
                // ✅ PUBLIC MATCH VIEWING ENDPOINTS
                || path.startsWith("/api/matches/")
                || path.startsWith("/api/match/score/")
                || path.startsWith("/api/match/scoreboard/")
                || path.startsWith("/api/ball-by-ball/match/")
                || path.startsWith("/api/match-player-stats/match/")
                || path.startsWith("/api/match-player-stats/player")
                || path.startsWith("/api/player-stats/")
                || path.equals("/api/players")
                || path.startsWith("/api/players/")
                || path.startsWith("/api/leagues/")
                || path.equals("/api/teams")
                || path.startsWith("/api/teams/")
                || path.startsWith("/api/points/");
    }

}
