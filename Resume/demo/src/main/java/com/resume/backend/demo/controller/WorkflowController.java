package com.resume.backend.demo.controller;

import com.resume.backend.demo.model.User;
import com.resume.backend.demo.model.WorkflowSession;
import com.resume.backend.demo.service.UserService;
import com.resume.backend.demo.service.WorkflowService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/workflow")
@RequiredArgsConstructor
@Tag(name = "Career Workflow", description = "Autonomous AI career workflow engine")
public class WorkflowController {

    private final WorkflowService workflowService;
    private final UserService userService;

    @PostMapping("/create")
    @Operation(summary = "Create an autonomous career workflow from a career goal",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Map<String, Object>> createWorkflow(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = userService.findByEmail(userDetails.getUsername());
        String goalText   = body.getOrDefault("goalText", "");
        String resumeJson = body.getOrDefault("resumeJson", "");

        if (goalText.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "goalText is required"));
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(workflowService.createWorkflow(user, goalText, resumeJson));
    }

    @GetMapping("/sessions")
    @Operation(summary = "List all workflow sessions for the logged-in user",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<List<WorkflowSession>> getSessions(
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = userService.findByEmail(userDetails.getUsername());
        return ResponseEntity.ok(workflowService.getUserSessions(user));
    }

    @GetMapping("/sessions/{id}")
    @Operation(summary = "Get full workflow result for a session",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Map<String, Object>> getSession(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = userService.findByEmail(userDetails.getUsername());
        return ResponseEntity.ok(workflowService.getSessionDetail(id, user));
    }
}
