package com.cricriser.cricriser.match.matchscheduling;

import java.util.Date;

import lombok.Data;

@Data
public class HomeMatchDTO {

    private String id;
    private String leagueId;
    private String leagueName;

    private String team1Id;
    private String team2Id;

    private Date scheduledDate;
    private String venue;
    private String status;

    // 🔥 NEW FIELDS FOR CRICBUZZ STYLE
    private Integer team1Runs;
    private Integer team1Wickets;
    private Double team1Overs;

    private Integer team2Runs;
    private Integer team2Wickets;
    private Double team2Overs;

    private String matchStatus;   // LIVE / COMPLETED
    private String result;
}
