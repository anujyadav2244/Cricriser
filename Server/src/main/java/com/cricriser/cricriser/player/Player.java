package com.cricriser.cricriser.player;


import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
@Document(collection = "players")
public class Player {

    @Id
    private String id;

    // 🔑 Link to AuthUser
    private String authEmail;

    // REQUIRED FIELD
    @NotBlank(message = "Name is required")
    private String name;

    private String role;     // BATSMAN / BOWLER / ALL_ROUNDER
    private String battingStyle;
    private String bowlingType;
    private String bowlingStyle;
    private String bowlingHand;    // LEFT / RIGHT
    private String photoUrl;

    private String currentTeamId;

}
