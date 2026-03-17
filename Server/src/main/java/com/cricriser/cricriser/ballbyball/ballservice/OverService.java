package com.cricriser.cricriser.ballbyball.ballservice;

import org.springframework.stereotype.Service;

import com.cricriser.cricriser.ballbyball.BallByBall;
import com.cricriser.cricriser.match.matchscoring.MatchScore;

@Service
public class OverService {

    public void checkOverCompletion(BallByBall ball, MatchScore score) {

        if (!ball.isLegalBall()) {
            return;
        }

        // ✅ Increase legal balls in this over
        int legalBalls = score.getBallsThisOver() + 1;
        score.setBallsThisOver(legalBalls);

        // ✅ Over completes ONLY after 6 legal balls
        if (legalBalls == 6) {
            ball.setOverCompleted(true);

            score.setLastOverBowlerId(score.getCurrentBowlerId());
            score.setCurrentBowlerId(null);

            // reset for next over
            score.setBallsThisOver(0);
        }
    }

    public double calculateOversFromBalls(int balls) {
        int fullOvers = balls / 6;
        int remainingBalls = balls % 6;
        return fullOvers + (remainingBalls / 10.0);
    }
}
