package com.cricriser.cricriser.auth;

import java.time.LocalDateTime;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class UnverifiedUserCleanupJob {

    private final AuthRepository authRepository;

    // Runs every 1 hour
    @Scheduled(fixedRate = 60 * 60 * 1000)
    public void deleteExpiredUnverifiedUsers() {

        LocalDateTime expiryTime = LocalDateTime.now().minusMinutes(15);

        authRepository.deleteByVerifiedFalseAndCreatedAtBefore(expiryTime);
    }
}
