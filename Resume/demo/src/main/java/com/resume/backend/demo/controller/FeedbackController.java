package com.resume.backend.demo.controller;

import com.resume.backend.demo.model.User;
import com.resume.backend.demo.service.PromptEvaluationService;
import com.resume.backend.demo.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/feedback")
@RequiredArgsConstructor
@Tag(name = "AI Feedback", description = "Self-improving AI system — collect and analyze user feedback on AI outputs")
public class FeedbackController {

    private final PromptEvaluationService service;
    private final UserService userService;

    @PostMapping("/submit")
    @Operation(summary = "Submit feedback for an AI-generated result",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<?> submit(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails ud) {

        User user = userService.findByEmail(ud.getUsername());
        String endpoint      = (String)  body.getOrDefault("endpointType", "GENERAL");
        int    rating        = ((Number) body.getOrDefault("rating", 3)).intValue();
        String feedbackText  = (String)  body.get("feedbackText");
        String snippet       = (String)  body.get("aiResponseSnippet");

        service.submitFeedback(user, endpoint, rating, feedbackText, snippet);
        return ResponseEntity.ok(Map.of("message", "Feedback recorded. Thank you!"));
    }

    @GetMapping("/report/{endpointType}")
    @Operation(summary = "Quality report for a specific AI endpoint",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<?> endpointReport(@PathVariable String endpointType) {
        return ResponseEntity.ok(service.analyzeEndpointQuality(endpointType));
    }

    @GetMapping("/report/system/health")
    @Operation(summary = "System-wide AI health report across all endpoints",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<?> systemHealth() {
        return ResponseEntity.ok(service.getSystemHealthReport());
    }
}
