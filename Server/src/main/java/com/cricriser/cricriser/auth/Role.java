package com.cricriser.cricriser.auth;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;

@JsonDeserialize(using = RoleDeserializer.class)
public enum Role {
    ADMIN,
    TEAM_OWNER,
    PLAYER,
    USER
}
