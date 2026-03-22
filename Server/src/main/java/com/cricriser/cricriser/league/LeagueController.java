package com.cricriser.cricriser.league;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
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

@RestController
@RequestMapping("/api/leagues")
public class LeagueController {

    @Autowired
    private LeagueService leagueService;

    // ================= CREATE =================
    @PostMapping(value = "/create", consumes = "multipart/form-data")
    public ResponseEntity<?> createLeague(
            @RequestHeader("Authorization") String token,
            @RequestPart("league") String leagueJson,
            @RequestPart(value = "logo", required = false) MultipartFile logo) {

        return ResponseEntity.ok(
                leagueService.createLeagueAndScheduleMatches(token, leagueJson, logo)
        );
    }

    // ================= UPDATE =================
    @PutMapping(value = "/update/{leagueId}", consumes = "multipart/form-data")
    public ResponseEntity<?> updateLeague(
            @RequestHeader("Authorization") String token,
            @PathVariable String leagueId,
            @RequestPart("league") String leagueJson,
            @RequestPart(value = "logo", required = false) MultipartFile logo) {

        return ResponseEntity.ok(
                leagueService.updateLeague(token, leagueId, leagueJson, logo)
        );
    }

    // ================= DELETE =================
    @DeleteMapping("/delete/{leagueId}")
    public ResponseEntity<?> deleteLeague(
            @RequestHeader("Authorization") String token,
            @PathVariable String leagueId) {

        leagueService.deleteLeague(token, leagueId);
        return ResponseEntity.ok(Map.of("message", "League deleted successfully"));
    }

    // ================= ADD TEAM =================
    @PostMapping("/{leagueId}/add-team/{teamId}")
    public ResponseEntity<?> addTeam(
            @RequestHeader("Authorization") String token,
            @PathVariable String leagueId,
            @PathVariable String teamId) {

        leagueService.addTeamToLeague(token, leagueId, teamId);
        return ResponseEntity.ok(Map.of("message", "Team added"));
    }

    // ================= REMOVE TEAM =================
    @DeleteMapping("/{leagueId}/remove-team/{teamId}")
    public ResponseEntity<?> removeTeam(
            @RequestHeader("Authorization") String token,
            @PathVariable String leagueId,
            @PathVariable String teamId) {

        leagueService.removeTeamFromLeague(token, leagueId, teamId);
        return ResponseEntity.ok(Map.of("message", "Team removed"));
    }

    // ================= GET ONE =================
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(
            @RequestHeader("Authorization") String token,
            @PathVariable String id) {

        return ResponseEntity.ok(
                leagueService.getLeagueById(token, id)
        );
    }

    // ================= GET ALL =================
    @GetMapping("/all")
    public ResponseEntity<?> getAll(
            @RequestHeader("Authorization") String token) {

        return ResponseEntity.ok(
                leagueService.getAllLeagues(token)
        );
    }
}
