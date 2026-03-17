package com.cricriser.cricriser.match.matchscheduling;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface MatchScheduleRepository
        extends MongoRepository<MatchSchedule, String> {

    List<MatchSchedule> findByLeagueId(String leagueId);

    void deleteByLeagueId(String leagueId);

    long countByLeagueId(String leagueId);

    List<MatchSchedule> findByLeagueIdAndMatchType(
            String leagueId,
            String matchType
    );

    Optional<MatchSchedule> findFirstByLeagueIdAndMatchType(
            String leagueId,
            String matchType
    );

    


}
