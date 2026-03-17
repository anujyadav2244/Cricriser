package com.cricriser.cricriser.league;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;

@Data
@Document(collection = "leagues")
public class League {

    @Id
    private String id;

    // 🔑 ADMIN
    private String adminEmail;

    private String name;

    // BILATERAL / TOURNAMENT
    private String leagueType;

    private int noOfTeams;
    private Integer noOfMatches;

    // Teams
    private List<String> teamIds = new ArrayList<>();

    // ✅ FIXED: LocalDate (NOT Date)
    private LocalDate startDate;
    private LocalDate endDate;

    private String tour;
    private List<String> umpires;

    // SINGLE | DOUBLE | GROUP
    private String leagueFormat;

    // SINGLE | DOUBLE (only for GROUP)
    private String groupRoundType;

    // SEMIFINAL | ELIMINATOR
    private String knockoutType;

    private Integer oversPerInnings;
    private String logoUrl;

    @Transient
    private List<Map<String, String>> teamDetails;
}
