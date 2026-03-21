package com.cricriser.cricriser.ballbyball.ballservice;

import org.springframework.stereotype.Service;

import com.cricriser.cricriser.ballbyball.BallByBall;
import com.cricriser.cricriser.match.matchscoring.MatchScore;

@Service
public class StrikeRotationService {

    public void rotateStrike(BallByBall ball, MatchScore score) {

        int runsForRotation = 0;
        int completedRuns = ball.getRuns() > 0
                ? ball.getRuns()
                : ball.getRunningRuns();
        boolean isRunOut = "RUN_OUT".equals(normalizeWicketType(ball.getWicketType()));

        // Calculate runs that affect strike during the delivery.
        String extraType = ball.getExtraType();

        if ("WIDE".equalsIgnoreCase(extraType)) {
            runsForRotation = ball.getExtraRuns();
        } else if ("NO_BALL".equalsIgnoreCase(extraType)) {
            runsForRotation = completedRuns + ball.getExtraRuns();
        } else if ("BYE".equalsIgnoreCase(extraType) || "B".equalsIgnoreCase(extraType)) {
            runsForRotation = ball.getExtraRuns();
        } else if ("LEG_BYE".equalsIgnoreCase(extraType) || "LB".equalsIgnoreCase(extraType)) {
            runsForRotation = ball.getExtraRuns();
        } else if (ball.isLegalBall()) {
            runsForRotation = completedRuns + ball.getExtraRuns();
        }

        // Odd runs rotate strike during the over.
        // For RUN_OUT, striker/non-striker placement is handled by runOutEnd.
        // Do not apply odd-run strike rotation on that ball.
        if (runsForRotation % 2 == 1 && !isRunOut) {
            swap(score);
        }

        // A completed over always rotates strike once more.
        if (ball.isOverCompleted()) {
            swap(score);
        }
    }

    private void swap(MatchScore score) {
        String temp = score.getStrikerId();
        score.setStrikerId(score.getNonStrikerId());
        score.setNonStrikerId(temp);
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
            case "HITWICKET" -> "HIT_WICKET";
            default -> normalized;
        };
    }
}
