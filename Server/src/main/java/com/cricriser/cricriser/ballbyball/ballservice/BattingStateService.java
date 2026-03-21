package com.cricriser.cricriser.ballbyball.ballservice;

import java.util.List;

import org.springframework.stereotype.Service;

import com.cricriser.cricriser.ballbyball.BallByBall;
import com.cricriser.cricriser.match.matchscoring.MatchScore;

@Service
public class BattingStateService {

    public void applyWicketState(BallByBall ball, MatchScore score) {

        if (!ball.isWicket()) {
            return;
        }

        String outId = ball.getOutBatterId();
        String newBatter = ball.getNewBatterId();

        if (outId == null) {
            throw new RuntimeException("outBatterId must be set on wicket");
        }

        String strikerAtBallStart = score.getStrikerId();
        String nonStrikerAtBallStart = score.getNonStrikerId();

        if (strikerAtBallStart == null || nonStrikerAtBallStart == null) {
            throw new RuntimeException("Striker / non-striker not set");
        }

        if (!outId.equals(strikerAtBallStart) && !outId.equals(nonStrikerAtBallStart)) {
            throw new RuntimeException("outBatterId must be current striker or non-striker");
        }

        boolean team1Batting
                = score.getBattingTeamId().equals(score.getTeam1Id());

        List<String> yetToBat = team1Batting
                ? score.getTeam1YetToBat()
                : score.getTeam2YetToBat();

        List<String> outBatters = team1Batting
                ? score.getTeam1OutBatters()
                : score.getTeam2OutBatters();

        if (outBatters.contains(outId)) {
            throw new RuntimeException("Batter already out");
        }

        outBatters.add(outId);

        // ================= AUTO SELECT NEXT BATTER IF NOT PROVIDED =================
        if (newBatter == null) {
            if (yetToBat.isEmpty()) {
                throw new RuntimeException("No batters available. All out!");
            }
            newBatter = yetToBat.get(0); // Automatically use next in line
        }

        if (!yetToBat.contains(newBatter)) {
            throw new RuntimeException("New batter must be from yet-to-bat list");
        }

        if ("RUN_OUT".equals(normalizeWicketType(ball.getWicketType()))) {
            String runOutEnd = normalizeRunOutEnd(ball.getRunOutEnd());
            if (runOutEnd == null) {
                throw new RuntimeException("runOutEnd is mandatory for Run Out");
            }

            String survivingBatter = outId.equals(strikerAtBallStart)
                    ? nonStrikerAtBallStart
                    : strikerAtBallStart;

            if ("STRIKER".equals(runOutEnd)) {
                score.setStrikerId(newBatter);
                score.setNonStrikerId(survivingBatter);
            } else {
                score.setStrikerId(survivingBatter);
                score.setNonStrikerId(newBatter);
            }
        } else if (outId.equals(strikerAtBallStart)) {
            score.setStrikerId(newBatter);
        } else {
            score.setNonStrikerId(newBatter);
        }

        yetToBat.remove(newBatter);
    }

    private String normalizeWicketType(String rawWicketType) {
        if (rawWicketType == null || rawWicketType.isBlank()) {
            return null;
        }

        String normalized = rawWicketType.trim()
                .toUpperCase()
                .replace('-', '_')
                .replace(' ', '_');

        return switch (normalized) {
            case "RUNOUT" -> "RUN_OUT";
            default -> normalized;
        };
    }

    private String normalizeRunOutEnd(String rawRunOutEnd) {
        if (rawRunOutEnd == null || rawRunOutEnd.isBlank()) {
            return null;
        }

        String normalized = rawRunOutEnd.trim()
                .toUpperCase()
                .replace('-', '_')
                .replace(' ', '_');

        return switch (normalized) {
            case "S", "STRIKER", "STRIKER_END" -> "STRIKER";
            case "NS", "NON_STRIKER", "NON_STRIKER_END", "NONSTRIKER" -> "NON_STRIKER";
            default -> null;
        };
    }

}
