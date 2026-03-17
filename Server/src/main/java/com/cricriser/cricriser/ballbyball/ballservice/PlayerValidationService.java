package com.cricriser.cricriser.ballbyball.ballservice;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.cricriser.cricriser.ballbyball.BallByBall;
import com.cricriser.cricriser.ballbyball.BallByBallRepository;
import com.cricriser.cricriser.match.matchscoring.MatchScore;

@Service
public class PlayerValidationService {

    @Autowired
    private BallByBallRepository ballRepo;

    // =====================================================
    // 1️⃣ BOWLER VALIDATION
    // =====================================================
    // =====================================================
// 1️⃣ BOWLER VALIDATION
// =====================================================
    public void validateBowler(BallByBall ball) {

        BallByBall lastBall
                = ballRepo.findTopByMatchIdAndInningsOrderByBallSequenceDesc(
                        ball.getMatchId(), ball.getInnings()
                );

        // ✅ FIRST BALL OF INNINGS
        if (lastBall == null) {
            if (ball.getBowlerId() == null) {
                throw new RuntimeException("Bowler must be set for first ball");
            }
            return;
        }

        // ✅ FIRST BALL OF FIRST OVER (IMPORTANT FIX 🔥)
        if (ball.getOver() == 1 && ball.getBall() == 1) {
            return;
        }

        if (ball.getBowlerId() == null) {
            throw new RuntimeException("Bowler not set");
        }

        // ✅ SAME OVER → SAME BOWLER RULE
        if (ball.getOver() == lastBall.getOver()
                && ball.getInnings() == lastBall.getInnings()) {

            // if (!ball.getBowlerId().equals(lastBall.getBowlerId())) {
            //     throw new RuntimeException("Same bowler must complete the over");
            // }
        }
    }

    // =====================================================
    // 2️⃣ CURRENT BATTERS VALIDATION
    // =====================================================
    public void validateBatters(BallByBall ball, MatchScore score) {

        String striker = score.getStrikerId();
        String nonStriker = score.getNonStrikerId();

        if (striker == null || nonStriker == null) {
            throw new RuntimeException("Striker / Non-striker not set");
        }

        if (striker.equals(nonStriker)) {
            throw new RuntimeException("Striker and non-striker cannot be same");
        }

        boolean team1Batting
                = score.getBattingTeamId().equals(score.getTeam1Id());

        List<String> playingXI = team1Batting
                ? score.getTeam1PlayingXI()
                : score.getTeam2PlayingXI();

        List<String> outBatters = team1Batting
                ? score.getTeam1OutBatters()
                : score.getTeam2OutBatters();

        if (!playingXI.contains(striker)) {
            throw new RuntimeException("Striker not in Playing XI");
        }

        if (!playingXI.contains(nonStriker)) {
            throw new RuntimeException("Non-striker not in Playing XI");
        }

        // ✅ NORMAL BALL
        if (!ball.isWicket()) {

            if (outBatters.contains(striker)) {
                throw new RuntimeException("Striker is already out");
            }

            if (outBatters.contains(nonStriker)) {
                throw new RuntimeException("Non-striker is already out");
            }
        }
    }

    // =====================================================
    // 3️⃣ NEW BATTER VALIDATION (ON WICKET)
    // =====================================================
    public void validateNewBatter(BallByBall ball, MatchScore score) {

        if (ball.getNewBatterId() == null) {
            return;
        }

        if (!ball.isWicket()) {
            throw new RuntimeException("New batter allowed only when wicket falls");
        }

        boolean team1Batting
                = score.getBattingTeamId().equals(score.getTeam1Id());

        List<String> yetToBat = team1Batting
                ? score.getTeam1YetToBat()
                : score.getTeam2YetToBat();

        if (!yetToBat.contains(ball.getNewBatterId())) {
            throw new RuntimeException("New batter must be from yet-to-bat list");
        }
    }

    // =====================================================
// 4️⃣ NEW BOWLER VALIDATION (NEW OVER)
// =====================================================
    public void validateAndSetNewBowler(
            BallByBall ball,
            MatchScore score
    ) {

        // Bowler already set → same over
        if (score.getCurrentBowlerId() != null) {
            return;
        }

        // Accept newBowlerId OR bowlerId (frontend friendly)
        String incomingBowlerId
                = (ball.getNewBowlerId() != null && !ball.getNewBowlerId().isBlank())
                ? ball.getNewBowlerId()
                : ball.getBowlerId();

        if (incomingBowlerId == null || incomingBowlerId.isBlank()) {
            throw new RuntimeException(
                    "New bowler must be provided at start of new over"
            );
        }

        // Prevent consecutive overs
        if (incomingBowlerId.equals(score.getLastOverBowlerId())) {
            throw new RuntimeException(
                    "Bowler cannot bowl consecutive overs"
            );
        }

        // ✅ Set new bowler
        score.setCurrentBowlerId(incomingBowlerId);

        // Optional: normalize
        ball.setBowlerId(incomingBowlerId);
    }

}
