package com.cricriser.cricriser.ballbyball.ballservice;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.cricriser.cricriser.ballbyball.BallByBall;
import com.cricriser.cricriser.ballbyball.BallByBallRepository;

@Service
public class BallService {

    @Autowired
    private BallByBallRepository ballRepo;

    public void validate(BallByBall ball) {

        if (ball == null) {
            throw new RuntimeException("Ball data is missing");
        }

        if (ball.getMatchId() == null || ball.getMatchId().isBlank()) {
            throw new RuntimeException("MatchId is missing");
        }

        if (ball.getInnings() <= 0) {
            throw new RuntimeException("Invalid innings");
        }

        if (ball.getBatterId() == null || ball.getBatterId().isBlank()) {
            throw new RuntimeException("Batter not set");
        }

        if (ball.getBowlerId() == null || ball.getBowlerId().isBlank()) {
            throw new RuntimeException("Bowler not set");
        }

        if (ball.getRuns() < 0 || ball.getExtraRuns() < 0 || ball.getRunningRuns() < 0) {
            throw new RuntimeException("Runs cannot be negative");
        }

        // Keep explicit runningRuns from UI (run-out can send only runningRuns).
        if (ball.getRunningRuns() == 0 && ball.getRuns() > 0) {
            ball.setRunningRuns(ball.getRuns());
        }

        // Normalize boundary AFTER runs.
        normalizeBoundary(ball);
    }

    private void normalizeBoundary(BallByBall ball) {

        if (ball.isBoundary()) {

            if (ball.getBoundaryRuns() != 4 && ball.getBoundaryRuns() != 6) {
                throw new RuntimeException("Boundary runs must be 4 or 6");
            }

            // Six cannot have overthrow.
            if (ball.getBoundaryRuns() == 6 && ball.isOverthrowBoundary()) {
                throw new RuntimeException("Overthrow cannot occur on six");
            }

        } else {
            ball.setBoundaryRuns(0);
            ball.setOverthrowBoundary(false);
        }
    }

    // ================= BALL NUMBER =================
    public void assignBallNumber(BallByBall ball) {

        BallByBall lastBall
                = ballRepo.findTopByMatchIdAndInningsOrderByBallSequenceDesc(
                        ball.getMatchId(), ball.getInnings()
                );

        if (lastBall == null) {
            ball.setOver(1);
            ball.setBall(1);
            ball.setBallSequence(1);
            return;
        }

        ball.setBallSequence(lastBall.getBallSequence() + 1);

        if (lastBall.isLegalBall()) {
            if (lastBall.getBall() == 6) {
                ball.setOver(lastBall.getOver() + 1);
                ball.setBall(1);
            } else {
                ball.setOver(lastBall.getOver());
                ball.setBall(lastBall.getBall() + 1);
            }
        } else {
            ball.setOver(lastBall.getOver());
            ball.setBall(lastBall.getBall());
        }
    }

    // ================= TOTAL RUNS (SINGLE SOURCE OF TRUTH) =================
    public int calculateTotalRuns(BallByBall ball) {

        int total = 0;
        String extraType = normalizeExtraType(ball.getExtraType());
        boolean isWide = "WIDE".equals(extraType);
        boolean isNoBall = "NO_BALL".equals(extraType);
        boolean isBye = "BYE".equals(extraType);
        boolean isLegBye = "LEG_BYE".equals(extraType);

        // NO_BALL / WIDE base run.
        if (isNoBall || isWide) {
            total += 1;
        }

        // Some clients send completed runs in runningRuns (especially with run-out).
        int completedRuns = ball.getRuns() > 0
                ? ball.getRuns()
                : ball.getRunningRuns();

        // Bat/running runs apply except wide/bye/leg-bye.
        if (!isWide && !isBye && !isLegBye) {
            total += completedRuns;
        }

        if (ball.isBoundary()) {
            total += ball.getBoundaryRuns();
        }

        total += ball.getExtraRuns();

        if (ball.isOverthrowBoundary()) {
            total += 4;
        }

        return total;
    }

    public int calculateExtrasForScoreboard(BallByBall ball) {
        int extras = ball.getExtraRuns();
        String extraType = normalizeExtraType(ball.getExtraType());
        if ("WIDE".equals(extraType) || "NO_BALL".equals(extraType)) {
            extras += 1;
        }
        return extras;
    }

    public BallByBall ballSave(BallByBall ball) {
        return ballRepo.save(ball);
    }

    // ================= WICKET NORMALIZATION =================
    public void normalizeWicketState(BallByBall ball) {

        if (!ball.isWicket()) {
            ball.setWicket(false);
            ball.setWicketType(null);
            ball.setOutBatterId(null);
            return;
        }

        ball.setWicket(true);

        String type = ball.getWicketType();
        if (type == null) {
            throw new RuntimeException("Wicket type is required");
        }

        switch (type.toUpperCase()) {

            case "BOWLED":
            case "LBW":
            case "CAUGHT":
            case "STUMPED":
                ball.setOutBatterId(ball.getBatterId());
                break;

            case "RUN_OUT":
                break;

            default:
                throw new RuntimeException("Invalid wicket type: " + type);
        }
    }

    private String normalizeExtraType(String rawExtraType) {
        if (rawExtraType == null || rawExtraType.isBlank()) {
            return null;
        }

        String normalized = rawExtraType.trim()
                .toUpperCase()
                .replace('-', '_')
                .replace(' ', '_');

        return switch (normalized) {
            case "W", "WD", "WIDE", "WIDES" -> "WIDE";
            case "NB", "NO_BALL", "NOBALL", "NO_BALLS" -> "NO_BALL";
            case "B", "BYE", "BYES" -> "BYE";
            case "LB", "LEG_BYE", "LEGBYE", "LEG_BYES" -> "LEG_BYE";
            default -> normalized;
        };
    }
}
