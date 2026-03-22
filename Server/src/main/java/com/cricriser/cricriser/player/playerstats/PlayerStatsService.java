package com.cricriser.cricriser.player.playerstats;

import java.util.Comparator;
import java.util.List;
import java.util.Objects;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.cricriser.cricriser.player.matchplayerstats.MatchPlayerStats;
import com.cricriser.cricriser.player.matchplayerstats.MatchPlayerStatsRepository;

@Service
public class PlayerStatsService {

    @Autowired
    private PlayerStatsRepository playerStatsRepository;

    @Autowired
    private MatchPlayerStatsRepository matchPlayerStatsRepository;

    // Kept for compatibility with old call sites.
    public void updatePlayerStats(BallByBall ball) {
        syncCareerForBall(ball);
    }

    public void syncCareerForBall(BallByBall ball) {
        syncCareerForPlayer(ball.getBatterId());
        syncCareerForPlayer(ball.getBowlerId());
        syncCareerForPlayer(ball.getOutBatterId());
        syncCareerForPlayer(ball.getFielderId());
    }

    public PlayerStats getCareerStats(String playerId) {
        return syncCareerForPlayer(playerId);
    }

    public PlayerStats syncCareerForPlayer(String playerId) {
        if (playerId == null || playerId.isBlank()) {
            return null;
        }

        List<MatchPlayerStats> rows = matchPlayerStatsRepository.findByPlayerId(playerId);
        PlayerStats stats = getOrCreate(playerId);

        if (rows.isEmpty()) {
            resetStats(stats);
            return playerStatsRepository.save(stats);
        }

        int matches = (int) rows.stream()
                .map(MatchPlayerStats::getMatchId)
                .filter(Objects::nonNull)
                .distinct()
                .count();

        int battingInnings = (int) rows.stream()
                .filter(r -> r.getBalls() > 0 || r.isOut())
                .count();

        int bowlingInnings = (int) rows.stream()
                .filter(r -> r.getBallsBowled() > 0)
                .count();

        int innings = Math.max(battingInnings, bowlingInnings);

        int runsScored = rows.stream().mapToInt(MatchPlayerStats::getRuns).sum();
        int ballsFaced = rows.stream().mapToInt(MatchPlayerStats::getBalls).sum();
        int fours = rows.stream().mapToInt(MatchPlayerStats::getFours).sum();
        int sixes = rows.stream().mapToInt(MatchPlayerStats::getSixes).sum();
        int highestScore = rows.stream().mapToInt(MatchPlayerStats::getRuns).max().orElse(0);
        int hundreds = (int) rows.stream().filter(r -> r.getRuns() >= 100).count();
        int fifties = (int) rows.stream().filter(r -> r.getRuns() >= 50 && r.getRuns() < 100).count();
        int dismissals = (int) rows.stream().filter(MatchPlayerStats::isOut).count();

        int runsConceded = rows.stream().mapToInt(MatchPlayerStats::getRunsConceded).sum();
        int ballsBowled = rows.stream().mapToInt(MatchPlayerStats::getBallsBowled).sum();
        int wickets = rows.stream().mapToInt(MatchPlayerStats::getWickets).sum();
        int wides = rows.stream().mapToInt(MatchPlayerStats::getWides).sum();
        int noBalls = rows.stream().mapToInt(MatchPlayerStats::getNoBalls).sum();
        int fiveWicketHauls = (int) rows.stream().filter(r -> r.getWickets() >= 5).count();

        double battingStrikeRate = ballsFaced > 0
                ? (runsScored * 100.0) / ballsFaced
                : 0;

        double battingAverage = dismissals > 0
                ? (runsScored * 1.0) / dismissals
                : runsScored;

        double economy = ballsBowled > 0
                ? (runsConceded * 6.0) / ballsBowled
                : 0;

        double bowlingAverage = wickets > 0
                ? (runsConceded * 1.0) / wickets
                : 0;

        double bowlingStrikeRate = wickets > 0
                ? (ballsBowled * 1.0) / wickets
                : 0;

        MatchPlayerStats bestBowling = rows.stream()
                .max(Comparator
                        .comparingInt(MatchPlayerStats::getWickets)
                        .thenComparingInt(r -> -r.getRunsConceded()))
                .orElse(null);

        String bestFigures = bestBowling == null
                ? "0/0"
                : bestBowling.getWickets() + "/" + bestBowling.getRunsConceded();

        stats.setMatches(matches);
        stats.setInnings(innings);

        stats.setRunsScored(runsScored);
        stats.setBallsFaced(ballsFaced);
        stats.setFours(fours);
        stats.setSixes(sixes);
        stats.setHighestScore(highestScore);
        stats.setHundreds(hundreds);
        stats.setFifties(fifties);
        stats.setBattingStrikeRate(battingStrikeRate);
        stats.setBattingAverage(battingAverage);

        stats.setRunsConceded(runsConceded);
        stats.setBallsBowled(ballsBowled);
        stats.setWickets(wickets);
        stats.setWides(wides);
        stats.setNoBalls(noBalls);
        stats.setEconomy(economy);
        stats.setBowlingAverage(bowlingAverage);
        stats.setBowlingStrikeRate(bowlingStrikeRate);
        stats.setFiveWicketHauls(fiveWicketHauls);
        stats.setBestBowlingFigures(bestFigures);
        stats.setBestMatchFigures(bestFigures);

        return playerStatsRepository.save(stats);
    }

    private void resetStats(PlayerStats stats) {
        stats.setMatches(0);
        stats.setInnings(0);
        stats.setBattingStrikeRate(0);
        stats.setBattingAverage(0);

        stats.setRunsScored(0);
        stats.setBallsFaced(0);
        stats.setFours(0);
        stats.setSixes(0);
        stats.setHundreds(0);
        stats.setFifties(0);
        stats.setHighestScore(0);

        stats.setRunsConceded(0);
        stats.setBallsBowled(0);
        stats.setWickets(0);
        stats.setBowlingStrikeRate(0);
        stats.setBowlingAverage(0);
        stats.setEconomy(0);
        stats.setFiveWicketHauls(0);
        stats.setWides(0);
        stats.setNoBalls(0);

        stats.setBestBowlingFigures("0/0");
        stats.setBestMatchFigures("0/0");
    }

    private PlayerStats getOrCreate(String playerId) {
        PlayerStats stats = playerStatsRepository.findByPlayerId(playerId);

        if (stats == null) {
            stats = new PlayerStats();
            stats.setPlayerId(playerId);
            resetStats(stats);
            playerStatsRepository.save(stats);
        }

        return stats;
    }

    public void incrementMatchIfNotExists(String playerId) {
        syncCareerForPlayer(playerId);
    }

    public void incrementInningsIfFirstBall(
            String playerId,
            boolean isBatting,
            boolean isBowling
    ) {
        syncCareerForPlayer(playerId);
    }
}
