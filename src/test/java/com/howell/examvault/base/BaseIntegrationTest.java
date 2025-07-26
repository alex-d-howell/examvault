package com.howell.examvault.base;

import java.time.Instant;

import org.junit.jupiter.api.BeforeEach;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
@Transactional
@ActiveProfiles("test")
public abstract class BaseIntegrationTest {

    public static final Instant FIXED_INSTANT = Instant.parse("2024-01-15T10:00:00Z");

    private static final PostgreSQLContainer<?> postgres;

    static {
        postgres = new PostgreSQLContainer<>(DockerImageName.parse("postgres:15-alpine"))
                .withDatabaseName("examvault_test")
                .withUsername("test_user")
                .withPassword("test_password")
                .withReuse(true)
                .withLabel("testcontainers.reuse.enable", "true")
                .waitingFor(Wait.forListeningPort())
                .withStartupTimeoutSeconds(60);

        postgres.start();

        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            try {
                if (postgres.isRunning()) {
                    System.out.println("Stopping PostgreSQL container gracefully...");
                    postgres.stop();
                    System.out.println("PostgreSQL container stopped successfully");
                }
            } catch (Exception e) {
                // Suppress errors during shutdown
                System.out.println("Container shutdown completed (with expected cleanup messages)");
            }
        }));
    }

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        if (!postgres.isRunning()) {
            throw new RuntimeException("PostgreSQL container failed to start!");
        }

        // Override database properties from application-test.yml
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
        registry.add("spring.jpa.show-sql", () -> "false");
        registry.add("spring.jpa.properties.hibernate.format_sql", () -> "false");
        registry.add("spring.jpa.properties.hibernate.dialect", () -> "org.hibernate.dialect.PostgreSQLDialect");
        registry.add("spring.jpa.properties.hibernate.jdbc.time_zone", () -> "UTC");
        registry.add("spring.jpa.properties.hibernate.connection.handling_mode", () -> "delayed_acquisition_and_release_after_transaction");
        registry.add("spring.jpa.defer-datasource-initialization", () -> "false");
        registry.add("spring.datasource.hikari.maximum-pool-size", () -> "2"); // Reduced from 3
        registry.add("spring.datasource.hikari.minimum-idle", () -> "0"); // Changed from 1
        registry.add("spring.datasource.hikari.connection-timeout", () -> "5000"); // Reduced from 30000
        registry.add("spring.datasource.hikari.validation-timeout", () -> "1000"); // Reduced from 3000
        registry.add("spring.datasource.hikari.idle-timeout", () -> "60000"); // Reduced from 300000
        registry.add("spring.datasource.hikari.max-lifetime", () -> "120000"); // Reduced from 1200000
        registry.add("spring.datasource.hikari.leak-detection-threshold", () -> "30000"); // Reduced from 60000

        registry.add("spring.datasource.hikari.initialization-fail-timeout", () -> "5000");
        registry.add("spring.datasource.hikari.keepalive-time", () -> "30000");

        // Disable Flyway in tests - TestContainers handles schema
        registry.add("spring.flyway.enabled", () -> "false");

        // Test security settings
        registry.add("spring.security.oauth2.client.registration.google.client-id", () -> "test-client-id");
        registry.add("spring.security.oauth2.client.registration.google.client-secret", () -> "test-client-secret");

        registry.add("logging.level.org.testcontainers", () -> "WARN");
        registry.add("logging.level.com.github.dockerjava", () -> "WARN");
        registry.add("logging.level.org.springframework.orm.jpa", () -> "WARN"); // Reduced from INFO
        registry.add("logging.level.org.springframework.transaction", () -> "WARN"); // Reduced from INFO
        registry.add("logging.level.org.hibernate.SQL", () -> "WARN"); // Reduced from DEBUG
        registry.add("logging.level.org.hibernate.engine.transaction.internal.TransactionImpl", () -> "WARN");
        registry.add("logging.level.com.zaxxer.hikari", () -> "WARN"); // Reduce HikariCP noise
        registry.add("logging.level.org.hibernate.tool.schema", () -> "WARN"); // Reduce schema drop noise

        System.out.println("Container configured - JDBC URL: " + postgres.getJdbcUrl());
    }

    @BeforeEach
    void setUp() {
        if (!postgres.isRunning()) {
            throw new RuntimeException("PostgreSQL container stopped unexpectedly!");
        }

        System.out.println("Test starting with container: " + postgres.getContainerId());
    }

    protected static PostgreSQLContainer<?> getPostgresContainer() {
        return postgres;
    }
}
