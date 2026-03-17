package com.cricriser.cricriser.auth;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface AuthRepository extends MongoRepository<AuthUser, String> {

    Optional<AuthUser> findByEmail(String email);

    void deleteByEmail(String email);

    void deleteByVerifiedFalseAndCreatedAtBefore(LocalDateTime time);

    Optional<AuthUser> findByEmailAndRole(String email, Role role);
}
