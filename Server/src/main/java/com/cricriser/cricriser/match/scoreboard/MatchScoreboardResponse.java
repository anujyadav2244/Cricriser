package com.cricriser.cricriser.match.scoreboard;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import lombok.Data;

@Data
public class MatchScoreboardResponse {

    // ---------------- MATCH META ----------------
    private String matchId;
    private String leagueName;
    private String venue;
    private LocalDateTime startTime;
    private String status; // LIVE, COMPLETED, NOT_STARTED
    private int innings;
    private int oversLimit;

    // ---------------- TEAMS ----------------
    private TeamScoreDto teamA;
    private TeamScoreDto teamB;

    // ---------------- TOSS ----------------
    private String tossWinnerTeamName;
    private String tossDecision;

    // ---------------- PLAYING XI ----------------
    private Map<String, List<PlayerBriefDto>> playingXI;

    // ---------------- LIVE ----------------
    private LiveStateDto live;
    private String battingTeamId;
    private String bowlingTeamId;
    private String strikerId;
    private String nonStrikerId;
    private String currentBowlerId;
    private List<String> team1YetToBat;
    private List<String> team2YetToBat;
    private List<String> team1OutBatters;
    private List<String> team2OutBatters;

    // ---------------- RESULT ----------------
    private boolean completed;
    private String resultText;
    private String winnerTeamName;
    private String playerOfMatch;
}
