package com.resume.backend.demo.controller;

import com.resume.backend.demo.model.ResumeHistory;
import com.resume.backend.demo.model.User;
import com.resume.backend.demo.repository.AgentSessionRepository;
import com.resume.backend.demo.repository.ResumeHistoryRepository;
import com.resume.backend.demo.service.UserService;
import com.resume.backend.demo.service.agents.AgentOrchestrator;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/agents")
@RequiredArgsConstructor
@Tag(name = "AI Agent Panel", description = "Multi-agent AI career review system")
public class AgentController {

    private final AgentOrchestrator orchestrator;
    private final AgentSessionRepository agentSessionRepository;
    private final ResumeHistoryRepository historyRepository;
    private final UserService userService;

    @PostMapping("/run")
    @Operation(summary = "Run a single AI agent against a message + optional resume",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Map<String, Object>> runAgent(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = userService.findByEmail(userDetails.getUsername());
        String agentType  = (String) body.getOrDefault("agentType", "CAREER");
        String message    = (String) body.getOrDefault("message", "Review my resume");
        String resumeCtx  = resolveResumeContext(body, user);

        return ResponseEntity.ok(orchestrator.runAgent(agentType, message, resumeCtx, user));
    }

    @PostMapping("/panel")
    @Operation(summary = "Run all 4 agents in parallel — returns ATS, Recruiter, Technical, Career reviews",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Map<String, Object>> runPanel(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = userService.findByEmail(userDetails.getUsername());
        String message   = (String) body.getOrDefault("message", "Review my resume comprehensively");
        String resumeCtx = resolveResumeContext(body, user);

        return ResponseEntity.ok(orchestrator.runPanel(message, resumeCtx, user));
    }

    @GetMapping("/history")
    @Operation(summary = "Get all agent sessions for the logged-in user",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<List<Map<String, Object>>> getHistory(
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = userService.findByEmail(userDetails.getUsername());
        List<Map<String, Object>> result = agentSessionRepository.findByUserOrderByCreatedAtDesc(user).stream()
                .map(s -> Map.<String, Object>of(
                        "id",         s.getId(),
                        "agentType",  s.getAgentType(),
                        "message",    s.getUserMessage(),
                        "confidence", s.getConfidence() != null ? s.getConfidence() : 0,
                        "createdAt",  s.getCreatedAt().toString()
                ))
                .toList();
        return ResponseEntity.ok(result);
    }

    // ── Helper: resolve resume JSON from resumeId or latest ────────────

    private String resolveResumeContext(Map<String, Object> body, User user) {
        Object resumeIdObj = body.get("resumeId");
        if (resumeIdObj != null) {
            try {
                Long resumeId = Long.parseLong(resumeIdObj.toString());
                return historyRepository.findByIdAndUser(resumeId, user)
                        .map(ResumeHistory::getResumeData)
                        .orElse("");
            } catch (Exception ignored) {}
        }
        // Fall back to latest saved resume
        return historyRepository.findByUserOrderByCreatedAtDesc(user).stream()
                .findFirst()
                .map(ResumeHistory::getResumeData)
                .orElse("");
    }
}
