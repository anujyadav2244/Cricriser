package com.cricriser.cricriser.team;

import java.io.IOException;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.multipart.MultipartFile;

import com.cricriser.cricriser.cloudinary.CloudinaryService;
import com.cricriser.cricriser.player.Player;
import com.cricriser.cricriser.player.PlayerRepository;
import com.cricriser.cricriser.security.JwtBlacklistService;
import com.cricriser.cricriser.security.JwtUtil;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TeamService {

    private final TeamRepository teamRepository;
    private final PlayerRepository playerRepository;
    private final JwtUtil jwtUtil;
    private final JwtBlacklistService blacklistService;
    private final CloudinaryService cloudinaryService;
    private final ObjectMapper objectMapper;

    // ================= CREATE GLOBAL TEAM =================
    public Team createTeam(String token, String teamJson, MultipartFile logoFile) throws Exception {

        String userId = jwtUtil.extractUserId(token.substring(7));
        String role = jwtUtil.extractRole(token.substring(7));

        if (!"TEAM_OWNER".equals(role)) {
            throw new IllegalArgumentException("Only Team Owner can create teams");
        }

        Team team = objectMapper.readValue(teamJson, Team.class);

        if (teamRepository.existsByNameIgnoreCase(team.getName())) {
            throw new IllegalArgumentException("Team name already exists");
        }

        // ✅ FIX
        team.setOwnerId(userId);

        validateTeam(team);

        if (logoFile != null && !logoFile.isEmpty()) {
            try {
                team.setLogoUrl(
                        cloudinaryService.uploadFile(logoFile, "team_logos"));
            } catch (IOException ex) {
                throw new IllegalStateException("Logo upload failed. Please try again later or create team without logo.");
            }
        }

        Team saved = teamRepository.save(team);
        assignPlayersToTeam(saved.getId(), saved.getSquadPlayerIds());

        return saved;
    }

    // ================= UPDATE =================
    public Team updateTeam(
            String token,
            String teamId,
            String teamJson,
            MultipartFile logoFile
    ) throws Exception {

        String jwt = token.substring(7);
        String userId = jwtUtil.extractUserId(jwt);
        String role = jwtUtil.extractRole(jwt);

        if (!"TEAM_OWNER".equals(role)) {
            throw new IllegalArgumentException("Access denied");
        }

        Team existing = teamRepository.findById(teamId)
                .orElseThrow(() -> new IllegalArgumentException("Team not found"));

        if (!existing.getOwnerId().equals(userId)) {
            throw new IllegalArgumentException("Unauthorized");
        }

        // 🔹 Store OLD squad before update (important)
        List<String> oldSquad = existing.getSquadPlayerIds();

        // 🔹 Parse incoming partial update
        Team incoming = objectMapper.readValue(teamJson, Team.class);

        // 🔹 Apply ONLY provided fields
        if (incoming.getCoach() != null) {
            existing.setCoach(incoming.getCoach());
        }

        if (incoming.getCaptainId() != null) {
            existing.setCaptainId(incoming.getCaptainId());
        }

        if (incoming.getViceCaptainId() != null) {
            existing.setViceCaptainId(incoming.getViceCaptainId());
        }

        if (incoming.getSquadPlayerIds() != null) {
            existing.setSquadPlayerIds(incoming.getSquadPlayerIds());
        }

        // 🔹 Logo update
        if (logoFile != null && !logoFile.isEmpty()) {
            try {
                if (existing.getLogoUrl() != null) {
                    cloudinaryService.deleteFile(existing.getLogoUrl());
                }
                existing.setLogoUrl(
                        cloudinaryService.uploadFile(logoFile, "team_logos")
                );
            } catch (IOException ex) {
                throw new IllegalStateException("Logo upload failed. Please try again later.");
            }
        }

        // ✅ Validate FINAL state
        validateTeam(existing);

        // ✅ SAVE TEAM FIRST
        Team savedTeam = teamRepository.save(existing);

        List<String> newSquad = savedTeam.getSquadPlayerIds();

        // ================= PLAYER UNASSIGN =================
        // Players removed from squad
        for (String pid : oldSquad) {
            if (!newSquad.contains(pid)) {
                playerRepository.findById(pid).ifPresent(player -> {
                    player.setCurrentTeamId(null);
                    playerRepository.save(player);
                });
            }
        }

        // ================= PLAYER ASSIGN =================
        // Players newly added or retained
        for (String pid : newSquad) {
            var player = playerRepository.findById(pid)
                    .orElseThrow(() -> new IllegalArgumentException("Invalid player ID"));

            // ❌ Prevent player being in another team
            if (player.getCurrentTeamId() != null
                    && !player.getCurrentTeamId().equals(savedTeam.getId())) {
                throw new IllegalArgumentException(
                        "Player " + player.getName() + " already belongs to another team"
                );
            }

            player.setCurrentTeamId(savedTeam.getId());
            playerRepository.save(player);
        }

        return savedTeam;
    }

    // ================= DELETE =================
    public void deleteTeam(String token, String teamId) throws Exception {

        String ownerEmail = validateToken(token);

        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new IllegalArgumentException("Team not found"));

        if (!team.getOwnerId().equals(ownerEmail)) {
            throw new IllegalArgumentException("Unauthorized");
        }

        if (team.getLogoUrl() != null) {
            cloudinaryService.deleteFile(team.getLogoUrl());
        }

        // Before deleting team
        unassignPlayersFromTeam(team.getSquadPlayerIds());
        teamRepository.delete(team);

    }

    // ================= VALIDATION =================
    private void validateTeam(Team team) {

        if (team.getSquadPlayerIds() == null
                || team.getSquadPlayerIds().size() < 15
                || team.getSquadPlayerIds().size() > 18) {
            throw new IllegalArgumentException("Squad must have 15–18 players");
        }

        if (team.getCoach() == null || team.getCoach().isBlank()) {
            throw new IllegalArgumentException("Coach is required");
        }

        if (team.getCaptainId() == null || team.getCaptainId().isBlank()) {
            throw new IllegalArgumentException("Captain is required");
        }

        if (team.getViceCaptainId() == null || team.getViceCaptainId().isBlank()) {
            throw new IllegalArgumentException("Vice Captain is required");
        }

        if (team.getCaptainId().equals(team.getViceCaptainId())) {
            throw new IllegalArgumentException("Captain & Vice Captain cannot be same");
        }

        if (!team.getSquadPlayerIds().contains(team.getCaptainId())
                || !team.getSquadPlayerIds().contains(team.getViceCaptainId())) {
            throw new IllegalArgumentException("Captain & Vice Captain must be in squad");
        }

        // Validate players exist
        for (String pid : team.getSquadPlayerIds()) {
            playerRepository.findById(pid)
                    .orElseThrow(() -> new IllegalArgumentException("Invalid player ID"));
        }
    }

    // ================= GET =================
    public Team getTeamById(String id) {
        return teamRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Team not found"));
    }

    public List<Team> getTeamsByOwnerId(@PathVariable String ownerId) {
        return teamRepository.findByOwnerId(ownerId);
    }

    public List<Team> getAllTeams() {
        return teamRepository.findAll();
    }

    // ================= TOKEN =================
    private String validateToken(String token) throws Exception {

        if (token == null || !token.startsWith("Bearer ")) {
            throw new IllegalArgumentException("Missing token");
        }

        String jwt = token.substring(7);

        if (blacklistService.isBlacklisted(jwt)) {
            throw new IllegalArgumentException("Session expired");
        }

        return jwtUtil.extractEmail(jwt);
    }

    private void assignPlayersToTeam(String teamId, List<String> playerIds) {

        for (String pid : playerIds) {
            var player = playerRepository.findById(pid)
                    .orElseThrow(() -> new IllegalArgumentException("Invalid player ID"));

            // ❌ Player already in another team
            if (player.getCurrentTeamId() != null
                    && !player.getCurrentTeamId().equals(teamId)) {
                throw new IllegalArgumentException(
                        "Player " + player.getName() + " already belongs to another team"
                );
            }

            player.setCurrentTeamId(teamId);
            playerRepository.save(player);
        }
    }

    private void unassignPlayersFromTeam(List<String> playerIds) {
        for (String pid : playerIds) {
            playerRepository.findById(pid).ifPresent(p -> {
                p.setCurrentTeamId(null);
                playerRepository.save(p);
            });
        }
    }

    public TeamDetailsResponse getTeamDetails(String teamId) {

        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found"));

        List<Player> players = playerRepository.findAllById(team.getSquadPlayerIds());

        Player captain = playerRepository.findById(team.getCaptainId()).orElse(null);
        Player viceCaptain = playerRepository.findById(team.getViceCaptainId()).orElse(null);

        return new TeamDetailsResponse(
                team.getId(),
                team.getName(),
                team.getCoach(), // ✅ PURE COACH NAME
                team.getLogoUrl(), // ✅ LOGO SEPARATE
                captain != null ? captain.getName() : null,
                viceCaptain != null ? viceCaptain.getName() : null,
                players
        );
    }

}
