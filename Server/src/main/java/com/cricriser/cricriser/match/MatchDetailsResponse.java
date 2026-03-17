package com.cricriser.cricriser.match;

import java.util.Date;
import lombok.Data;

@Data
public class MatchDetailsResponse {

    private String matchId;
    private String leagueId;

    private String matchType;
    private Date scheduledDate;
    private String venue;
    private Integer matchOvers;

    private TeamWithPlayersDTO team1;
    private TeamWithPlayersDTO team2;
}
