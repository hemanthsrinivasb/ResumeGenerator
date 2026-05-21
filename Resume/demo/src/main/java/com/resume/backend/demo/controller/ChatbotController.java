package com.resume.backend.demo.controller;

import com.resume.backend.demo.model.ChatMessage;
import com.resume.backend.demo.model.User;
import com.resume.backend.demo.service.ChatbotService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "AI Chatbot", description = "RAG-powered AI career coach chatbot with resume context")
@SecurityRequirement(name = "bearerAuth")
public class ChatbotController {

    private final ChatbotService chatbotService;

    /** Non-streaming single message — simpler for testing. */
    @PostMapping("/message")
    @Operation(summary = "Send a message to the AI career coach (non-streaming)")
    public ResponseEntity<Map<String, String>> sendMessage(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User user) {

        String message = body.getOrDefault("message", "").trim();
        String sessionId = body.getOrDefault("sessionId", "default");

        if (message.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Message cannot be empty"));
        }

        String response = chatbotService.chat(message, user.getId(), sessionId);
        return ResponseEntity.ok(Map.of("response", response, "sessionId", sessionId));
    }

    /** SSE streaming — tokens arrive as they are generated. */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "Stream AI career coach response token-by-token via SSE")
    public SseEmitter streamMessage(
            @RequestParam String message,
            @RequestParam(defaultValue = "default") String sessionId,
            @AuthenticationPrincipal User user) {

        SseEmitter emitter = new SseEmitter(120_000L);

        CompletableFuture.runAsync(() ->
                chatbotService.streamChat(
                        message,
                        user.getId(),
                        sessionId,
                        token -> emitter.send(SseEmitter.event().name("token").data(token)),
                        () -> {
                            try {
                                emitter.send(SseEmitter.event().name("done").data("[DONE]"));
                                emitter.complete();
                            } catch (IOException e) {
                                emitter.completeWithError(e);
                            }
                        },
                        emitter::completeWithError
                )
        );

        return emitter;
    }

    /** Load chat history for a session. */
    @GetMapping("/history/{sessionId}")
    @Operation(summary = "Get chat history for a session")
    public ResponseEntity<List<Map<String, Object>>> getHistory(
            @PathVariable String sessionId,
            @AuthenticationPrincipal User user) {

        List<Map<String, Object>> history = chatbotService.getHistory(user.getId(), sessionId)
                .stream()
                .map(m -> Map.<String, Object>of(
                        "id", m.getId(),
                        "role", m.getRole(),
                        "content", m.getContent(),
                        "createdAt", m.getCreatedAt().toString()
                ))
                .toList();

        return ResponseEntity.ok(history);
    }

    /** Clear all messages in a session. */
    @DeleteMapping("/history/{sessionId}")
    @Operation(summary = "Clear all messages in a chat session")
    public ResponseEntity<Void> clearHistory(
            @PathVariable String sessionId,
            @AuthenticationPrincipal User user) {

        chatbotService.clearHistory(user.getId(), sessionId);
        return ResponseEntity.noContent().build();
    }
}
