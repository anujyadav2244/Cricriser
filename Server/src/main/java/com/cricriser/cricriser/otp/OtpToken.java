package com.cricriser.cricriser.otp;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;

@Data
@Document(collection = "otp_tokens")
public class OtpToken {

    @Id
    private String id;

    private String email;
    private String purpose;
    private String otp;
    private boolean used = false;

    // 🔥 AUTO DELETE AFTER EXPIRY
    @Indexed(expireAfterSeconds = 600)
    private LocalDateTime expiresAt;
}
