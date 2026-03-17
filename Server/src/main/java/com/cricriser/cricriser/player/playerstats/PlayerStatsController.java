package com.cricriser.cricriser.player.playerstats;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/player-stats")
@CrossOrigin
public class PlayerStatsController {

    @Autowired
    private PlayerStatsService playerStatsService;

    @GetMapping("/{playerId}")
    public PlayerStats getCareerStats(@PathVariable String playerId) {
        return playerStatsService.getCareerStats(playerId);
    }
}

