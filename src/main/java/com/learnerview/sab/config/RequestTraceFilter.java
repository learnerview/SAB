package com.learnerview.sab.config;

import org.slf4j.MDC;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;

@Component
public class RequestTraceFilter extends OncePerRequestFilter {

    private static final String TRACE_ID = "traceId";
    private static final String TRACE_HEADER = "X-Trace-Id";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        String trace = MDC.get(TRACE_ID);
        if (trace == null || trace.isBlank()) {
            trace = request.getHeader(TRACE_HEADER);
        }
        if (trace == null || trace.isBlank()) {
            trace = UUID.randomUUID().toString();
        }

        boolean addedToMdc = MDC.get(TRACE_ID) == null || MDC.get(TRACE_ID).isBlank();
        if (addedToMdc) {
            MDC.put(TRACE_ID, trace);
        }
        try {
            filterChain.doFilter(request, response);
        } finally {
            String responseTrace = MDC.get(TRACE_ID);
            if (responseTrace == null || responseTrace.isBlank()) {
                responseTrace = trace;
            }
            response.setHeader(TRACE_HEADER, responseTrace);
            if (addedToMdc) {
                MDC.remove(TRACE_ID);
            }
        }
    }
}


