package com.cricriser.cricriser.team;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/teams")
public class TeamSearchController {

    @Autowired
    private TeamRepository teamRepository;

    @GetMapping("/search")
    public List<TeamSearchResponse> searchTeams(
            @RequestParam String name) {

        if (name == null || name.trim().length() < 3) {
            return List.of();
        }

        return teamRepository
                .findByNameStartingWithIgnoreCase(name.trim())
                .stream()
                .map(t -> new TeamSearchResponse(
                        t.getId(),
                        t.getName(),
                        t.getLogoUrl()
                ))
                .collect(Collectors.toList());
    }
}
