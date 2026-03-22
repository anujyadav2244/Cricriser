package com.cricriser.cricriser.match.scoreboard;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/match/scoreboard")
@RequiredArgsConstructor
public class MatchScoreboardController {

    private final MatchScoreboardService scoreboardService;

    @GetMapping("/{matchId}")
    public MatchScoreboardResponse getScoreboard(@PathVariable String matchId) {
        return scoreboardService.getScoreboard(matchId);
    }
}
