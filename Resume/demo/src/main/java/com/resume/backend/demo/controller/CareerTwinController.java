package com.resume.backend.demo.controller;

import com.resume.backend.demo.service.CareerTwinService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/career-twin")
@RequiredArgsConstructor
@Tag(name = "AI Digital Twin", description = "Simulates hiring decisions and career trajectory predictions")
public class CareerTwinController {

    private final CareerTwinService careerTwinService;

    @PostMapping("/simulate")
    @Operation(summary = "Simulate a hiring manager reviewing your resume for a target role",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Map<String, Object>> simulate(@RequestBody Map<String, String> body) {
        String resumeJson     = body.getOrDefault("resumeJson", "");
        String targetRole     = body.getOrDefault("targetRole", "Software Engineer");
        String targetCompany  = body.getOrDefault("targetCompany", "Top Tech Company");
        return ResponseEntity.ok(careerTwinService.simulateHiring(resumeJson, targetRole, targetCompany));
    }

    @PostMapping("/trajectory")
    @Operation(summary = "Predict your 1yr / 3yr / 5yr career trajectory",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Map<String, Object>> trajectory(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(careerTwinService.predictCareerTrajectory(body.getOrDefault("resumeJson", "")));
    }
}
