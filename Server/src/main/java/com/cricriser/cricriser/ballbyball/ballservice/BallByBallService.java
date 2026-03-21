package com.cricriser.cricriser.ballbyball.ballservice;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cricriser.cricriser.ballbyball.BallByBall;
import com.cricriser.cricriser.ballbyball.BallByBallRepository;
import com.cricriser.cricriser.match.matchscoring.MatchScore;
import com.cricriser.cricriser.match.matchscoring.MatchScoreRepository;
import com.cricriser.cricriser.match.matchscoring.MatchScoreUpdateService;
import com.cricriser.cricriser.player.matchplayerstats.MatchPlayerStatsService;
import com.cricriser.cricriser.player.playerstats.PlayerStatsService;

@Service
public class BallByBallService {

    @Autowired
    private BallByBallRepository ballRepo;

    @Autowired
    private BallService ballService;

    @Autowired
    private WicketHandlingService wicketService;

    @Autowired
    private PlayerValidationService playerValidationService;

    @Autowired
    private StrikeRotationService strikeService;

    @Autowired
    private MatchScoreRepository matchScoreRepository;

    @Autowired
    private MatchScoreUpdateService matchScoreUpdateService;

    @Autowired
    private MatchPlayerStatsService matchPlayerStatsService;

    @Autowired
    private PlayerStatsService playerStatsService;

    @Autowired
    private BattingStateService battingStateService;

    // ================= RECORD A BALL =================
    @Transactional
    public BallByBall recordBall(BallByBall ball) {

        MatchScore score = matchScoreRepository.findByMatchId(ball.getMatchId());

        if (score == null) {
            throw new RuntimeException("Match score not found");
        }

        if ("Completed".equalsIgnoreCase(score.getMatchStatus())) {
            throw new RuntimeException("Match already completed");
        }

        // ================= VALIDATE MATCH STATE =================
        matchScoreUpdateService.validateBeforeBall(
                ball.getMatchId(),
                ball.getInnings()
        );

        // ================= FREEZE CURRENT STATE =================
        ball.setBattingTeamId(score.getBattingTeamId());
        ball.setBatterId(score.getStrikerId());
        ball.setNonStrikerId(score.getNonStrikerId());

        // ================= ENSURE CURRENT OVER BOWLER IS SET =================
        boolean requiresNewBowler = score.getCurrentBowlerId() == null;
        playerValidationService.validateAndSetNewBowler(ball, score);
        if (requiresNewBowler) {
            score.setBallsThisOver(0);
        }
        ball.setBowlerId(score.getCurrentBowlerId());

        // ================= BASIC VALIDATION =================
        ballService.validate(ball);
        playerValidationService.validateBowler(ball);
        playerValidationService.validateBatters(ball, score);

        // ================= RUN-OUT RUNS FALLBACK =================
        normalizeRunOutRuns(ball);

        // ================= NORMALIZE EXTRAS (INLINE) =================
        String extra = normalizeExtraType(ball.getExtraType());
        if (extra == null) {
            ball.setExtraType(null);
            ball.setExtraRuns(0);
        } else {
            ball.setExtraType(extra);

            switch (extra) {
                case "WIDE" -> {
                    // extraRuns is only additional runs beyond mandatory 1.
                    if (ball.getExtraRuns() < 0) {
                        ball.setExtraRuns(0);
                    }
                }
                case "NO_BALL" -> {
                    // extraRuns is only additional runs beyond mandatory 1.
                    if (ball.getExtraRuns() < 0) {
                        ball.setExtraRuns(0);
                    }
                }
                case "BYE", "LEG_BYE" -> {
                    if (ball.getExtraRuns() < 0) {
                        ball.setExtraRuns(0);
                    }
                    // Frontend may send bye/leg-bye in runs instead of extraRuns.
                    if (ball.getExtraRuns() == 0) {
                        int byeRuns = Math.max(ball.getRuns(), ball.getRunningRuns());
                        if (byeRuns > 0) {
                            ball.setExtraRuns(byeRuns);
                        }
                    }
                    ball.setRuns(0);
                }
                default -> {
                    ball.setExtraType(null);
                    ball.setExtraRuns(0);
                }
            }
        }

        // ================= LEGAL BALL =================
        boolean isLegalBall
                = !"WIDE".equalsIgnoreCase(ball.getExtraType())
                && !"NO_BALL".equalsIgnoreCase(ball.getExtraType());

        ball.setLegalBall(isLegalBall);

        // ================= CHECK STUMPED VALIDITY (AFTER LEGAL BALL SET) =================
        if (ball.isWicket() && "STUMPED".equalsIgnoreCase(ball.getWicketType())) {
            if ("NO_BALL".equalsIgnoreCase(ball.getExtraType())) {
                throw new RuntimeException("Stumped cannot occur on NO_BALL");
            }
            
            // ================= STUMPED ON WIDE: ONLY 1 RUN =================
            if ("WIDE".equalsIgnoreCase(ball.getExtraType())) {
                // Force only mandatory 1 run for wide, no additional runs
                ball.setRuns(0);              // No bat runs
                ball.setExtraRuns(0);         // No additional runs (wide's 1 is automatic)
                ball.setBoundary(false);      // No boundary possible
                ball.setBoundaryRuns(0);      // Clear boundary runs
                ball.setRunningRuns(0);       // No running runs
            }
        }

        // ================= WICKET =================
        wicketService.handleWicket(ball, score, matchPlayerStatsService);

        // ================= MATCH PLAYER STATS =================
        matchPlayerStatsService.updateMatchPlayerStats(ball, score);

        // ================= CAREER PLAYER STATS =================
        playerStatsService.syncCareerForBall(ball);

        battingStateService.applyWicketState(ball, score);

        // Ensure incoming batter (after wicket) is visible on scorecard as 0(0)*.
        if (ball.isWicket()) {
            matchPlayerStatsService.ensureInitialized(
                    score.getMatchId(),
                    score.getStrikerId(),
                    score
            );
            matchPlayerStatsService.ensureInitialized(
                    score.getMatchId(),
                    score.getNonStrikerId(),
                    score
            );
        }

        // ================= OVERS & BALL COUNT =================
        if (isLegalBall) {

            boolean team1Batting
                    = score.getBattingTeamId().equals(score.getTeam1Id());

            if (team1Batting) {
                int balls = score.getTeam1Balls() + 1;
                score.setTeam1Balls(balls);
                score.setTeam1Overs(calculateOvers(balls));
            } else {
                int balls = score.getTeam2Balls() + 1;
                score.setTeam2Balls(balls);
                score.setTeam2Overs(calculateOvers(balls));
            }
        }

        // ================= ASSIGN OVER.BALL & DETERMINE IF OVER COMPLETED =================
        int balls
                = score.getBattingTeamId().equals(score.getTeam1Id())
                ? score.getTeam1Balls()
                : score.getTeam2Balls();

        int over = balls / 6;
        int ballNo = balls % 6;

        boolean isLastBallOfOver = false;
        if (ballNo == 0) {
            ballNo = 6;
            over--;
            isLastBallOfOver = true;
        }

        ball.setOver(over);
        ball.setBall(ballNo);
        ball.setOverCompleted(isLastBallOfOver);

        // ================= OVER STATE FOR NEXT DELIVERY =================
        if (ball.isLegalBall()) {
            if (ball.isOverCompleted()) {
                score.setLastOverBowlerId(score.getCurrentBowlerId());
                score.setCurrentBowlerId(null);
                score.setBallsThisOver(0);
            } else {
                score.setBallsThisOver(score.getBallsThisOver() + 1);
            }
        }

        // ================= STRIKE ROTATION (AFTER OVER COMPLETED IS SET) =================
        strikeService.rotateStrike(ball, score);

        // ================= SAVE BALL =================
        BallByBall saved = ballRepo.save(ball);

        // ================= UPDATE MATCH SCORE =================
        matchScoreUpdateService.updateMatchScore(saved, score);

        return saved;
    }

    // ================= GET BALLS =================
    public List<BallByBall> getBallsByMatch(String matchId) {
        return ballRepo.findByMatchIdOrderByOverAscBallAsc(matchId);
    }

    public List<BallByBall> getBallsByInnings(String matchId, int innings) {
        return ballRepo.findByMatchIdAndInningsOrderByOverAscBallAsc(
                matchId, innings
        );
    }

    // ================= DELETE =================
    public void deleteBallsByMatch(String matchId) {
        ballRepo.deleteByMatchId(matchId);
    }

    private double calculateOvers(int balls) {
        int overs = balls / 6;
        int remaining = balls % 6;
        return overs + (remaining / 10.0);
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

    private void normalizeRunOutRuns(BallByBall ball) {
        if (!ball.isWicket()
                || !"RUN_OUT".equals(normalizeWicketType(ball.getWicketType()))) {
            return;
        }

        int clickedRuns = Math.max(ball.getRuns(), ball.getRunningRuns());
        String extraType = normalizeExtraType(ball.getExtraType());

        // Defensive fallback: some clients post clicked run in extraRuns for plain run-out.
        if (clickedRuns == 0 && extraType == null && ball.getExtraRuns() > 0) {
            clickedRuns = ball.getExtraRuns();
            ball.setExtraRuns(0);
        }

        if (clickedRuns > 0) {
            if (ball.getRuns() == 0) {
                ball.setRuns(clickedRuns);
            }
            if (ball.getRunningRuns() == 0) {
                ball.setRunningRuns(clickedRuns);
            }
        }
    }

}
