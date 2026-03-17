package com.cricriser.cricriser.cloudinary;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;

@Configuration
public class CloudinaryConfig {

    @Value("${cloudinary.cloud-name:}")
    private String cloudName;

    @Value("${cloudinary.api-key:}")
    private String apiKey;

    @Value("${cloudinary.api-secret:}")
    private String apiSecret;

    @Bean
    public Cloudinary cloudinary() {
        // Use application.properties if credentials are provided, else fall back to CLOUDINARY_URL
        if (!cloudName.isEmpty() && !apiKey.isEmpty() && !apiSecret.isEmpty()) {
            return new Cloudinary(ObjectUtils.asMap(
                    "cloud_name", cloudName,
                    "api_key", apiKey,
                    "api_secret", apiSecret));
        }
        // Fallback to CLOUDINARY_URL environment variable
        return new Cloudinary(ObjectUtils.emptyMap());
    }
}