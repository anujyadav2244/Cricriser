package com.cricriser.cricriser.player.matchplayerstats;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/match-player-stats")
public class MatchPlayerStatsController {

    @Autowired
    private MatchPlayerStatsRepository repository;

    // =====================================================
    // 1️⃣ GET SINGLE PLAYER STATS (Virat Kohli (0/0))
    // =====================================================
    @GetMapping("/player")
    public MatchPlayerStats getPlayerStats(
            @RequestParam String matchId,
            @RequestParam String playerId
    ) {
        return repository
                .findByMatchIdAndPlayerId(matchId, playerId)
                .orElseGet(() -> emptyStats(matchId, playerId));
    }

    // =====================================================
    // 2️⃣ GET ALL PLAYER STATS FOR MATCH
    // =====================================================
    @GetMapping("/match/{matchId}")
    public List<MatchPlayerStats> getMatchPlayerStats(
            @PathVariable String matchId
    ) {
        return repository.findByMatchId(matchId);
    }

    // =====================================================
    // 3️⃣ GET CURRENT BATTERS (STRIKER + NON STRIKER)
    // =====================================================
    @GetMapping("/batting")
    public BattingStatsResponse getCurrentBatters(
            @RequestParam String matchId,
            @RequestParam String strikerId,
            @RequestParam String nonStrikerId
    ) {

        MatchPlayerStats striker =
                repository.findByMatchIdAndPlayerId(matchId, strikerId)
                        .orElseGet(() -> emptyStats(matchId, strikerId));

        MatchPlayerStats nonStriker =
                repository.findByMatchIdAndPlayerId(matchId, nonStrikerId)
                        .orElseGet(() -> emptyStats(matchId, nonStrikerId));

        return new BattingStatsResponse(striker, nonStriker);
    }

    // =====================================================
    // HELPER
    // =====================================================
    private MatchPlayerStats emptyStats(String matchId, String playerId) {
        MatchPlayerStats stats = new MatchPlayerStats();
        stats.setMatchId(matchId);
        stats.setPlayerId(playerId);
        stats.setRuns(0);
        stats.setBalls(0);
        stats.setFours(0);
        stats.setSixes(0);
        stats.setStrikeRate(0.0);
        stats.setOut(false);
        return stats;
    }
}
