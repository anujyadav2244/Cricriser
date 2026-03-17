package com.cricriser.cricriser.ballbyball.ballservice;

import org.springframework.stereotype.Service;

@Service
public class InningsValidationService {

    public boolean isInningsOver(
            int wickets,
            int legalBalls,
            int maxOvers,
            Integer target,
            int currentRuns
    ) {

        if (wickets >= 10) {
            return true;
        }

        if (legalBalls >= maxOvers * 6) {
            return true;
        }

        if (target != null && currentRuns >= target) {
            return true;
        }

        return false;
    }

}
