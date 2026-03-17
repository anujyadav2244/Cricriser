package com.cricriser.cricriser.match.scoreboard;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LiveStateDto {

    private String battingTeamId;

    private PlayerBriefDto striker;
    private PlayerBriefDto nonStriker;
    private PlayerBriefDto bowler;

    private List<String> lastOver; // ["1","4","W","0","6"]
}
