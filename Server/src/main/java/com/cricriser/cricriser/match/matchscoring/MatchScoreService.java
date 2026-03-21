package com.cricriser.cricriser.match.matchscoring;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cricriser.cricriser.ballbyball.BallByBallRepository;
import com.cricriser.cricriser.ballbyball.ballservice.BattingStateService;
import com.cricriser.cricriser.league.League;
import com.cricriser.cricriser.league.LeagueRepository;
import com.cricriser.cricriser.match.matchscheduling.MatchSchedule;
import com.cricriser.cricriser.match.matchscheduling.MatchScheduleRepository;
import com.cricriser.cricriser.match.matchscheduling.MatchScheduleService;
import com.cricriser.cricriser.player.matchplayerstats.MatchPlayerStats;
import com.cricriser.cricriser.player.matchplayerstats.MatchPlayerStatsRepository;
import com.cricriser.cricriser.player.matchplayerstats.MatchPlayerStatsService;
import com.cricriser.cricriser.points.PointsTableService;
import com.cricriser.cricriser.team.Team;
import com.cricriser.cricriser.team.TeamRepository;

@Service
public class MatchScoreService {

    @Autowired
    private MatchScoreRepository matchScoreRepository;

    @Autowired
    private MatchScheduleRepository matchScheduleRepository;

    @Autowired
    private MatchPlayerStatsRepository repo;

    @Autowired
    private LeagueRepository leagueRepository;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private PointsTableService pointsTableService;

    @Autowired
    private BallByBallRepository ballByBallRepository;

    @Autowired
    private BattingStateService battingStateService;

    @Autowired
    private MatchScheduleService matchScheduleService;

    @Autowired
    private MatchPlayerStatsService matchPlayerStatsService;

    @Transactional
    public MatchScore startInnings(
            String matchId,
            int innings,
            String strikerId,
            String nonStrikerId,
            String bowlerId
    ) {

        validateMatchDateForScoring(matchId);

        MatchScore score = matchScoreRepository.findByMatchId(matchId);
        if (score == null) {
            throw new RuntimeException("Match score not found");
        }

        score.setInnings(innings);
        score.setMatchStatus("Match In Progress");

        score.setStrikerId(strikerId);
        score.setNonStrikerId(nonStrikerId);
        score.setCurrentBowlerId(bowlerId);

        boolean team1Batting
                = score.getBattingTeamId().equals(score.getTeam1Id());

        List<String> yetToBat = team1Batting
                ? score.getTeam1YetToBat()
                : score.getTeam2YetToBat();

        yetToBat.remove(strikerId);
        yetToBat.remove(nonStrikerId);

        // Ensure opening batters appear on scorecard with 0(0) not out.
        matchPlayerStatsService.ensureInitialized(matchId, strikerId, score);
        matchPlayerStatsService.ensureInitialized(matchId, nonStrikerId, score);

        return matchScoreRepository.save(score);
    }

    // ===================== ADD NEW SCORE =====================
    public MatchScore addScore(MatchScore score) {

        // ================= BASIC VALIDATION =================
        validateMatchDateForScoring(score.getMatchId());

        if (score.getLeagueId() == null) {
            throw new RuntimeException("leagueId is missing");
        }

        if (score.getMatchId() == null) {
            throw new RuntimeException("matchId is missing");
        }

        if (score.getTeam1Id() == null) {
            throw new RuntimeException("team1Id is missing");
        }

        if (score.getTeam2Id() == null) {
            throw new RuntimeException("team2Id is missing");
        }

        if (score.getTossWinner() == null) {
            throw new RuntimeException("Toss winner is missing");
        }

        if (score.getTossDecision() == null) {
            throw new RuntimeException("Toss decision is missing");
        }

        // ================= FETCH DATA =================
        // ================= FETCH DATA =================
        League league = leagueRepository.findById(score.getLeagueId())
                .orElseThrow(() -> new RuntimeException("League not found"));

// ================= MATCH OVERS CONFIG =================
        Integer oversPerInnings = league.getOversPerInnings();
        if (oversPerInnings == null || oversPerInnings <= 0) {
            throw new RuntimeException("League oversPerInnings not configured");
        }
        score.setTotalOvers(oversPerInnings);

        MatchSchedule match = matchScheduleRepository.findById(score.getMatchId())
                .orElseThrow(() -> new RuntimeException("Match not found"));

        if (!match.getLeagueId().equals(score.getLeagueId())) {
            throw new RuntimeException("Match does not belong to this league");
        }

        MatchScore existing = matchScoreRepository.findByMatchId(score.getMatchId());
        if (existing != null) {
            throw new RuntimeException("Score already exists");
        }

        Team team1 = teamRepository.findById(score.getTeam1Id())
                .orElseThrow(() -> new RuntimeException("Invalid team1Id"));

        Team team2 = teamRepository.findById(score.getTeam2Id())
                .orElseThrow(() -> new RuntimeException("Invalid team2Id"));

        // ================= TEAM VALIDATION =================
        if (!match.getTeam1Id().equals(team1.getId())) {
            throw new RuntimeException("Team1 mismatch with schedule");
        }

        if (!match.getTeam2Id().equals(team2.getId())) {
            throw new RuntimeException("Team2 mismatch with schedule");
        }

        if (!league.getTeamIds().contains(score.getTeam1Id())
                || !league.getTeamIds().contains(score.getTeam2Id())) {
            throw new RuntimeException("Both teams must belong to the league");
        }

        // ================= PLAYING XI VALIDATION =================
        if (score.getTeam1PlayingXI() == null || score.getTeam1PlayingXI().size() != 11) {
            throw new RuntimeException("Team1 Playing XI must be exactly 11 players");
        }

        if (score.getTeam2PlayingXI() == null || score.getTeam2PlayingXI().size() != 11) {
            throw new RuntimeException("Team2 Playing XI must be exactly 11 players");
        }

        if (new HashSet<>(score.getTeam1PlayingXI()).size() != 11) {
            throw new RuntimeException("Duplicate player in Team1 Playing XI");
        }

        if (new HashSet<>(score.getTeam2PlayingXI()).size() != 11) {
            throw new RuntimeException("Duplicate player in Team2 Playing XI");
        }

        if (!team1.getSquadPlayerIds().containsAll(score.getTeam1PlayingXI())) {
            throw new RuntimeException("Team1 Playing XI contains players not in squad");
        }

        if (!team2.getSquadPlayerIds().containsAll(score.getTeam2PlayingXI())) {
            throw new RuntimeException("Team2 Playing XI contains players not in squad");
        }

        // ================= TOSS VALIDATION =================
        if (!score.getTossWinner().equals(team1.getId())
                && !score.getTossWinner().equals(team2.getId())) {
            throw new RuntimeException("Invalid toss winner");
        }

        // ================= OVERS VALIDATION =================
        validateOvers(score.getTeam1Overs(), league, team1.getName());
        validateOvers(score.getTeam2Overs(), league, team2.getName());

        // ================= TOSS → INNINGS LOGIC =================
        String battingTeamId;
        String bowlingTeamId;

        if ("Bat".equalsIgnoreCase(score.getTossDecision())) {
            battingTeamId = score.getTossWinner();
            bowlingTeamId = battingTeamId.equals(team1.getId())
                    ? team2.getId()
                    : team1.getId();
        } else { // Bowl
            bowlingTeamId = score.getTossWinner();
            battingTeamId = bowlingTeamId.equals(team1.getId())
                    ? team2.getId()
                    : team1.getId();
        }

        // ================= MATCH INITIALIZATION =================
        score.setMatchStatus("Match In Progress");

        score.setBattingTeamId(battingTeamId);
        score.setBowlingTeamId(bowlingTeamId);

        // ================= BATTING STATE =================
        score.setTeam1YetToBat(new ArrayList<>(score.getTeam1PlayingXI()));
        score.setTeam1OutBatters(new ArrayList<>());

        score.setTeam2YetToBat(new ArrayList<>(score.getTeam2PlayingXI()));
        score.setTeam2OutBatters(new ArrayList<>());

        // ================= STRIKER / NON-STRIKER =================
        List<String> battingXI = battingTeamId.equals(team1.getId())
                ? score.getTeam1PlayingXI()
                : score.getTeam2PlayingXI();

        score.setStrikerId(battingXI.get(0));
        score.setNonStrikerId(battingXI.get(1));

        // Bowler will be selected when first over starts
        score.setCurrentBowlerId(null);

        // ================= SAVE =================
        MatchScore saved = matchScoreRepository.save(score);

        pointsTableService.updatePointsTable(score.getLeagueId());

        return saved;
    }

    public MatchScore getByMatchId(String matchId) {
        return matchScoreRepository.findByMatchId(matchId);
    }

    public MatchScore updateScore(MatchScore score) {

        MatchScore existing = matchScoreRepository.findByMatchId(score.getMatchId());
        if (existing == null) {
            throw new RuntimeException("No score exists for this match");
        }

        score.setId(existing.getId());

        League league = leagueRepository.findById(score.getLeagueId())
                .orElseThrow(() -> new RuntimeException("Invalid leagueId"));

        MatchSchedule match = matchScheduleRepository.findById(score.getMatchId())
                .orElseThrow(() -> new RuntimeException("Invalid matchId"));

        Team team1 = teamRepository.findById(score.getTeam1Id())
                .orElseThrow(() -> new RuntimeException("Invalid team1Id"));

        Team team2 = teamRepository.findById(score.getTeam2Id())
                .orElseThrow(() -> new RuntimeException("Invalid team2Id"));

        if (!match.getTeam1Id().equalsIgnoreCase(team1.getName())
                || !match.getTeam2Id().equalsIgnoreCase(team2.getName())) {
            throw new RuntimeException("Scheduled team mismatch");
        }

        validateOvers(score.getTeam1Overs(), league, team1.getName());
        validateOvers(score.getTeam2Overs(), league, team2.getName());

        if ("Completed".equalsIgnoreCase(score.getMatchStatus())) {
            computeWinner(score);
        }

        MatchScore saved = matchScoreRepository.save(score);
        pointsTableService.updatePointsTable(score.getLeagueId());

        if ("Completed".equalsIgnoreCase(saved.getMatchStatus())) {
            matchScheduleService.autoAssignKnockoutTeamsIfLeagueStageCompleted(
                    saved.getLeagueId()
            );
        }

        return saved;
    }

    // ===================== OVERS VALIDATION =====================
    private void validateOvers(double overs, League league, String teamName) {

        int full = (int) overs;
        int balls = (int) Math.round((overs - full) * 10);

        if (balls < 0 || balls > 5) {
            throw new RuntimeException("Invalid overs format for " + teamName);
        }

        Integer maxOvers = league.getOversPerInnings();
        if (maxOvers == null) {
            throw new RuntimeException("Overs not configured");
        }

        if (full > maxOvers) {
            throw new RuntimeException(teamName + " exceeded overs limit");
        }
    }

    // ===================== WINNER DECIDER =====================
    public void computeWinner(MatchScore score) {

        String t1 = score.getTeam1Id();
        String t2 = score.getTeam2Id();

        String firstBat = score.getTossWinner().equals(t1)
                ? (score.getTossDecision().equalsIgnoreCase("bat") ? t1 : t2)
                : (score.getTossDecision().equalsIgnoreCase("bat") ? t2 : t1);

        String secondBat = firstBat.equals(t1) ? t2 : t1;
        String firstBatName = resolveTeamName(firstBat);
        String secondBatName = resolveTeamName(secondBat);

        int firstRuns = firstBat.equals(t1) ? score.getTeam1Runs() : score.getTeam2Runs();
        int secondRuns = secondBat.equals(t1) ? score.getTeam1Runs() : score.getTeam2Runs();
        int secondWickets = secondBat.equals(t1) ? score.getTeam1Wickets() : score.getTeam2Wickets();

        int diff = Math.abs(firstRuns - secondRuns);

        if (firstRuns > secondRuns) {
            score.setMatchWinner(firstBat);
            score.setResult(firstBatName + " won by " + diff + " runs");
        } else if (secondRuns > firstRuns) {

            int wicketsLeft = 10 - secondWickets;
            score.setMatchWinner(secondBat);
            score.setResult(secondBatName + " won by " + wicketsLeft + " wickets");
        } else {
            score.setMatchWinner("Tie");
            score.setResult("Match tied");
        }
    }

    private String resolveTeamName(String teamId) {
        return teamRepository.findById(teamId)
                .map(Team::getName)
                .orElse(teamId);
    }

    // ===================== BASIC CRUD =====================
    public MatchScore getMatchScoreByMatchId(String matchId) {
        return matchScoreRepository.findByMatchId(matchId);
    }

    public List<MatchScore> getAllScores() {
        return matchScoreRepository.findAll();
    }

    @Transactional
    public void deleteScoreByMatchId(String matchId) {

        MatchScore score = matchScoreRepository.findByMatchId(matchId);

        if (score == null) {
            throw new RuntimeException("Match score not found");
        }

        String leagueId = score.getLeagueId();

        // DELETE BALL-BY-BALL
        ballByBallRepository.deleteByMatchId(matchId);

        // DELETE MATCH PLAYER STATS
        repo.deleteByMatchId(matchId);

        // DELETE MATCH SCORE
        matchScoreRepository.deleteById(score.getId());

        // UPDATE POINTS TABLE
        pointsTableService.updatePointsTable(leagueId);
    }

    @Transactional
    public void deleteAllScores() {

        ballByBallRepository.deleteAll();
        repo.deleteAll();                 // match_player_stats
        matchScoreRepository.deleteAll();
    }

    public void createIfNotExists(String matchId, String playerId) {

        repo.findByMatchIdAndPlayerId(matchId, playerId)
                .orElseGet(() -> {
                    MatchPlayerStats stats = new MatchPlayerStats();
                    stats.setMatchId(matchId);
                    stats.setPlayerId(playerId);
                    stats.setRuns(0);
                    stats.setBalls(0);
                    stats.setWickets(0);
                    stats.setRunsConceded(0);
                    stats.setBallsBowled(0);
                    stats.setStrikeRate(0);
                    stats.setEconomy(0);
                    return repo.save(stats);
                });
    }

    private void validateMatchDateForScoring(String matchId) {

        MatchSchedule match = matchScheduleRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));

        if (match.getScheduledDate() == null) {
            throw new RuntimeException("Match date not scheduled");
        }

        LocalDate today = LocalDate.now(ZoneId.systemDefault());

        LocalDate matchDate = match.getScheduledDate()
                .toInstant()
                .atZone(ZoneId.systemDefault())
                .toLocalDate();

        if (!matchDate.equals(today)) {
            throw new RuntimeException(
                    "Scoring allowed only on match date (" + matchDate + ")"
            );
        }
    }

}
