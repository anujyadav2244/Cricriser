package com.cricriser.cricriser.player;

import java.util.Collection;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface PlayerRepository extends MongoRepository<Player, String> {

    Optional<Player> findByAuthEmail(String authEmail);

    // 🔥 FIXED: email → authEmail
    Collection<Player> findByAuthEmailStartingWithIgnoreCase(String authEmail);
}
