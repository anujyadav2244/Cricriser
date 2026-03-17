package com.cricriser.cricriser.match.matchscoring;

import java.time.LocalDate;
import java.time.ZoneId;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cricriser.cricriser.ballbyball.BallByBall;
import com.cricriser.cricriser.ballbyball.ballservice.BallService;
import com.cricriser.cricriser.match.matchscheduling.MatchScheduleService;
import com.cricriser.cricriser.match.matchscheduling.MatchSchedule;
import com.cricriser.cricriser.match.matchscheduling.MatchScheduleRepository;

@Service
public class MatchScoreUpdateService {

    @Autowired
    private MatchScoreRepository matchScoreRepository;

    @Autowired
    private MatchScoreService matchScoreService;

    @Autowired
    private BallService ballService;

    @Autowired
    private MatchScheduleRepository matchScheduleRepository;

    @Autowired
    private MatchScheduleService matchScheduleService;

    // ===================== PRE BALL VALIDATION =====================
    public MatchScore validateBeforeBall(String matchId, int innings) {

        validateMatchDate(matchId);

        MatchScore score = matchScoreRepository.findByMatchId(matchId);
        if (score == null) {
            throw new RuntimeException("Match score does not exist");
        }

        if (!"Match In Progress".equalsIgnoreCase(score.getMatchStatus())) {
            throw new RuntimeException("Match Completed");
        }

        if (innings != score.getInnings()) {
            throw new RuntimeException("Invalid innings in request");
        }

        if (innings == 1 && score.isFirstInningsCompleted()) {
            throw new RuntimeException("First innings already completed");
        }

        if (innings == 2) {
            if (!score.isFirstInningsCompleted()) {
                throw new RuntimeException("First innings not completed yet");
            }
            if (score.isSecondInningsCompleted()) {
                throw new RuntimeException("Second innings already completed");
            }
        }

        // ================= STRIKER =================
        if (score.getStrikerId() == null || score.getNonStrikerId() == null) {
            throw new RuntimeException("Batters not set");
        }

        if (score.getStrikerId().equals(score.getNonStrikerId())) {
            throw new RuntimeException("Striker and non-striker cannot be same");
        }

        // ================= OVERS CONFIG =================
        if (score.getTotalOvers() <= 0) {
            throw new RuntimeException("Match overs not initialized");
        }

        return score;
    }

    // ===================== UPDATE MATCH SCORE =====================
    @Transactional
    public void updateMatchScore(BallByBall ball, MatchScore score) {

        boolean team1Batting
                = score.getBattingTeamId().equals(score.getTeam1Id());

        int runs = ballService.calculateTotalRuns(ball);

        // ================= RUNS =================
        if (team1Batting) {
            score.setTeam1Runs(score.getTeam1Runs() + runs);
        } else {
            score.setTeam2Runs(score.getTeam2Runs() + runs);
        }

        // ================= EXTRAS =================
        int extras = ballService.calculateExtrasForScoreboard(ball);
        if (extras > 0) {
            if (team1Batting) {
                score.setTeam1Extras(score.getTeam1Extras() + extras);
            } else {
                score.setTeam2Extras(score.getTeam2Extras() + extras);
            }
        }

        // ================= WICKET =================
        if (ball.isWicket()) {
            if (team1Batting) {
                score.setTeam1Wickets(score.getTeam1Wickets() + 1);
            } else {
                score.setTeam2Wickets(score.getTeam2Wickets() + 1);
            }
        }

        // ❌ DO NOT UPDATE BALLS OR OVERS HERE
        // ================= INNINGS COMPLETION =================
        checkInningsCompletion(score, ball);

        MatchScore saved = matchScoreRepository.save(score);

        if ("Completed".equalsIgnoreCase(saved.getMatchStatus())) {
            matchScheduleService.autoAssignKnockoutTeamsIfLeagueStageCompleted(
                    saved.getLeagueId()
            );
        }
    }

    private void checkInningsCompletion(MatchScore score, BallByBall ball) {

        if (!ball.isLegalBall()) {
            return;
        }

        boolean team1Batting
                = score.getBattingTeamId().equals(score.getTeam1Id());

        int wickets = team1Batting
                ? score.getTeam1Wickets()
                : score.getTeam2Wickets();

        int ballsBowled = team1Batting
                ? score.getTeam1Balls()
                : score.getTeam2Balls();

        int maxBalls = score.getTotalOvers() * 6;

        // ================= FIRST INNINGS =================
        if (!score.isFirstInningsCompleted()) {

            if (wickets >= 10 || ballsBowled >= maxBalls) {

                score.setFirstInningsCompleted(true);
                score.setInnings(2);

                // swap batting & bowling teams
                String oldBatting = score.getBattingTeamId();
                score.setBattingTeamId(score.getBowlingTeamId());
                score.setBowlingTeamId(oldBatting);

                score.setStrikerId(null);
                score.setNonStrikerId(null);
                score.setCurrentBowlerId(null);
            }
            return;
        }

        // ================= SECOND INNINGS =================
        int firstInningsRuns
                = score.getBattingTeamId().equals(score.getTeam1Id())
                ? score.getTeam2Runs()
                : score.getTeam1Runs();

        int target = firstInningsRuns + 1;

        int runs = team1Batting
                ? score.getTeam1Runs()
                : score.getTeam2Runs();

        if (!score.isSecondInningsCompleted()) {

            if (runs >= target || wickets >= 10 || ballsBowled >= maxBalls) {

                score.setSecondInningsCompleted(true);
                score.setMatchStatus("Completed");

                matchScoreService.computeWinner(score);
            }
        }
    }

    // ===================== OVERS FROM BALLS =====================
    private double calculateOvers(int balls) {
        int overs = balls / 6;
        int remainingBalls = balls % 6;
        return overs + (remainingBalls / 10.0);
    }

    // ===================== MATCH DATE VALIDATION =====================
    private void validateMatchDate(String matchId) {

        MatchSchedule match = matchScheduleRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));

        LocalDate today = LocalDate.now(ZoneId.systemDefault());

        LocalDate matchDate = match.getScheduledDate()
                .toInstant()
                .atZone(ZoneId.systemDefault())
                .toLocalDate();

        if (!matchDate.equals(today)) {
            throw new RuntimeException(
                    "Ball update allowed only on match date (" + matchDate + ")"
            );
        }
    }
}
