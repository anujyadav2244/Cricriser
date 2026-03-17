package com.cricriser.cricriser.match.matchscheduling;

import java.util.Date;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;

@Data
@Document(collection = "match_schedule")
public class MatchSchedule {

    @Id
    private String id;

    private String leagueId;

    // 🔗 GLOBAL TEAM IDS
    private String team1Id;
    private String team2Id;

    private int matchNo;
    private String matchType;     // LEAGUE, ELIMINATOR, SEMI_FINAL, FINAL
    private Date scheduledDate;
    private String venue;

    private String status;        // Scheduled, Completed, Abandoned

    private Integer matchOvers;

    // Umpires
    private String onFieldUmpire1;
    private String onFieldUmpire2;
    private String thirdUmpire;
    private String fourthUmpire;
}
