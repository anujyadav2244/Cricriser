package com.cricriser.cricriser.team;

import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "teams")
public class Team {

    @Id
    private String id;

    private String name;

    // 🔑 OWNER (AuthUser with TEAM_OWNER role)
    private String ownerId;
    private String activeLeagueId;

    private String coach;

    // store PLAYER IDs (not names)
    private String captainId;
    private String viceCaptainId;

    private String logoUrl;

    // global squad (can be reused across leagues)
    private List<String> squadPlayerIds;
}
