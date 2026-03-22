package com.cricriser.cricriser.auth;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
@Document(collection = "users")
public class AuthUser {

    @Id
    private String id;

    // Optional for PLAYER (name is set later in player profile)
    private String name;

    @Email
    @NotBlank
    private String email;

    @NotBlank
    private String password;

    @NotBlank
    private Role role;   // ADMIN, TEAM_OWNER, PLAYER, USER

    private Boolean verified = false;

    private LocalDateTime createdAt = LocalDateTime.now();
}
