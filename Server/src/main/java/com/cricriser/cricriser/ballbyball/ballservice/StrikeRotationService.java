package com.cricriser.cricriser.ballbyball.ballservice;

import org.springframework.stereotype.Service;

import com.cricriser.cricriser.ballbyball.BallByBall;
import com.cricriser.cricriser.match.matchscoring.MatchScore;

@Service
public class StrikeRotationService {

    public void rotateStrike(BallByBall ball, MatchScore score) {

        int runsForRotation = 0;

        // Calculate runs that affect strike during the delivery.
        String extraType = ball.getExtraType();

        if ("WIDE".equalsIgnoreCase(extraType)) {
            runsForRotation = ball.getExtraRuns();
        } else if ("NO_BALL".equalsIgnoreCase(extraType)) {
            runsForRotation = ball.getRuns() + ball.getExtraRuns();
        } else if ("BYE".equalsIgnoreCase(extraType) || "B".equalsIgnoreCase(extraType)) {
            runsForRotation = ball.getExtraRuns();
        } else if ("LEG_BYE".equalsIgnoreCase(extraType) || "LB".equalsIgnoreCase(extraType)) {
            runsForRotation = ball.getExtraRuns();
        } else if (ball.isLegalBall()) {
            runsForRotation = ball.getRuns() + ball.getExtraRuns();
        }

        // Odd runs rotate strike during the over.
        if (runsForRotation % 2 == 1) {
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
}
