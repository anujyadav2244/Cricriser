package com.cricriser.cricriser.player;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.cricriser.cricriser.team.TeamRepository;

@RestController
@RequestMapping("/api/players")
public class PlayerSearchController {

    @Autowired
    private PlayerRepository playerRepository;

    @Autowired
    private TeamRepository teamRepository;

    // ================= SEARCH PLAYER BY PARTIAL EMAIL =================
    @GetMapping("/search")
    public List<PlayerSearchResponse> searchByEmail(
            @RequestParam String email) {

        // start search only after 3 characters
        if (email == null || email.trim().length() < 3) {
            return List.of();
        }

        return playerRepository
                .findByAuthEmailStartingWithIgnoreCase(email.trim())
                .stream()
                .map(p -> new PlayerSearchResponse(
                        p.getId(),
                        p.getName(),
                        p.getRole(),
                        resolveTeamName(p.getCurrentTeamId()),
                        p.getPhotoUrl(),
                        "",
                        "",
                        "",
                        ""
                ))
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PlayerSearchResponse> getById(@PathVariable String id) {
        return playerRepository.findById(id)
                .map(p -> ResponseEntity.ok(new PlayerSearchResponse(
                p.getId(),
                p.getName(),
                p.getRole(),
                resolveTeamName(p.getCurrentTeamId()),
                p.getPhotoUrl(),
                p.getBattingStyle(),
                p.getBowlingType(),
                p.getBowlingHand(),
                p.getBowlingStyle()
        )))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    private String resolveTeamName(String teamId) {
        if (teamId == null || teamId.isBlank()) {
            return "-";
        }
        return teamRepository.findById(teamId)
                .map(t -> t.getName() == null || t.getName().isBlank() ? teamId : t.getName())
                .orElse(teamId);
    }
}
