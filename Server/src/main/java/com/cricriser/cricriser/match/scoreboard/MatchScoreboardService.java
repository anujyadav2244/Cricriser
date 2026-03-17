package com.cricriser.cricriser.match.scoreboard;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.cricriser.cricriser.exception.ResourceNotFoundException;
import com.cricriser.cricriser.league.League;
import com.cricriser.cricriser.league.LeagueRepository;
import com.cricriser.cricriser.match.matchscheduling.MatchSchedule;
import com.cricriser.cricriser.match.matchscheduling.MatchScheduleRepository;
import com.cricriser.cricriser.match.matchscoring.MatchScore;
import com.cricriser.cricriser.match.matchscoring.MatchScoreRepository;
import com.cricriser.cricriser.player.Player;
import com.cricriser.cricriser.player.PlayerRepository;
import com.cricriser.cricriser.player.matchplayerstats.MatchPlayerStats;
import com.cricriser.cricriser.player.matchplayerstats.MatchPlayerStatsRepository;
import com.cricriser.cricriser.team.Team;
import com.cricriser.cricriser.team.TeamRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MatchScoreboardService {

    private static final Logger logger = LoggerFactory.getLogger(MatchScoreboardService.class);

    private final MatchScoreRepository matchScoreRepository;
    private final MatchScheduleRepository matchScheduleRepository;
    private final LeagueRepository leagueRepository;
    private final TeamRepository teamRepository;
    private final PlayerRepository playerRepository;
    private final MatchPlayerStatsRepository statsRepository;

    public MatchScoreboardResponse getScoreboard(String matchId) {

        logger.info("Fetching scoreboard for matchId: {}", matchId);

        MatchSchedule match = matchScheduleRepository.findById(matchId)
                .orElse(null);

        if (match == null) {
            logger.warn("Match not found for matchId: {}", matchId);
            throw new ResourceNotFoundException("Match not found with id: " + matchId);
        }

        League league = leagueRepository
                .findById(match.getLeagueId())
                .orElse(null);

        MatchScore score = matchScoreRepository.findByMatchId(matchId);

        logger.info("Match found: {}, Score Status: {}", matchId, score != null ? score.getMatchStatus() : "NOT_STARTED");

        // ✅ DO NOT THROW FOR TEAMS
        Team team1 = teamRepository.findById(match.getTeam1Id()).orElse(null);
        Team team2 = teamRepository.findById(match.getTeam2Id()).orElse(null);

        if (team1 == null) {
            logger.warn("Team1 not found for teamId: {}", match.getTeam1Id());
        }
        if (team2 == null) {
            logger.warn("Team2 not found for teamId: {}", match.getTeam2Id());
        }

        MatchScoreboardResponse res = new MatchScoreboardResponse();

        // ================= META =================
        res.setMatchId(matchId);
        res.setLeagueName(league != null ? league.getName() : "League");
        res.setVenue(match.getVenue());
        res.setStartTime(convertToLocalDateTime(match.getScheduledDate()));
        res.setOversLimit(match.getMatchOvers());

        // ================= MATCH NOT STARTED =================
        if (score == null) {
            res.setStatus("NOT_STARTED");
            return res;
        }

        res.setStatus(score.getMatchStatus());
        res.setInnings(score.getInnings());
        res.setBattingTeamId(score.getBattingTeamId());
        res.setBowlingTeamId(score.getBowlingTeamId());
        res.setStrikerId(score.getStrikerId());
        res.setNonStrikerId(score.getNonStrikerId());
        res.setCurrentBowlerId(score.getCurrentBowlerId());
        res.setTeam1YetToBat(score.getTeam1YetToBat());
        res.setTeam2YetToBat(score.getTeam2YetToBat());
        res.setTeam1OutBatters(score.getTeam1OutBatters());
        res.setTeam2OutBatters(score.getTeam2OutBatters());

        // ================= TEAMS =================
        if (team1 != null) {
            res.setTeamA(buildTeamScore(team1, score, true));
        }

        if (team2 != null) {
            res.setTeamB(buildTeamScore(team2, score, false));
        }

        // ================= TOSS =================
        if (score.getTossWinner() != null && team1 != null && team2 != null) {
            res.setTossWinnerTeamName(
                    score.getTossWinner().equals(team1.getId())
                    ? team1.getName()
                    : team2.getName()
            );
            res.setTossDecision(score.getTossDecision());
        }

        // ================= PLAYING XI =================
        if (team1 != null && team2 != null
                && score.getTeam1PlayingXI() != null
                && score.getTeam2PlayingXI() != null) {

            res.setPlayingXI(
                    Map.of(
                            team1.getId(), buildPlayingXI(score.getTeam1PlayingXI()),
                            team2.getId(), buildPlayingXI(score.getTeam2PlayingXI())
                    )
            );
        }

        // ================= LIVE =================
        if ("Match In Progress".equalsIgnoreCase(score.getMatchStatus())) {
            res.setLive(buildLiveState(score));
        }

        // ================= RESULT =================
        if ("Completed".equalsIgnoreCase(score.getMatchStatus())) {
            res.setCompleted(true);
            res.setResultText(score.getResult());
            if (score.getMatchWinner() != null && team1 != null && team2 != null) {
                if (score.getMatchWinner().equals(team1.getId())) {
                    res.setWinnerTeamName(team1.getName());
                } else if (score.getMatchWinner().equals(team2.getId())) {
                    res.setWinnerTeamName(team2.getName());
                } else {
                    res.setWinnerTeamName(score.getMatchWinner());
                }
            } else {
                res.setWinnerTeamName(score.getMatchWinner());
            }
            res.setPlayerOfMatch(score.getPlayerOfTheMatch());
        }

        return res;
    }

    // ================= HELPER METHODS =====================
    private TeamScoreDto buildTeamScore(Team team, MatchScore score, boolean isTeam1) {

        return new TeamScoreDto(
                team.getId(),
                team.getName(),
                generateShortName(team.getName()),
                team.getLogoUrl(),
                isTeam1 ? score.getTeam1Runs() : score.getTeam2Runs(),
                isTeam1 ? score.getTeam1Wickets() : score.getTeam2Wickets(),
                isTeam1 ? score.getTeam1Overs() : score.getTeam2Overs(),
                isTeam1 ? score.getTeam1RunRate() : score.getTeam2RunRate(),
                isTeam1 ? score.getTeam1Extras() : score.getTeam2Extras()
        );
    }

    private List<PlayerBriefDto> buildPlayingXI(List<String> playerIds) {

        return playerRepository.findAllById(playerIds)
                .stream()
                .map(p -> new PlayerBriefDto(
                p.getId(),
                p.getName(),
                p.getRole(),
                0, 0, 0,
                0, 0, 0, 0
        ))
                .collect(Collectors.toList());
    }

    private LiveStateDto buildLiveState(MatchScore score) {

        PlayerBriefDto striker = buildLivePlayer(score.getMatchId(), score.getStrikerId());
        PlayerBriefDto nonStriker = buildLivePlayer(score.getMatchId(), score.getNonStrikerId());
        PlayerBriefDto bowler = buildLivePlayer(score.getMatchId(), score.getCurrentBowlerId());

        return new LiveStateDto(
                score.getBattingTeamId(),
                striker,
                nonStriker,
                bowler,
                List.of()
        );
    }

    private PlayerBriefDto buildLivePlayer(String matchId, String playerId) {

        if (playerId == null) {
            return null;
        }

        Player player = playerRepository.findById(playerId).orElse(null);

        if (player == null) {
            return null;
        }

        MatchPlayerStats stats = statsRepository
                .findByMatchIdAndPlayerId(matchId, playerId)
                .orElse(null);

        // If stats not found, return zero stats instead of crashing
        if (stats == null) {
            return new PlayerBriefDto(
                    player.getId(),
                    player.getName(),
                    player.getRole(),
                    0, 0, 0,
                    0, 0, 0, 0
            );
        }

        return new PlayerBriefDto(
                player.getId(),
                player.getName(),
                player.getRole(),
                stats.getRuns(),
                stats.getBalls(),
                stats.getStrikeRate(),
                stats.getOvers(),
                stats.getRunsConceded(),
                stats.getWickets(),
                stats.getEconomy()
        );
    }

    private LocalDateTime convertToLocalDateTime(Date date) {
        return date.toInstant()
                .atZone(ZoneId.systemDefault())
                .toLocalDateTime();
    }

    private String generateShortName(String teamName) {
        if (teamName == null || teamName.isBlank()) {
            return "";
        }
        return teamName
                .replaceAll("[^A-Za-z ]", "")
                .toUpperCase()
                .chars()
                .filter(Character::isUpperCase)
                .limit(3)
                .mapToObj(c -> String.valueOf((char) c))
                .collect(Collectors.joining());
    }
}
