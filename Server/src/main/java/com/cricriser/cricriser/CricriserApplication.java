package com.cricriser.cricriser;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class CricriserApplication {
    public static void main(String[] args) {
        SpringApplication.run(CricriserApplication.class, args);
    }
}

