package com.cricriser.cricriser.player;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class PlayerSearchResponse {

    private String id;
    private String name;
    private String role;
    private String teamName;
    private String photoUrl;
    private String battingStyle;
    private String bowlingType;
    private String bowlingHand;
    private String bowlingStyle;
}
