package com.cricriser.cricriser.match;

import java.util.List;
import lombok.Data;

@Data
public class TeamWithPlayersDTO {
    private String id;
    private String name;
    private List<PlayerDTO> squad;
}
