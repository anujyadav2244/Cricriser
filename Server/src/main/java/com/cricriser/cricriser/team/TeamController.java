package com.cricriser.cricriser.team;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.cricriser.cricriser.player.PlayerRepository;
import com.cricriser.cricriser.security.JwtUtil;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/teams")
@CrossOrigin(origins = "${app.allowed.origins:http://localhost:5173}", allowCredentials = "true")
@RequiredArgsConstructor
public class TeamController {

    private final TeamService teamService;
    private final TeamRepository teamRepository;
    private final PlayerRepository playerRepository;
    private final JwtUtil jwtUtil;

    // ================= MY TEAMS =================
    @GetMapping("/my")
    public ResponseEntity<?> myTeams(
            @RequestHeader("Authorization") String token) throws Exception {
                String ownerId = jwtUtil.extractUserId(token.substring(7));
                System.out.println("OWNER ID: "+ownerId);

        return ResponseEntity.ok(teamService.getTeamsByOwnerId(ownerId));
    }

    // ================= CREATE TEAM =================
    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<?> createTeam(
            @RequestHeader("Authorization") String token,
            @RequestPart("team") String teamJson,
            @RequestPart(value = "logo", required = false) MultipartFile logo)
            throws Exception {

        return ResponseEntity.ok(
                teamService.createTeam(token, teamJson, logo)
        );
    }

    // ================= UPDATE TEAM =================
    @PutMapping(value = "/{id}", consumes = {"multipart/form-data"})
    public ResponseEntity<?> updateTeam(
            @RequestHeader("Authorization") String token,
            @PathVariable String id,
            @RequestPart("team") String teamJson,
            @RequestPart(value = "logo", required = false) MultipartFile logo)
            throws Exception {

        return ResponseEntity.ok(
                teamService.updateTeam(token, id, teamJson, logo)
        );
    }

    // ================= DELETE TEAM =================
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTeam(
            @RequestHeader("Authorization") String token,
            @PathVariable String id) throws Exception {

        teamService.deleteTeam(token, id);
        return ResponseEntity.ok(Map.of("message", "Team deleted"));
    }

    // 🔹 TEAM DETAILS (VIEW PAGE)
    @GetMapping("/{id}/details")
    public TeamDetailsResponse getTeamDetails(@PathVariable String id) {
        return teamService.getTeamDetails(id);
    }

    // 🔹 GET TEAM RAW (used by update form)
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable String id) {
        return ResponseEntity.ok(teamService.getTeamById(id));
    }

    // ================= GET ALL (ADMIN USE) =================
    @GetMapping
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(teamService.getAllTeams());
    }
}
