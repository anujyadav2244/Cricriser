package com.cricriser.cricriser;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class CricriserApplication {
    public static void main(String[] args) {
        // If the hosting platform provides a PORT environment variable (Render, Heroku, etc.),
        // use it to set the Spring Boot server port unless already explicitly configured.
        String portEnv = System.getenv("PORT");
        if (portEnv != null && !portEnv.isBlank() && System.getProperty("server.port") == null) {
            System.setProperty("server.port", portEnv);
        }

        SpringApplication.run(CricriserApplication.class, args);
    }
}

