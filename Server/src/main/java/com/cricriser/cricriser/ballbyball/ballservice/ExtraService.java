package com.cricriser.cricriser.ballbyball.ballservice;

import org.springframework.stereotype.Service;

import com.cricriser.cricriser.ballbyball.BallByBall;

@Service
public class ExtraService {

    public void applyExtras(BallByBall ball) {

        String extraType = normalizeExtraType(ball.getExtraType());
        ball.setExtraType(extraType);

        // Default
        ball.setLegalBall(true);

        if ("WIDE".equalsIgnoreCase(extraType)) {
            ball.setLegalBall(false);

            // extraRuns is only additional runs beyond mandatory 1
            if (ball.getExtraRuns() < 0) {
                ball.setExtraRuns(0);
            }

            ball.setRuns(0);
        }

        if ("NO_BALL".equalsIgnoreCase(extraType)) {
            ball.setLegalBall(false);

            // extraRuns is only additional runs beyond mandatory 1
            if (ball.getExtraRuns() < 0) {
                ball.setExtraRuns(0);
            }
            // runs off bat stay
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
            default -> null;
        };
    }

}
