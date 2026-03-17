package com.cricriser.cricriser.team;

import com.cricriser.cricriser.player.Player;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class TeamDetailsResponse {

    private String id;
    private String name;
    private String coach;
    private String logoUrl;
    private String captainName;
    private String viceCaptainName;
    private List<Player> players;
}
