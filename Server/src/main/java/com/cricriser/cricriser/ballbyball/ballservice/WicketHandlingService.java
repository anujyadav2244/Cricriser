package com.cricriser.cricriser.ballbyball.ballservice;

import org.springframework.stereotype.Service;

import com.cricriser.cricriser.ballbyball.BallByBall;
import com.cricriser.cricriser.match.matchscoring.MatchScore;
import com.cricriser.cricriser.player.matchplayerstats.MatchPlayerStatsService;

@Service
public class WicketHandlingService {

    public void handleWicket(
            BallByBall ball,
            MatchScore score,
            MatchPlayerStatsService statsService
    ) {

        if (!ball.isWicket()) {
            return;
        }

        String wicketType = ball.getWicketType();
        if (wicketType == null) {
            throw new RuntimeException("wicketType is mandatory when isWicket is true");
        }

        wicketType = wicketType.toUpperCase();
        ball.setWicketType(wicketType);

        // ================= STUMPED CANNOT BE ON NO_BALL (BUT CAN BE ON WIDE) =================
        if ("STUMPED".equals(wicketType)) {
            if ("NO_BALL".equalsIgnoreCase(ball.getExtraType())) {
                throw new RuntimeException("Stumped cannot occur on no-ball");
            }
        }

        String outBatterId;

        // ================= RUN OUT =================
        if ("RUN_OUT".equals(wicketType)) {

            if (ball.getOutBatterId() == null || ball.getRunOutEnd() == null) {
                throw new RuntimeException(
                        "outBatterId and runOutEnd are mandatory for Run Out"
                );
            }

            outBatterId = ball.getOutBatterId();

        } // ================= OTHER WICKETS =================
        else {
            // striker is out
            outBatterId = score.getStrikerId();
        }

        ball.setOutBatterId(outBatterId);

        // ================= AUTO SET FIELDER FOR STUMPED =================
        if ("STUMPED".equals(wicketType)) {

            String keeperId = score.getBowlingTeamId().equals(score.getTeam1Id())
                    ? score.getTeam1PlayingXI().stream()
                            .filter(id -> id.equals(score.getCurrentBowlerId()) == false)
                            .findFirst()
                            .orElse(null)
                    : score.getTeam2PlayingXI().stream()
                            .filter(id -> id.equals(score.getCurrentBowlerId()) == false)
                            .findFirst()
                            .orElse(null);

            ball.setFielderId(keeperId);
        }

        // ================= UPDATE MATCH PLAYER STATS =================
        statsService.markBatterOut(
                score.getMatchId(),
                outBatterId,
                wicketType,
                score.getCurrentBowlerId(),
                ball.getFielderId()
        );
    }

}
