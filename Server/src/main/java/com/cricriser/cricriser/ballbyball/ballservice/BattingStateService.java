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

        if (outId.equals(score.getStrikerId())) {
            score.setStrikerId(newBatter);
        } else {
            score.setNonStrikerId(newBatter);
        }

        yetToBat.remove(newBatter);
    }

}
