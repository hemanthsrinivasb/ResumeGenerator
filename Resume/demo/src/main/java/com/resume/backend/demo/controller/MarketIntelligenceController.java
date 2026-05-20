package com.resume.backend.demo.controller;

import com.resume.backend.demo.service.MarketIntelligenceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/market")
@RequiredArgsConstructor
@Tag(name = "Market Intelligence", description = "AI-powered job market analytics: skill demand, salary insights, hiring trends")
public class MarketIntelligenceController {

    private final MarketIntelligenceService service;

    @GetMapping("/skills")
    @Operation(summary = "Get skill demand ranking for a role",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Map<String, Object>> skillDemand(@RequestParam String role) {
        return ResponseEntity.ok(service.getSkillDemand(role));
    }

    @GetMapping("/salary")
    @Operation(summary = "Get salary insights for a role and location",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Map<String, Object>> salaryInsights(
            @RequestParam String role,
            @RequestParam(required = false) String location) {
        return ResponseEntity.ok(service.getSalaryInsights(role, location));
    }

    @GetMapping("/trends")
    @Operation(summary = "Get overall hiring trends from recent job postings",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Map<String, Object>> hiringTrends() {
        return ResponseEntity.ok(service.getHiringTrends());
    }
}
