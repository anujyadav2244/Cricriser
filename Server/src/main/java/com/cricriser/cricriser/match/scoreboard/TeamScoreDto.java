package com.cricriser.cricriser.match.scoreboard;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TeamScoreDto {

    private String id;
    private String name;
    private String shortName;
    private String logoUrl;

    private int runs;
    private int wickets;
    private double overs;
    private double runRate;
    private int extras;
}
