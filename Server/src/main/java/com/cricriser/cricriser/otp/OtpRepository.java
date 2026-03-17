package com.cricriser.cricriser.otp;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface OtpRepository extends MongoRepository<OtpToken, String> {

    List<OtpToken> findAllByEmailAndPurposeAndUsedFalse(String email, String purpose);

    Optional<OtpToken> findByEmailAndPurposeAndUsedFalse(
            String email,
            String purpose
    );
}
