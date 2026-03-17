package com.cricriser.cricriser.team;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface TeamRepository extends MongoRepository<Team, String> {

    boolean existsByNameIgnoreCase(String name);

    Optional<Team> findByNameIgnoreCase(String name);

    List<Team> findByOwnerId(String ownerId);

    List<Team> findByNameStartingWithIgnoreCase(String name);

    
}
