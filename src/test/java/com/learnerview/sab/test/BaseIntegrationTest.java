package com.learnerview.sab.test;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.PostgreSQLContainer;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers(disabledWithoutDocker = true)
public abstract class BaseIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine")
            .withDatabaseName("sab_test")
            .withUsername("sab")
            .withPassword("sab");

    @Container
    static final GenericContainer<?> redis = new GenericContainer<>("redis:7-alpine")
            .withExposedPorts(6379);

    @DynamicPropertySource
    static void props(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);

        registry.add("spring.flyway.enabled", () -> true);

        registry.add("REDIS_URL", () -> "redis://" + redis.getHost() + ":" + redis.getMappedPort(6379));

        registry.add("spring.profiles.active", () -> "api,worker");

        registry.add("sab.scheduler.polling-interval-ms", () -> "200");
        registry.add("sab.worker.retry-promoter-interval-ms", () -> "200");
        registry.add("sab.worker.lease-reaper-interval-ms", () -> "500");
        registry.add("sab.retry.initial-delay-seconds", () -> "1");
    }
}
