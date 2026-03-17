package com.cricriser.cricriser.match.scoreboard;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlayerBriefDto {

    private String id;
    private String name;
    private String role; // BAT, BOWL, AR, WK

    // Batting
    private int runs;
    private int balls;
    private double strikeRate;

    // Bowling
    private double overs;
    private int runsConceded;
    private int wickets;
    private double economy;
}
