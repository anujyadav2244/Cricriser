package com.cricriser.cricriser;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class CricriserApplication {
    public static void main(String[] args) {
        String railwayPort = System.getenv("PORT");
        if (railwayPort != null && !railwayPort.isBlank() && System.getProperty("server.port") == null) {
            System.setProperty("server.port", railwayPort);
        }
        SpringApplication.run(CricriserApplication.class, args);
    }
}

