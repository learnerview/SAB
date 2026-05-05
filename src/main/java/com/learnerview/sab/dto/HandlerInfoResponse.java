package com.learnerview.sab.dto;

import lombok.Builder;
import lombok.Data;

@Data @Builder
public class HandlerInfoResponse {
    private String jobType;
    private String description;
    private String handlerClass;
}


