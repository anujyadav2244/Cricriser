package com.cricriser.cricriser.player.matchplayerstats;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class BattingStatsResponse {

    private MatchPlayerStats striker;
    private MatchPlayerStats nonStriker;
}
