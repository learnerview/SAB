// Security configuration for SAB application
package com.learnerview.sab.config;

// Spring Security imports
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

// Security configuration class with API key authentication
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    // Custom API key authentication filter
    private final ApiKeyAuthFilter apiKeyAuthFilter;

    // Configure security filter chain with authorization rules
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // Disable CSRF for stateless API
            .csrf(csrf -> csrf.disable())
            // Configure stateless session management
            .sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            // Configure authorization rules
            .authorizeHttpRequests(auth -> auth
                // Public endpoints
                .requestMatchers("/login", "/", "/jobs", "/admin", "/dlq", "/error", "/css/**", "/js/**", "/img/**", "/favicon.ico", "/api/ping").permitAll()
                // Health and metrics endpoints
                .requestMatchers("/actuator/health", "/actuator/prometheus").permitAll()
                // Public job types endpoint
                .requestMatchers("/api/v1/jobs/types").permitAll()
                // Admin-only endpoints
                .requestMatchers("/api/v1/admin/**", "/api/admin/**").hasRole("ADMIN")
                // Authenticated API endpoints
                .requestMatchers("/api/v1/jobs/**", "/api/v1/events", "/api/jobs/**", "/api/events").authenticated()
                // All other requests require authentication
                .anyRequest().authenticated()
            )
            // Add custom API key filter before standard authentication
            .addFilterBefore(apiKeyAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
