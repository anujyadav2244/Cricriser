package com.cricriser.cricriser.player.matchplayerstats;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.cricriser.cricriser.ballbyball.BallByBall;
import com.cricriser.cricriser.ballbyball.ballservice.BallService;
import com.cricriser.cricriser.ballbyball.ballservice.OverService;
import com.cricriser.cricriser.match.matchscoring.MatchScore;

@Service
public class MatchPlayerStatsService {

    @Autowired
    private MatchPlayerStatsRepository repo;

    @Autowired
    private BallService ballService;

    @Autowired
    private OverService overService;

    public void updateMatchPlayerStats(BallByBall ball, MatchScore score) {

        updateBatterStats(ball, score);
        updateBowlerStats(ball, score);
    }

    public MatchPlayerStats ensureInitialized(
            String matchId,
            String playerId,
            MatchScore score
    ) {
        if (matchId == null || playerId == null || playerId.isBlank()) {
            return null;
        }
        return getOrCreate(matchId, playerId, score);
    }

    private void updateBatterStats(BallByBall ball, MatchScore score) {

        if (ball.getBatterId() == null) {
            return;
        }

        MatchPlayerStats batter
                = getOrCreate(ball.getMatchId(), ball.getBatterId(), score);

        boolean isWide = "WIDE".equalsIgnoreCase(ball.getExtraType());
        boolean isBye = "BYE".equalsIgnoreCase(ball.getExtraType());
        boolean isLegBye = "LEG_BYE".equalsIgnoreCase(ball.getExtraType());
        int batRuns = calculateBatRuns(ball, isWide, isBye, isLegBye);

        // ✅ RUNS OFF BAT ONLY
        if (!isWide && !isBye && !isLegBye) {
            batter.setRuns(batter.getRuns() + batRuns);
        }

        // ✅ BALLS FACED (NO WIDE)
        if (!isWide) {
            batter.setBalls(batter.getBalls() + 1);
        }

        // ✅ BOUNDARIES (OFF BAT ONLY)
        if (ball.isBoundary() && !isWide && !isBye && !isLegBye) {

            if (ball.getBoundaryRuns() == 4) {
                batter.setFours(batter.getFours() + 1);
            } else if (ball.getBoundaryRuns() == 6) {
                batter.setSixes(batter.getSixes() + 1);
            }
        }

        // ✅ STRIKE RATE
        if (batter.getBalls() > 0) {
            batter.setStrikeRate(
                    (batter.getRuns() * 100.0) / batter.getBalls()
            );
        }

        repo.save(batter);
    }

    private int calculateBatRuns(
            BallByBall ball,
            boolean isWide,
            boolean isBye,
            boolean isLegBye
    ) {
        if (isWide || isBye || isLegBye) {
            return 0;
        }

        int completedRuns = Math.max(0, Math.max(ball.getRuns(), ball.getRunningRuns()));
        return completedRuns + Math.max(0, ball.getBoundaryRuns());
    }

    private void updateBowlerStats(BallByBall ball, MatchScore score) {

        if (ball.getBowlerId() == null) {
            return;
        }

        MatchPlayerStats bowler
                = getOrCreate(ball.getMatchId(), ball.getBowlerId(), score);

        boolean isBye = "BYE".equalsIgnoreCase(ball.getExtraType());
        boolean isLegBye = "LEG_BYE".equalsIgnoreCase(ball.getExtraType());
        boolean isWide = "WIDE".equalsIgnoreCase(ball.getExtraType());
        boolean isNoBall = "NO_BALL".equalsIgnoreCase(ball.getExtraType());

        // ✅ BALLS & OVERS
        if (ball.isLegalBall()) {
            bowler.setBallsBowled(bowler.getBallsBowled() + 1);
            bowler.setOvers(
                    overService.calculateOversFromBalls(
                            bowler.getBallsBowled()
                    )
            );
        }

        // ✅ RUNS CONCEDED (EXCLUDE BYE / LEG-BYE)
        if (!isBye && !isLegBye) {
            bowler.setRunsConceded(
                    bowler.getRunsConceded()
                    + ballService.calculateTotalRuns(ball)
            );
        }

        // ✅ EXTRAS
        if (isWide) {
            // Wide has mandatory 1 + additional extraRuns
            bowler.setWides(bowler.getWides() + 1 + Math.max(0, ball.getExtraRuns()));
        }

        if (isNoBall) {
            bowler.setNoBalls(bowler.getNoBalls() + 1);
        }

        // ✅ WICKETS
        if (ball.isWicket() && isBowlerWicket(ball.getWicketType())) {
            bowler.setWickets(bowler.getWickets() + 1);
        }

        // ✅ ECONOMY
        if (bowler.getBallsBowled() > 0) {
            bowler.setEconomy(
                    (bowler.getRunsConceded() * 6.0)
                    / bowler.getBallsBowled()
            );
        }

        repo.save(bowler);
    }

    private MatchPlayerStats getOrCreate(
            String matchId,
            String playerId,
            MatchScore score
    ) {

        return repo.findByMatchIdAndPlayerId(matchId, playerId)
                .map(existing -> {
                    // Backfill missing team mapping for old rows created via wicket flow
                    if (existing.getTeamId() == null && score != null) {
                        existing.setTeamId(inferTeamId(score, playerId));
                        return repo.save(existing);
                    }
                    return existing;
                })
                .orElseGet(() -> {
                    MatchPlayerStats stats = new MatchPlayerStats();

                    stats.setMatchId(matchId);
                    stats.setPlayerId(playerId);

                    // team mapping
                    stats.setTeamId(inferTeamId(score, playerId));

                    // batting
                    stats.setRuns(0);
                    stats.setBalls(0);
                    stats.setFours(0);
                    stats.setSixes(0);
                    stats.setStrikeRate(0);
                    stats.setOut(false);

                    // bowling
                    stats.setOvers(0);
                    stats.setBallsBowled(0);
                    stats.setRunsConceded(0);
                    stats.setWickets(0);
                    stats.setMaidens(0);
                    stats.setEconomy(0);
                    stats.setWides(0);
                    stats.setNoBalls(0);

                    // fielding
                    stats.setCatches(0);
                    stats.setRunOuts(0);

                    return repo.save(stats);
                });
    }

    private String inferTeamId(MatchScore score, String playerId) {
        if (score == null || playerId == null) {
            return null;
        }
        if (score.getTeam1PlayingXI() != null && score.getTeam1PlayingXI().contains(playerId)) {
            return score.getTeam1Id();
        }
        if (score.getTeam2PlayingXI() != null && score.getTeam2PlayingXI().contains(playerId)) {
            return score.getTeam2Id();
        }
        return null;
    }

    private boolean isBowlerWicket(String wicketType) {

        if (wicketType == null) {
            return false;
        }

        return switch (wicketType.toUpperCase()) {
            case "BOWLED", "CAUGHT", "LBW", "STUMPED", "HIT_WICKET" ->
                true;
            default ->
                false;
        };
    }

    public void markBatterOut(
            String matchId,
            String batterId,
            String wicketType,
            String bowlerId,
            String fielderId
    ) {

        // 🔥 SAFETY CHECK
        if (batterId == null) {
            return; // DO NOT CRASH BACKEND
        }

        MatchPlayerStats batter
                = repo.findByMatchIdAndPlayerId(matchId, batterId)
                        .orElseGet(() -> createEmpty(matchId, batterId));

        batter.setOut(true);
        batter.setDismissalType(wicketType);

        if (isBowlerWicket(wicketType)) {
            batter.setBowlerId(bowlerId);
        } else {
            batter.setBowlerId(null);
        }

        batter.setFielderId(fielderId);
        repo.save(batter);

        // ===== FIELDER STATS =====
        if (fielderId == null) {
            return;
        }

        MatchPlayerStats fielder
                = repo.findByMatchIdAndPlayerId(matchId, fielderId)
                        .orElseGet(() -> createEmpty(matchId, fielderId));

        if ("CAUGHT".equalsIgnoreCase(wicketType)) {
            fielder.setCatches(fielder.getCatches() + 1);
        }

        if ("RUN_OUT".equalsIgnoreCase(wicketType)) {
            fielder.setRunOuts(fielder.getRunOuts() + 1);
        }

        repo.save(fielder);
    }

    private MatchPlayerStats createEmpty(String matchId, String playerId) {
        MatchPlayerStats s = new MatchPlayerStats();
        s.setMatchId(matchId);
        s.setPlayerId(playerId);
        s.setRuns(0);
        s.setBalls(0);
        s.setOut(false);
        return repo.save(s);
    }




}
