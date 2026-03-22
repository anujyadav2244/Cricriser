package com.cricriser.cricriser.match.matchscoring;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/match/score")
@CrossOrigin(origins = "${app.allowed.origins:cricriser.vercel.app}", allowCredentials = "true")
public class MatchScoreController {

    @Autowired
    private MatchScoreService matchScoreService;

    @GetMapping("/match/{matchId}")
    public ResponseEntity<?> getScoreByMatch(@PathVariable String matchId) {
        return ResponseEntity.ok(matchScoreService.getByMatchId(matchId));
    }

    // ================= ADD MATCH SCORE =================
    @PostMapping("/add")
    public ResponseEntity<?> addScore(@RequestBody MatchScore score) {
        MatchScore saved = matchScoreService.addScore(score);
        return ResponseEntity.ok(saved);
    }

    // ================== START INNINGS ==================
    @PostMapping("/start-innings")
    public ResponseEntity<?> startInnings(
            @RequestBody StartInningsRequestDTO request
    ) {

        try {
            MatchScore score = matchScoreService.startInnings(
                    request.getMatchId(),
                    request.getInnings(),
                    request.getStrikerId(),
                    request.getNonStrikerId(),
                    request.getBowlerId()
            );

            return ResponseEntity.ok(score);

        } catch (RuntimeException ex) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(
                            java.util.Map.of(
                                    "error", ex.getMessage()
                            )
                    );
        }
    }

    // ================= UPDATE MATCH SCORE =================
    @PutMapping("/update/{matchId}")
    public ResponseEntity<?> updateScore(
            @PathVariable String matchId,
            @RequestBody MatchScore updatedScore) {

        updatedScore.setMatchId(matchId);
        MatchScore saved = matchScoreService.updateScore(updatedScore);
        return ResponseEntity.ok(saved);
    }

    // ================= GET SCORE BY MATCH ID =================
    @GetMapping("/{matchId}")
    public ResponseEntity<?> getByMatchId(@PathVariable String matchId) {
        MatchScore score = matchScoreService.getMatchScoreByMatchId(matchId);
        return ResponseEntity.ok(score);
    }

    // ================= GET ALL SCORES =================
    @GetMapping("/all")
    public ResponseEntity<List<MatchScore>> allScores() {
        return ResponseEntity.ok(matchScoreService.getAllScores());
    }

    @DeleteMapping("/delete/{matchId}")
    public ResponseEntity<?> deleteScore(@PathVariable String matchId) {
        matchScoreService.deleteScoreByMatchId(matchId);
        return ResponseEntity.ok("Match score deleted successfully.");
    }

    // ================= DELETE ALL =================
    @DeleteMapping("/delete/all")
    public ResponseEntity<?> deleteAllScores() {
        matchScoreService.deleteAllScores();
        return ResponseEntity.ok("All match scores deleted successfully.");
    }
}
