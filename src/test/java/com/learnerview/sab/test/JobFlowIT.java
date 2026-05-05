package com.learnerview.sab.test;

import com.learnerview.sab.dto.JobSubmissionRequest;
import com.learnerview.sab.entity.ApiKeyEntity;
import com.learnerview.sab.repository.ApiKeyRepository;
import com.learnerview.sab.repository.JobEntityRepository;
import com.learnerview.sab.security.ApiKeyHasher;
import org.awaitility.Awaitility;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.*;

import java.time.Duration;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class JobFlowIT extends BaseIntegrationTest {

    @Autowired TestRestTemplate rest;
    @Autowired ApiKeyRepository apiKeyRepository;
    @Autowired JobEntityRepository jobEntityRepository;

    @Test
    void submitJob_thenWorkerExecutes_toSuccess() throws Exception {
        String tenant = "tenant-a";
        String rawKey = "sd_dev_key_local";

        apiKeyRepository.save(ApiKeyEntity.builder()
                .id(UUID.randomUUID().toString())
                .apiKey(ApiKeyHasher.sha256(rawKey))
                .producer(tenant)
                .label("test")
                .active(true)
                .admin(false)
                .build());

        try (TestHttpServer server = new TestHttpServer(0)) {
            JobSubmissionRequest req = new JobSubmissionRequest();
            req.setJobType("webhook");
            req.setIdempotencyKey("idemp-" + UUID.randomUUID());
            req.setPriority("HIGH");
            req.setPayload(Map.of("hello", "world"));

            JobSubmissionRequest.ExecutionRequest exec = new JobSubmissionRequest.ExecutionRequest();
            exec.setType("HTTP");
            exec.setEndpoint("http://127.0.0.1:" + server.port() + "/ok");
            req.setExecution(exec);
            req.setMaxAttempts(1);
            req.setTimeoutSeconds(2);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-API-KEY", rawKey);

            ResponseEntity<String> response = rest.postForEntity("/api/v1/jobs", new HttpEntity<>(req, headers), String.class);
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.ACCEPTED);

            Awaitility.await().atMost(Duration.ofSeconds(10)).untilAsserted(() -> {
                long success = jobEntityRepository.countByProducerAndStatus(tenant, com.learnerview.sab.model.JobStatus.SUCCESS);
                assertThat(success).isGreaterThanOrEqualTo(1);
            });
        }
    }
}


