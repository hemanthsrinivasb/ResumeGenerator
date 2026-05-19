package com.resume.backend.demo.controller;

import com.resume.backend.demo.model.User;
import com.resume.backend.demo.service.MockInterviewService;
import com.resume.backend.demo.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/interview")
@RequiredArgsConstructor
@Tag(name = "Mock Interview", description = "AI-driven interactive mock interview sessions")
public class InterviewController {

    private final MockInterviewService interviewService;
    private final UserService userService;

    @PostMapping("/sessions")
    @Operation(summary = "Start a new mock interview session",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Map<String, Object>> startSession(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = userService.findByEmail(userDetails.getUsername());
        String jobTitle      = body.getOrDefault("jobTitle", "Software Engineer");
        String interviewType = body.getOrDefault("interviewType", "MIXED");

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(interviewService.startSession(user, jobTitle, interviewType));
    }

    @PostMapping("/sessions/{id}/answer")
    @Operation(summary = "Submit an answer to the current question — returns evaluation + next question",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Map<String, Object>> submitAnswer(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = userService.findByEmail(userDetails.getUsername());
        String answer = body.getOrDefault("answer", "");
        return ResponseEntity.ok(interviewService.submitAnswer(id, user, answer));
    }

    @PostMapping("/sessions/{id}/end")
    @Operation(summary = "End session early and receive final report",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Map<String, Object>> endSession(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = userService.findByEmail(userDetails.getUsername());
        return ResponseEntity.ok(interviewService.finishSession(id, user));
    }

    @GetMapping("/sessions")
    @Operation(summary = "List all past interview sessions for the logged-in user",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<?> listSessions(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByEmail(userDetails.getUsername());
        return ResponseEntity.ok(interviewService.getUserSessions(user));
    }

    @GetMapping("/sessions/{id}")
    @Operation(summary = "Get full transcript and scores for a session",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Map<String, Object>> getSession(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = userService.findByEmail(userDetails.getUsername());
        return ResponseEntity.ok(interviewService.getSessionDetail(id, user));
    }
}
