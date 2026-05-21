package com.resume.backend.demo.service;

import com.resume.backend.demo.model.ChatMessage;
import com.resume.backend.demo.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatbotService {

    private final ChatClient.Builder chatClientBuilder;
    private final EmbeddingService embeddingService;
    private final ChatMessageRepository chatMessageRepository;

    private static final String SYSTEM_PROMPT = """
            You are an expert AI Career Coach and Resume Specialist embedded in an AI Resume Builder platform.
            You help users optimize their resumes, improve ATS scores, tailor content for specific roles,
            and advance their careers.

            When resume context is provided, use it to give highly personalized, specific advice.
            Reference actual details from their resume (job titles, skills, projects, achievements).

            You can help with:
            - ATS optimization and keyword enhancement
            - Tailoring resume for specific companies (Google, Amazon, Microsoft, etc.)
            - Improving bullet points with measurable achievements (STAR format)
            - Identifying skill gaps for target roles
            - Rewriting sections professionally
            - FAANG-readiness assessment
            - Cover letter advice
            - Interview preparation
            - Career growth strategies

            Be direct, actionable, and specific. Use bullet points for clarity.
            When suggesting improvements, provide the actual rewritten text, not just advice.
            """;

    /** Non-streaming: returns full response after completion. */
    public String chat(String userMessage, Long userId, String sessionId) {
        String context = buildContext(userMessage, userId);
        String history = buildHistoryText(userId, sessionId);
        String augmentedPrompt = buildPrompt(context, history, userMessage);

        try {
            ChatClient client = chatClientBuilder.build();
            String response = client.prompt()
                    .system(SYSTEM_PROMPT)
                    .user(augmentedPrompt)
                    .call()
                    .content();

            persist(userId, sessionId, "user", userMessage);
            persist(userId, sessionId, "assistant", response);
            return response;
        } catch (Exception e) {
            log.error("Chatbot error for user {}: {}", userId, e.getMessage());
            return "I encountered an error processing your request. Please try again.";
        }
    }

    /** Streaming: publishes tokens via SseEmitter; call this from controller. */
    public void streamChat(String userMessage, Long userId, String sessionId,
                           TokenCallback onToken, Runnable onDone, ErrorCallback onError) {
        String context = buildContext(userMessage, userId);
        String history = buildHistoryText(userId, sessionId);
        String augmentedPrompt = buildPrompt(context, history, userMessage);

        persist(userId, sessionId, "user", userMessage);

        StringBuilder fullResponse = new StringBuilder();
        ChatClient client = chatClientBuilder.build();

        client.prompt()
                .system(SYSTEM_PROMPT)
                .user(augmentedPrompt)
                .stream()
                .content()
                .subscribe(
                        token -> {
                            fullResponse.append(token);
                            try {
                                onToken.accept(token);
                            } catch (IOException e) {
                                onError.accept(e);
                            }
                        },
                        error -> {
                            log.error("Chat stream error: {}", error.getMessage());
                            onError.accept(error);
                        },
                        () -> {
                            persist(userId, sessionId, "assistant", fullResponse.toString());
                            onDone.run();
                        }
                );
    }

    public List<ChatMessage> getHistory(Long userId, String sessionId) {
        return chatMessageRepository.findByUserIdAndSessionIdOrderByCreatedAtAsc(userId, sessionId);
    }

    @Transactional
    public void clearHistory(Long userId, String sessionId) {
        chatMessageRepository.deleteByUserIdAndSessionId(userId, sessionId);
    }

    // ── internal helpers ──────────────────────────────────────

    private String buildContext(String userMessage, Long userId) {
        if (!embeddingService.isRagEnabled()) return "";
        String ctx = embeddingService.searchRelevantContext(userMessage, userId, 5);
        if (ctx.isBlank()) return "";
        return "\n\n[RESUME CONTEXT — use this to give personalized advice]\n" + ctx + "\n";
    }

    private String buildHistoryText(Long userId, String sessionId) {
        List<ChatMessage> history = chatMessageRepository
                .findByUserIdAndSessionIdOrderByCreatedAtAsc(userId, sessionId);
        if (history.isEmpty()) return "";

        // Keep last 10 messages to avoid token overflow
        List<ChatMessage> recent = history.size() > 10 ? history.subList(history.size() - 10, history.size()) : history;
        return "\n\n[CHAT HISTORY]\n" + recent.stream()
                .map(m -> m.getRole().toUpperCase() + ": " + m.getContent())
                .collect(Collectors.joining("\n")) + "\n";
    }

    private String buildPrompt(String context, String history, String userMessage) {
        return context + history + "\n[USER MESSAGE]\n" + userMessage;
    }

    private void persist(Long userId, String sessionId, String role, String content) {
        chatMessageRepository.save(ChatMessage.builder()
                .userId(userId)
                .sessionId(sessionId)
                .role(role)
                .content(content)
                .build());
    }

    @FunctionalInterface
    public interface TokenCallback {
        void accept(String token) throws IOException;
    }

    @FunctionalInterface
    public interface ErrorCallback {
        void accept(Throwable error);
    }
}
