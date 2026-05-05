package com.learnerview.sab.api.events;

import com.learnerview.sab.service.SseEmitterService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@Profile("api")
@RequiredArgsConstructor
public class SseControllerV1 {

    private final SseEmitterService sseEmitterService;

    @GetMapping(value = "/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe(@AuthenticationPrincipal String producer) {
        String clientId = UUID.randomUUID().toString();
        return sseEmitterService.subscribe(clientId, producer);
    }
}
