package com.cricriser.cricriser.player;

import java.io.IOException;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.cricriser.cricriser.auth.AuthService;
import com.cricriser.cricriser.auth.AuthUser;
import com.cricriser.cricriser.cloudinary.CloudinaryService;
import com.cricriser.cricriser.player.playerstats.PlayerStats;
import com.cricriser.cricriser.player.playerstats.PlayerStatsRepository;
import com.cricriser.cricriser.security.JwtUtil;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PlayerService {

    private final PlayerRepository playerRepository;
    private final PlayerStatsRepository statsRepository;
    private final JwtUtil jwtUtil;
    private final AuthService authService;
    private final CloudinaryService cloudinaryService;


    /* ================= CREATE PROFILE ================= */
 /* ================= CREATE PROFILE ================= */
    public Player createPlayerProfile(
            String token,
            String name,
            String role,
            String battingStyle,
            String bowlingType,
            String bowlingHand,
            String bowlingStyle,
            MultipartFile photo
    ) throws IOException {

        String email = jwtUtil.extractEmail(token);
        AuthUser user = authService.me(email);

        if (user == null) {
            throw new SecurityException("Invalid token");
        }

        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Player name is required");
        }

        if (role == null || role.isBlank()) {
            throw new IllegalArgumentException("Player role is required");
        }

        if (playerRepository.findByAuthEmail(email).isPresent()) {
            throw new IllegalStateException("Player profile already exists");
        }

        Player player = new Player();
        player.setAuthEmail(email);
        player.setName(name);
        player.setRole(role);

        if (battingStyle != null) {
            player.setBattingStyle(battingStyle);
        }

        if (bowlingType != null) {
            player.setBowlingType(bowlingType);
        }

        if (bowlingHand != null) {
            player.setBowlingHand(bowlingHand);
        }

        if (bowlingStyle != null) {
            player.setBowlingStyle(bowlingStyle);
        }

        // ✅ IMAGE UPLOAD (same pattern as update)
        if (photo != null && !photo.isEmpty()) {
            String imageUrl = cloudinaryService.uploadFile(photo, "players");
            player.setPhotoUrl(imageUrl);
        }

        Player saved = playerRepository.save(player);

        // ✅ Create empty stats record
        PlayerStats stats = new PlayerStats();
        stats.setPlayerId(saved.getId());
        statsRepository.save(stats);

        return saved;
    }

    /* ================= GET PROFILE ================= */
    public Player getMyProfile(String token) {

        String email = jwtUtil.extractEmail(token);

        return playerRepository.findByAuthEmail(email)
                .orElseThrow(()
                        -> new IllegalStateException("Player profile not found")
                );
    }

    /* ================= UPDATE PROFILE ================= */
    public Player updateProfile(
            String token,
            String name,
            String role,
            String battingStyle,
            String bowlingType,
            String bowlingHand,
            String bowlingStyle,
            MultipartFile photo
    ) throws IOException {

        Player player = getMyProfile(token);

        if (name != null) {
            player.setName(name);
        }
        if (role != null) {
            player.setRole(role);
        }
        if (battingStyle != null) {
            player.setBattingStyle(battingStyle);
        }
        if (bowlingType != null) {
            player.setBowlingType(bowlingType);
        }
        if (bowlingHand != null) {
            player.setBowlingHand(bowlingHand);
        }
        if (bowlingStyle != null) {
            player.setBowlingStyle(bowlingStyle);
        }

        if (photo != null && !photo.isEmpty()) {
            String imageUrl = cloudinaryService.uploadFile(photo, "players");
            player.setPhotoUrl(imageUrl);
        }

        return playerRepository.save(player);
    }

    /* ================= DELETE PROFILE ================= */
    public void deleteProfile(String token) {

        String email = jwtUtil.extractEmail(token);

        Player player = playerRepository.findByAuthEmail(email)
                .orElseThrow(()
                        -> new IllegalStateException("Player profile not found")
                );

        statsRepository.deleteByPlayerId(player.getId());
        playerRepository.deleteById(player.getId());
        authService.deleteUserByEmail(email);
    }

    
}
