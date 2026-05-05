// Main application class for SAB job scheduling platform
package com.learnerview.sab;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableScheduling;

// Spring Boot main application with scheduling enabled
@SpringBootApplication
@EnableScheduling
@EnableCaching
public class SabApplication {

    // Application entry point
    public static void main(String[] args) {
        SpringApplication.run(SabApplication.class, args);
    }
}
