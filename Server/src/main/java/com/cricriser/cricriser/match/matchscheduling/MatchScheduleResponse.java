package com.cricriser.cricriser.match.matchscheduling;

import java.util.Date;
import lombok.Data;

@Data
public class MatchScheduleResponse {

    private String id;
    private String leagueId;

    private String team1Id;
    private String team1Name;

    private String team2Id;
    private String team2Name;

    private int matchNo;
    private String matchType;
    private Date scheduledDate;
    private String venue;
    private String status;
    

}
