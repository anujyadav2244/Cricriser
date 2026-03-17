package com.cricriser.cricriser.league;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.cricriser.cricriser.ballbyball.BallByBallRepository;
import com.cricriser.cricriser.cloudinary.CloudinaryService;
import com.cricriser.cricriser.match.matchscheduling.MatchSchedule;
import com.cricriser.cricriser.match.matchscheduling.MatchScheduleRepository;
import com.cricriser.cricriser.match.matchscoring.MatchScoreRepository;
import com.cricriser.cricriser.security.JwtUtil;
import com.cricriser.cricriser.team.Team;
import com.cricriser.cricriser.team.TeamRepository;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class LeagueService {

    @Autowired
    private LeagueRepository leagueRepository;
    @Autowired
    private TeamRepository teamRepository;
    @Autowired
    private CloudinaryService cloudinaryService;
    @Autowired
    private JwtUtil jwtUtil;
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private MatchScheduleRepository matchScheduleRepository;
    @Autowired
    private MatchScoreRepository matchScoreRepository;
    @Autowired
    private BallByBallRepository ballByBallRepository;

    /* ================= TOKEN ================= */
    private String extractEmail(String token) {
        if (token == null || !token.startsWith("Bearer ")) {
            throw new RuntimeException("Missing token");
        }
        return jwtUtil.extractEmail(token.substring(7));
    }

    /* ================= CREATE ================= */
    @Transactional
    public List<MatchSchedule> createLeagueAndScheduleMatches(
            String token,
            String leagueJson,
            MultipartFile logo) {

        String adminEmail = extractEmail(token);

        League league;
        try {
            league = objectMapper.readValue(leagueJson, League.class);
        } catch (Exception e) {
            throw new RuntimeException("Invalid league data");
        }

        if (league.getTeamIds() == null || league.getTeamIds().isEmpty()) {
            throw new RuntimeException("Teams are required");
        }

        if (league.getStartDate() == null || league.getEndDate() == null) {
            throw new RuntimeException("Start & End date required");
        }

        if (league.getStartDate().isBefore(LocalDate.now())) {
            throw new RuntimeException("League start date cannot be in the past");
        }

        if (leagueRepository.existsByName(league.getName())) {
            throw new RuntimeException("League already exists");
        }

        league.setAdminEmail(adminEmail);
        league.setNoOfTeams(league.getTeamIds().size());

        if (logo != null && !logo.isEmpty()) {
            try {
                league.setLogoUrl(cloudinaryService.uploadFile(logo, "leagues"));
            } catch (IOException e) {
                throw new RuntimeException("Logo upload failed");
            }
        }

        /* ================= GENERATE MATCHES FIRST ================= */
        List<MatchSchedule> matches = new ArrayList<>();

        if ("BILATERAL".equalsIgnoreCase(league.getLeagueType())) {

            if (league.getTeamIds().size() != 2) {
                throw new RuntimeException("Bilateral must have exactly 2 teams");
            }

            if (league.getNoOfMatches() == null || league.getNoOfMatches() < 1) {
                throw new RuntimeException("Number of matches required for bilateral");
            }

            matches.addAll(generateBilateralMatches(league));

        } else {
            boolean doubleRound
                    = "DOUBLE".equalsIgnoreCase(league.getLeagueFormat());

            matches.addAll(generateRoundRobin(league, doubleRound));
            matches.addAll(generateKnockouts(league));
        }

        if (matches.isEmpty()) {
            throw new RuntimeException("No matches generated for this league");
        }

        /* ================= DATE VALIDATION ================= */
        validateDateRange(league, matches.size());

        /* ================= SAVE AFTER ALL VALIDATIONS ================= */
        League savedLeague = leagueRepository.save(league);

        for (MatchSchedule m : matches) {
            m.setLeagueId(savedLeague.getId());
        }

        assignMatchDates(savedLeague, matches);
        assignMatchNumbers(matches);

        matchScheduleRepository.saveAll(matches);

        savedLeague.setNoOfMatches(matches.size());
        leagueRepository.save(savedLeague);

        return matches;
    }

    /* ================= BILATERAL ================= */
    private List<MatchSchedule> generateBilateralMatches(League league) {

        List<MatchSchedule> list = new ArrayList<>();

        String teamA = league.getTeamIds().get(0);
        String teamB = league.getTeamIds().get(1);

        int totalMatches = league.getNoOfMatches();

        // Bilateral = same pairing repeated, no alternation
        for (int i = 0; i < totalMatches; i++) {
            createMatch(list, league, teamA, teamB, "BILATERAL");
        }

        return list;
    }

    /* ================= ROUND ROBIN ================= */
    private List<MatchSchedule> generateRoundRobin(
            League league, boolean doubleRound) {

        List<String> teams = new ArrayList<>(league.getTeamIds());
        List<MatchSchedule> matches = new ArrayList<>();

        for (int i = 0; i < teams.size(); i++) {
            for (int j = i + 1; j < teams.size(); j++) {

                createMatch(matches, league,
                        teams.get(i),
                        teams.get(j),
                        "LEAGUE");

                if (doubleRound) {
                    createMatch(matches, league,
                            teams.get(j),
                            teams.get(i),
                            "LEAGUE");
                }
            }
        }
        return matches;
    }

    /* ================= KNOCKOUT ================= */
    private List<MatchSchedule> generateKnockouts(League league) {

        List<MatchSchedule> list = new ArrayList<>();
        int teams = league.getNoOfTeams();

        /* ================= < 3 TEAMS ================= */
        // Knockout does not make sense
        if (teams < 3) {
            return list;
        }

        /* ================= 3, 4, 5 TEAMS ================= */
        // AUTO ELIMINATOR
        // Rank1 → FINAL
        // Rank2 vs Rank3 → ELIMINATOR
        // Winner → FINAL
        if (teams < 6) {

            createMatch(
                    list,
                    league,
                    "Rank2",
                    "Rank3",
                    "ELIMINATOR"
            );

            createMatch(
                    list,
                    league,
                    "Rank1",
                    "WinnerEliminator",
                    "FINAL"
            );

            return list;
        }

        /* ================= 6+ TEAMS ================= */
        if ("SEMIFINAL".equalsIgnoreCase(league.getKnockoutType())) {

            createMatch(list, league, "Rank1", "Rank4", "SEMI_FINAL_1");
            createMatch(list, league, "Rank2", "Rank3", "SEMI_FINAL_2");
            createMatch(list, league, "WinnerSF1", "WinnerSF2", "FINAL");

        } else if ("ELIMINATOR".equalsIgnoreCase(league.getKnockoutType())) {

            // IPL style
            createMatch(list, league, "Rank1", "Rank2", "QUALIFIER_1");
            createMatch(list, league, "Rank3", "Rank4", "ELIMINATOR");
            createMatch(list, league, "LoserQ1", "WinnerEliminator", "QUALIFIER_2");
            createMatch(list, league, "WinnerQ1", "WinnerQ2", "FINAL");
        }

        return list;
    }

    private void createMatch(
            List<MatchSchedule> list,
            League league,
            String t1,
            String t2,
            String type) {

        MatchSchedule m = new MatchSchedule();
        m.setLeagueId(league.getId());
        m.setTeam1Id(t1);
        m.setTeam2Id(t2);
        m.setMatchType(type);
        m.setStatus("Scheduled");
        m.setVenue(league.getTour());
        list.add(m);
    }

    /* ================= DATE ================= */
    private void validateDateRange(League league, int matchCount) {

        long days = ChronoUnit.DAYS.between(
                league.getStartDate(),
                league.getEndDate()
        ) + 1;

        if (days < matchCount) {
            throw new RuntimeException("Not enough days for matches");
        }
    }

    private void assignMatchDates(League league, List<MatchSchedule> matches) {

        LocalDateTime date = league.getStartDate()
                .atStartOfDay()
                .withHour(10);

        for (MatchSchedule m : matches) {
            m.setScheduledDate(
                    java.util.Date.from(
                            date.atZone(ZoneId.systemDefault()).toInstant()
                    )
            );
            date = date.plusDays(1);
        }
    }

    private void assignMatchNumbers(List<MatchSchedule> matches) {
        int i = 1;
        for (MatchSchedule m : matches) {
            m.setMatchNo(i++);
        }
    }

    /* ================= UPDATE ================= */
    public League updateLeague(
            String token,
            String leagueId,
            String leagueJson,
            MultipartFile logo) {

        String adminEmail = extractEmail(token);

        League league = leagueRepository.findById(leagueId)
                .orElseThrow(() -> new RuntimeException("League not found"));

        if (!league.getAdminEmail().equals(adminEmail)) {
            throw new RuntimeException("Unauthorized");
        }

        try {
            League updated = objectMapper.readValue(leagueJson, League.class);

            if (updated.getTour() != null) {
                league.setTour(updated.getTour());
            }
            if (updated.getOversPerInnings() != null) {
                league.setOversPerInnings(updated.getOversPerInnings());
            }
            if (updated.getUmpires() != null) {
                league.setUmpires(updated.getUmpires());
            }
            if (updated.getStartDate() != null) {
                league.setStartDate(updated.getStartDate());
            }
            if (updated.getEndDate() != null) {
                league.setEndDate(updated.getEndDate());
            }
            if (updated.getNoOfMatches() != null) {
                league.setNoOfMatches(updated.getNoOfMatches());
            }

        } catch (Exception e) {
            throw new RuntimeException("Invalid league data");
        }

        if (logo != null && !logo.isEmpty()) {
            try {
                if (league.getLogoUrl() != null) {
                    cloudinaryService.deleteFile(league.getLogoUrl());
                }
                league.setLogoUrl(
                        cloudinaryService.uploadFile(logo, "leagues"));
            } catch (IOException e) {
                throw new RuntimeException("Logo upload failed");
            }
        }

        return leagueRepository.save(league);
    }

    /* ================= TEAM ================= */
    public void addTeamToLeague(String token, String leagueId, String teamId) {

        String adminEmail = extractEmail(token);

        League league = leagueRepository.findById(leagueId)
                .orElseThrow(() -> new RuntimeException("League not found"));

        if (!league.getAdminEmail().equals(adminEmail)) {
            throw new RuntimeException("Unauthorized");
        }

        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found"));

        if (league.getTeamIds().contains(teamId)) {
            throw new RuntimeException("Team already added");
        }

        league.getTeamIds().add(teamId);
        league.setNoOfTeams(league.getTeamIds().size());
        team.setActiveLeagueId(leagueId);

        teamRepository.save(team);
        leagueRepository.save(league);
    }

    public void removeTeamFromLeague(String token, String leagueId, String teamId) {

        String adminEmail = extractEmail(token);

        League league = leagueRepository.findById(leagueId)
                .orElseThrow(() -> new RuntimeException("League not found"));

        if (!league.getAdminEmail().equals(adminEmail)) {
            throw new RuntimeException("Unauthorized");
        }

        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found"));

        league.getTeamIds().remove(teamId);
        league.setNoOfTeams(league.getTeamIds().size());
        team.setActiveLeagueId(null);

        teamRepository.save(team);
        leagueRepository.save(league);
    }

    /* ================= GET ================= */
    public List<League> getAllLeagues(String token) {
        String adminEmail = extractEmail(token);
        return leagueRepository.findByAdminEmail(adminEmail);
    }

    public League getLeagueById(String token, String leagueId) {

        extractEmail(token);

        League league = leagueRepository.findById(leagueId)
                .orElseThrow(() -> new RuntimeException("League not found"));

        league.setTeamDetails(
                teamRepository.findAllById(league.getTeamIds())
                        .stream()
                        .map(t -> Map.of("id", t.getId(), "name", t.getName()))
                        .toList()
        );
        return league;
    }

    /* ================= DELETE ================= */
    @Transactional
    public void deleteLeague(String token, String leagueId) {

        String adminEmail = extractEmail(token);

        League league = leagueRepository.findById(leagueId)
                .orElseThrow(() -> new RuntimeException("League not found"));

        if (!league.getAdminEmail().equals(adminEmail)) {
            throw new RuntimeException("Unauthorized");
        }

        List<MatchSchedule> matches
                = matchScheduleRepository.findByLeagueId(leagueId);

        for (MatchSchedule m : matches) {
            ballByBallRepository.deleteByMatchId(m.getId());
            matchScoreRepository.deleteByMatchId(m.getId());
        }

        matchScheduleRepository.deleteByLeagueId(leagueId);
        leagueRepository.deleteById(leagueId);
    }
}
