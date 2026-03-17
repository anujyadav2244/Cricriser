package com.cricriser.cricriser.league;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface LeagueRepository extends MongoRepository<League, String> {

    Optional<League> findByName(String name);

    List<League> findByAdminEmail(String adminEmail);


    boolean existsByName(String name);
}
