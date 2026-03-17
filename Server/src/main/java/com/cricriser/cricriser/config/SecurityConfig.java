package com.cricriser.cricriser.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import static org.springframework.security.config.Customizer.withDefaults;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.cricriser.cricriser.security.JwtAuthFilter;

@Configuration
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
                //  CSRF NOT NEEDED (JWT)
                .csrf(csrf -> csrf.disable())
                // ✅ ENABLE CORS (uses CorsConfig bean)
                .cors(withDefaults())
                //  STATELESS SESSION
                .sessionManagement(session
                        -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                // ✅ AUTHORIZATION
                .authorizeHttpRequests(auth -> auth
                // ⭐ THIS FIXES YOUR 403 OPTIONS ERROR
                .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**")
                .permitAll()
                // PUBLIC ENDPOINTS
                .requestMatchers(
                        "/api/auth/**",
                        "/api/admin/signup",
                        "/api/admin/login",
                        "/api/admin/verify-otp",
                        "/api/admin/forgot-password",
                        "/api/admin/verify-forgot-otp",
                        "/api/player/signup",
                        "/api/player/login",
                        "/api/player/verify-otp",
                        "/api/player/forgot-password",
                        "/api/player/verify-forgot-otp",
                        "/api/team-owner/signup",
                        "/api/team-owner/login",
                        "/api/team-owner/verify-otp",
                        "/api/team-owner/forgot-password",
                        "/api/team-owner/verify-forgot-otp",
                        // ✅ PUBLIC MATCH VIEWING ENDPOINTS
                        "/api/matches/**",
                        "/api/match/score/**",
                        "/api/match/scoreboard/**",
                        "/api/ball-by-ball/match/**",
                        "/api/match-player-stats/match/**",
                        "/api/match-player-stats/player",
                        "/api/match-player-stats/player/**",
                        "/api/player-stats/**",
                        "/api/players/**",
                        "/api/leagues/**",
                        "/api/teams/**",
                        "/api/points/**"
                ).permitAll()
                // EVERYTHING ELSE AUTHENTICATED
                .anyRequest().authenticated()
                )
                // JWT FILTER
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }
}
