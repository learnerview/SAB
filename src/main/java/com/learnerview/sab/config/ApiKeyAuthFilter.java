package com.learnerview.sab.config;

import com.learnerview.sab.entity.ApiKeyEntity;
import com.learnerview.sab.security.ApiKeyHasher;
import com.learnerview.sab.service.ApiKeyLookupService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class ApiKeyAuthFilter extends OncePerRequestFilter {

    private static final String API_KEY_HEADER = "X-API-KEY";
    private final ApiKeyLookupService apiKeyLookupService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            filterChain.doFilter(request, response);
            return;
        }

        String apiKey = request.getHeader(API_KEY_HEADER);
        if (apiKey == null || apiKey.isEmpty()) {
            apiKey = request.getParameter("apiKey");
        }

        if (apiKey != null && !apiKey.isEmpty()) {
            String keyHash = ApiKeyHasher.sha256(apiKey);
            Optional<ApiKeyEntity> entityOpt = apiKeyLookupService.findActiveByHashedKey(keyHash);
            if (entityOpt.isPresent()) {
                ApiKeyEntity entity = entityOpt.get();
                List<SimpleGrantedAuthority> authorities = entity.isAdmin() 
                        ? Collections.singletonList(new SimpleGrantedAuthority("ROLE_ADMIN"))
                        : Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"));
                
                UsernamePasswordAuthenticationToken auth = 
                        new UsernamePasswordAuthenticationToken(entity.getProducer(), null, authorities);
                
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }
        
        filterChain.doFilter(request, response);
    }
}
