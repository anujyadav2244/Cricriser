package com.cricriser.cricriser.match.matchscheduling;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/matches")
@CrossOrigin(origins = "${app.allowed.origins:https://cricriser.vercel.app/}", allowCredentials = "true")
public class MatchScheduleController {

    @Autowired
    private MatchScheduleService service;

    @PostMapping
    public ResponseEntity<?> create(@RequestBody MatchSchedule match) {
        return ResponseEntity.ok(service.createMatchManually(match));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(
            @PathVariable String id,
            @RequestBody MatchSchedule match) {
        return ResponseEntity.ok(service.updateMatch(id, match));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        service.deleteMatch(id);
        return ResponseEntity.ok(Map.of("message", "Match deleted"));
    }

    @GetMapping
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(service.getAllMatches());
    }

    @GetMapping("/{matchId}")
    public ResponseEntity<?> getMatchDetails(@PathVariable String matchId) {
        return ResponseEntity.ok(
                service.getMatchDetailsById(matchId)
        );
    }

    @GetMapping("/public/{tab}")
    public ResponseEntity<?> getMatchesByTab(
            @PathVariable String tab) {

        return ResponseEntity.ok(
                service.getMatchesByTab(tab)
        );
    }

    @GetMapping("/league/{leagueId}")
    public ResponseEntity<?> getByLeague(@PathVariable String leagueId) {
        return ResponseEntity.ok(service.getMatchesByLeague(leagueId));
    }

    @GetMapping("/home")
    public ResponseEntity<?> home() {
        return ResponseEntity.ok(service.getHomePageMatchesWithLeagueName());
    }
}
