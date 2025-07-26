package com.howell.examvault.base;

import java.time.Clock;

import static org.mockito.Mockito.mock;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;

import com.howell.examvault.base.service.UserService;

@TestConfiguration
@Profile("test")
public class TestConfig {

    @Bean
    @Primary
    public UserService testUserService() {
        return mock(UserService.class);
    }
    
    @Bean
    @Primary
    public Clock testClock() {
        return Clock.fixed(BaseIntegrationTest.FIXED_INSTANT, java.time.ZoneOffset.UTC);
    }
}