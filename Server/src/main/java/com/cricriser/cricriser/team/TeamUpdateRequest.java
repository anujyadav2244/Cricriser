// src/main/java/com/cricriser/cricriser/team/TeamUpdateRequest.java
package com.cricriser.cricriser.team;

import java.util.List;
import lombok.Data;

@Data
public class TeamUpdateRequest {

    private String coach;
    private String captainId;
    private String viceCaptainId;
    private List<String> squadPlayerIds;
}
