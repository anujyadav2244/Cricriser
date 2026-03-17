package com.cricriser.cricriser.match.matchscoring;

import lombok.Data;

@Data
public class StartInningsRequestDTO {

    // Match identifier
    private String matchId;

    // 1 = First innings, 2 = Second innings
    private int innings;

    // Opening batters
    private String strikerId;
    private String nonStrikerId;

    // Opening bowler
    private String bowlerId;
}
