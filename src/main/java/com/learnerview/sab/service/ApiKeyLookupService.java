package com.learnerview.sab.service;

import com.learnerview.sab.entity.ApiKeyEntity;
import com.learnerview.sab.repository.ApiKeyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ApiKeyLookupService {

    private final ApiKeyRepository apiKeyRepository;

    @Cacheable(cacheNames = "activeApiKeys", key = "#apiKeyHash")
    public Optional<ApiKeyEntity> findActiveByHashedKey(String apiKeyHash) {
        return apiKeyRepository.findByApiKeyAndActiveTrue(apiKeyHash);
    }
}