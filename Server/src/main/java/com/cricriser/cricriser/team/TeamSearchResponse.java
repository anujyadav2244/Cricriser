package com.cricriser.cricriser.team;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class TeamSearchResponse {
    private String id;
    private String name;
    private String logoUrl;
}
