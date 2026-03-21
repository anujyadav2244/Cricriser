package com.cricriser.cricriser.match.matchscheduling;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.cricriser.cricriser.league.League;
import com.cricriser.cricriser.league.LeagueRepository;
import com.cricriser.cricriser.match.MatchDetailsResponse;
import com.cricriser.cricriser.match.PlayerDTO;
import com.cricriser.cricriser.match.TeamWithPlayersDTO;
import com.cricriser.cricriser.match.matchscoring.MatchScore;
import com.cricriser.cricriser.match.matchscoring.MatchScoreRepository;
import com.cricriser.cricriser.player.PlayerRepository;
import com.cricriser.cricriser.points.PointsTable;
import com.cricriser.cricriser.points.PointsTableService;
import com.cricriser.cricriser.team.Team;
import com.cricriser.cricriser.team.TeamRepository;

@Service
public class MatchScheduleService {

    @Autowired
    private MatchScheduleRepository repo;

    @Autowired
    private LeagueRepository leagueRepository;

    @Autowired
    private MatchScoreRepository matchScoreRepository;

    @Autowired
    private PointsTableService pointsTableService;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private PlayerRepository playerRepository;

    // ================= AUTH =================
    private String getLoggedInAdminEmail() {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || auth.getPrincipal() == null
                || auth.getPrincipal().equals("anonymousUser")) {
            throw new RuntimeException("Unauthorized");
        }

        return auth.getPrincipal().toString();
    }

    // ================= CREATE MATCH =================
    public MatchSchedule createMatchManually(MatchSchedule match) {

        String adminEmail = getLoggedInAdminEmail();

        League league = leagueRepository.findById(match.getLeagueId())
                .orElseThrow(() -> new RuntimeException("League not found"));

        // ✅ FIXED: adminEmail
        if (!league.getAdminEmail().equalsIgnoreCase(adminEmail)) {
            throw new RuntimeException("Not authorized for this league");
        }

        // ✅ FIXED: teamIds
        if (!league.getTeamIds().contains(match.getTeam1Id())
                || !league.getTeamIds().contains(match.getTeam2Id())) {
            throw new RuntimeException("Teams must belong to this league");
        }

        if (match.getTeam1Id().equals(match.getTeam2Id())) {
            throw new RuntimeException("Same team cannot play against itself");
        }

        // AUTO MATCH NUMBER
        long count = repo.countByLeagueId(match.getLeagueId());
        match.setMatchNo((int) count + 1);

        if (match.getMatchType() == null) {
            match.setMatchType("LEAGUE");
        }

        if (match.getStatus() == null) {
            match.setStatus("Scheduled");
        }

        if (match.getMatchOvers() == null) {
            match.setMatchOvers(league.getOversPerInnings());
        }

        MatchSchedule saved = repo.save(match);

        league.setNoOfMatches(saved.getMatchNo());
        leagueRepository.save(league);

        return saved;
    }

    // ================= UPDATE MATCH =================
    public MatchSchedule updateMatch(String matchId, MatchSchedule updated) {

        String adminEmail = getLoggedInAdminEmail();

        MatchSchedule existing = repo.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));

        League league = leagueRepository.findById(existing.getLeagueId())
                .orElseThrow(() -> new RuntimeException("League not found"));

        if (!league.getAdminEmail().equalsIgnoreCase(adminEmail)) {
            throw new RuntimeException("Unauthorized");
        }

        // IMMUTABLE FIELDS
        if (updated.getTeam1Id() != null || updated.getTeam2Id() != null) {
            throw new RuntimeException("Team change not allowed");
        }

        if (updated.getScheduledDate() != null) {
            existing.setScheduledDate(updated.getScheduledDate());
        }

        if (updated.getVenue() != null) {
            existing.setVenue(updated.getVenue());
        }

        if (updated.getStatus() != null) {
            existing.setStatus(updated.getStatus());
        }

        if (updated.getMatchOvers() != null) {
            existing.setMatchOvers(updated.getMatchOvers());
        }

        return repo.save(existing);
    }

    // ================= DELETE MATCH =================
    public void deleteMatch(String matchId) {

        String adminEmail = getLoggedInAdminEmail();

        MatchSchedule match = repo.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));

        League league = leagueRepository.findById(match.getLeagueId())
                .orElseThrow(() -> new RuntimeException("League not found"));

        // ✅ FIXED
        if (!league.getAdminEmail().equalsIgnoreCase(adminEmail)) {
            throw new RuntimeException("Unauthorized");
        }

        repo.delete(match);
    }

    // ================= GET =================
    public List<MatchSchedule> getAllMatches() {
        return repo.findAll();
    }

    public MatchDetailsResponse getMatchDetailsById(String matchId) {

        // 1️⃣ Match
        MatchSchedule match = repo.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));

        // 2️⃣ Teams
        Team team1 = teamRepository.findById(match.getTeam1Id())
                .orElseThrow(() -> new RuntimeException("Team1 not found"));

        Team team2 = teamRepository.findById(match.getTeam2Id())
                .orElseThrow(() -> new RuntimeException("Team2 not found"));

        // 3️⃣ Players
        List<PlayerDTO> team1Players = playerRepository
                .findAllById(team1.getSquadPlayerIds())
                .stream()
                .map(p -> {
                    PlayerDTO dto = new PlayerDTO();
                    dto.setId(p.getId());
                    dto.setName(p.getName());
                    dto.setRole(p.getRole());
                    return dto;
                })
                .toList();

        List<PlayerDTO> team2Players = playerRepository
                .findAllById(team2.getSquadPlayerIds())
                .stream()
                .map(p -> {
                    PlayerDTO dto = new PlayerDTO();
                    dto.setId(p.getId());
                    dto.setName(p.getName());
                    dto.setRole(p.getRole());
                    return dto;
                })
                .toList();

        // 4️⃣ Build team DTOs
        TeamWithPlayersDTO team1Dto = new TeamWithPlayersDTO();
        team1Dto.setId(team1.getId());
        team1Dto.setName(team1.getName());
        team1Dto.setCoach(team1.getCoach());
        team1Dto.setSquad(team1Players);

        TeamWithPlayersDTO team2Dto = new TeamWithPlayersDTO();
        team2Dto.setId(team2.getId());
        team2Dto.setName(team2.getName());
        team2Dto.setCoach(team2.getCoach());
        team2Dto.setSquad(team2Players);

        // 5️⃣ Final response
        MatchDetailsResponse response = new MatchDetailsResponse();
        response.setMatchId(match.getId());
        response.setLeagueId(match.getLeagueId());
        response.setMatchType(match.getMatchType());
        response.setScheduledDate(match.getScheduledDate());
        response.setVenue(match.getVenue());
        response.setMatchOvers(match.getMatchOvers());

        response.setTeam1(team1Dto);
        response.setTeam2(team2Dto);

        return response;
    }

    public List<MatchScheduleResponse> getMatchesByLeague(String leagueId) {

        autoAssignKnockoutTeamsIfLeagueStageCompleted(leagueId);

        List<MatchSchedule> matches = repo.findByLeagueId(leagueId);

        // 🔥 Fetch all teams once (performance optimized)
        Map<String, String> teamIdNameMap
                = teamRepository.findAll().stream()
                        .collect(Collectors.toMap(
                                Team::getId,
                                Team::getName
                        ));

        return matches.stream().map(m -> {
            MatchScheduleResponse res = new MatchScheduleResponse();

            res.setId(m.getId());
            res.setLeagueId(m.getLeagueId());

            res.setTeam1Id(m.getTeam1Id());
            res.setTeam2Id(m.getTeam2Id());

            // 🔥 NAME MAPPING
            res.setTeam1Name(teamIdNameMap.getOrDefault(
                    m.getTeam1Id(), "TBD"
            ));
            res.setTeam2Name(teamIdNameMap.getOrDefault(
                    m.getTeam2Id(), "TBD"
            ));

            res.setMatchNo(m.getMatchNo());
            res.setMatchType(m.getMatchType());
            res.setScheduledDate(m.getScheduledDate());
            res.setVenue(m.getVenue());
            res.setStatus(m.getStatus());

            return res;
        }).toList();
    }

    // ================= AUTO ABANDON =================
    public void autoAbandonUnplayedMatches() {

        LocalDate today = LocalDate.now(ZoneId.systemDefault());

        repo.findAll().stream()
                .filter(m -> "Scheduled".equalsIgnoreCase(m.getStatus()))
                .forEach(match -> {

                    if (match.getScheduledDate() == null) {
                        return;
                    }

                    LocalDate matchDate = match.getScheduledDate()
                            .toInstant()
                            .atZone(ZoneId.systemDefault())
                            .toLocalDate();

                    if (matchDate.isBefore(today)) {

                        match.setStatus("Abandoned");
                        repo.save(match);
                        handleAbandonedMatch(match);
                    }
                });
    }

    private void handleAbandonedMatch(MatchSchedule match) {

        MatchScore score = matchScoreRepository.findByMatchId(match.getId());
        if (score != null) {
            return;
        }

        MatchScore abandoned = new MatchScore();
        abandoned.setMatchId(match.getId());
        abandoned.setLeagueId(match.getLeagueId());
        abandoned.setTeam1Id(match.getTeam1Id());
        abandoned.setTeam2Id(match.getTeam2Id());
        abandoned.setMatchStatus("Completed");
        abandoned.setResult("Match Abandoned");

        matchScoreRepository.save(abandoned);
        pointsTableService.updatePointsTable(match.getLeagueId());
    }

    // ================= HOME PAGE =================
    public List<HomeMatchDTO> getHomePageMatchesWithLeagueName() {

        LocalDate today = LocalDate.now(ZoneId.systemDefault());

        return repo.findAll().stream()
                .filter(m -> "Scheduled".equalsIgnoreCase(m.getStatus()))
                .filter(m -> {
                    LocalDate d = m.getScheduledDate()
                            .toInstant()
                            .atZone(ZoneId.systemDefault())
                            .toLocalDate();
                    return !d.isBefore(today);
                })
                .map(m -> {
                    League league = leagueRepository
                            .findById(m.getLeagueId())
                            .orElse(null);

                    HomeMatchDTO dto = new HomeMatchDTO();
                    dto.setId(m.getId());
                    dto.setLeagueId(m.getLeagueId());
                    dto.setLeagueName(
                            league != null ? league.getName() : "League"
                    );
                    dto.setTeam1Id(m.getTeam1Id());
                    dto.setTeam2Id(m.getTeam2Id());
                    dto.setScheduledDate(m.getScheduledDate());
                    dto.setVenue(m.getVenue());
                    dto.setStatus(m.getStatus());
                    return dto;
                })
                .toList();
    }

    // ================= AUTO KNOCKOUT TEAM ASSIGNMENT =================
    public void autoAssignKnockoutTeamsIfLeagueStageCompleted(String leagueId) {

        League league = leagueRepository.findById(leagueId).orElse(null);
        if (league == null) {
            return;
        }

        if (!"TOURNAMENT".equalsIgnoreCase(league.getLeagueType())) {
            return;
        }

        List<MatchSchedule> leagueStageMatches
                = repo.findByLeagueIdAndMatchType(leagueId, "LEAGUE");

        if (leagueStageMatches.isEmpty()) {
            return;
        }

        boolean allLeagueMatchesCompleted = leagueStageMatches.stream()
                .allMatch(this::isMatchCompleted);

        if (!allLeagueMatchesCompleted) {
            return;
        }

        List<PointsTable> table = pointsTableService.updatePointsTable(leagueId);
        if (table.isEmpty()) {
            return;
        }

        String rank1 = getRankTeam(table, 1);
        String rank2 = getRankTeam(table, 2);
        String rank3 = getRankTeam(table, 3);
        String rank4 = getRankTeam(table, 4);

        List<MatchSchedule> allMatches = new ArrayList<>(repo.findByLeagueId(leagueId));
        boolean changed = false;

        for (MatchSchedule match : allMatches) {
            String type = match.getMatchType() == null
                    ? ""
                    : match.getMatchType().toUpperCase();

            switch (type) {
                case "SEMI_FINAL_1" -> {
                    changed |= setIfPresent(match::getTeam1Id, match::setTeam1Id, rank1);
                    changed |= setIfPresent(match::getTeam2Id, match::setTeam2Id, rank4);
                }
                case "SEMI_FINAL_2" -> {
                    changed |= setIfPresent(match::getTeam1Id, match::setTeam1Id, rank2);
                    changed |= setIfPresent(match::getTeam2Id, match::setTeam2Id, rank3);
                }
                case "QUALIFIER_1" -> {
                    changed |= setIfPresent(match::getTeam1Id, match::setTeam1Id, rank1);
                    changed |= setIfPresent(match::getTeam2Id, match::setTeam2Id, rank2);
                }
                case "ELIMINATOR" -> {
                    if (league.getNoOfTeams() < 6) {
                        changed |= setIfPresent(match::getTeam1Id, match::setTeam1Id, rank2);
                        changed |= setIfPresent(match::getTeam2Id, match::setTeam2Id, rank3);
                    } else {
                        changed |= setIfPresent(match::getTeam1Id, match::setTeam1Id, rank3);
                        changed |= setIfPresent(match::getTeam2Id, match::setTeam2Id, rank4);
                    }
                }
                case "FINAL" -> {
                    // Only replace rank placeholders (not winner/loser placeholders).
                    if (isRankPlaceholder(match.getTeam1Id())) {
                        changed |= setIfPresent(match::getTeam1Id, match::setTeam1Id, rank1);
                    }
                    if (isRankPlaceholder(match.getTeam2Id())) {
                        changed |= setIfPresent(match::getTeam2Id, match::setTeam2Id, rank2);
                    }
                }
                default -> {
                }
            }
        }

        if (changed) {
            repo.saveAll(allMatches);
        }
    }

    private boolean isMatchCompleted(MatchSchedule match) {
        MatchScore score = matchScoreRepository.findByMatchId(match.getId());
        if (score != null && "Completed".equalsIgnoreCase(score.getMatchStatus())) {
            return true;
        }

        return "Completed".equalsIgnoreCase(match.getStatus())
                || "Abandoned".equalsIgnoreCase(match.getStatus());
    }

    private String getRankTeam(List<PointsTable> table, int rank) {
        if (table.size() < rank) {
            return null;
        }
        return table.get(rank - 1).getTeamName();
    }

    private boolean isRankPlaceholder(String teamId) {
        return teamId != null && teamId.toUpperCase().startsWith("RANK");
    }

    private boolean setIfPresent(
            java.util.function.Supplier<String> getter,
            java.util.function.Consumer<String> setter,
            String teamId
    ) {
        if (teamId == null || teamId.isBlank()) {
            return false;
        }
        String current = getter.get();
        if (teamId.equals(current)) {
            return false;
        }
        setter.accept(teamId);
        return true;
    }

    // ================= PUBLIC HOME TABS WITH LIVE SCORE =================
    public List<HomeMatchDTO> getMatchesByTab(String tab) {

        LocalDate today = LocalDate.now(ZoneId.systemDefault());

        return repo.findAll().stream()
                .filter(match -> {

                    MatchScore score
                            = matchScoreRepository.findByMatchId(match.getId());

                    // 🔴 LIVE
                    if ("LIVE".equalsIgnoreCase(tab)) {
                        return score != null
                                && "LIVE".equalsIgnoreCase(score.getMatchStatus());
                    }

                    // 🟡 UPCOMING
                    if ("UPCOMING".equalsIgnoreCase(tab)) {
                        if (!"Scheduled".equalsIgnoreCase(match.getStatus())) {
                            return false;
                        }

                        LocalDate matchDate = match.getScheduledDate()
                                .toInstant()
                                .atZone(ZoneId.systemDefault())
                                .toLocalDate();

                        return !matchDate.isBefore(today);
                    }

                    // ⚫ COMPLETED
                    if ("COMPLETED".equalsIgnoreCase(tab)) {
                        return score != null
                                && "Completed".equalsIgnoreCase(score.getMatchStatus());
                    }

                    return false;
                })
                .map(match -> {

                    MatchScore score
                            = matchScoreRepository.findByMatchId(match.getId());

                    League league = leagueRepository
                            .findById(match.getLeagueId())
                            .orElse(null);

                    HomeMatchDTO dto = new HomeMatchDTO();
                    dto.setId(match.getId());
                    dto.setLeagueId(match.getLeagueId());
                    dto.setLeagueName(
                            league != null ? league.getName() : "League"
                    );
                    dto.setTeam1Id(match.getTeam1Id());
                    dto.setTeam2Id(match.getTeam2Id());
                    dto.setScheduledDate(match.getScheduledDate());
                    dto.setVenue(match.getVenue());
                    dto.setStatus(match.getStatus());

                    if (score != null) {
                        dto.setTeam1Runs(score.getTeam1Runs());
                        dto.setTeam1Wickets(score.getTeam1Wickets());
                        dto.setTeam1Overs(score.getTeam1Overs());

                        dto.setTeam2Runs(score.getTeam2Runs());
                        dto.setTeam2Wickets(score.getTeam2Wickets());
                        dto.setTeam2Overs(score.getTeam2Overs());

                        dto.setMatchStatus(score.getMatchStatus());
                        dto.setResult(score.getResult());
                    }

                    return dto;
                })
                .toList();
    }

}
