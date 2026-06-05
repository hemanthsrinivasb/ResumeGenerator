package com.resume.backend.demo.service;

import com.resume.backend.demo.model.ChatMessage;
import com.resume.backend.demo.model.ResumeHistory;
import com.resume.backend.demo.model.User;
import com.resume.backend.demo.repository.ChatMessageRepository;
import com.resume.backend.demo.repository.ResumeHistoryRepository;
import com.resume.backend.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatbotService {

    private final ChatClient.Builder chatClientBuilder;
    private final EmbeddingService embeddingService;
    private final ChatMessageRepository chatMessageRepository;
    private final ResumeHistoryRepository resumeHistoryRepository;
    private final UserRepository userRepository;
    private final JobSearchService jobSearchService;

    private static final String SYSTEM_PROMPT = """
            You are an expert AI Career Coach, ATS Optimizer, and Resume Specialist embedded in an AI Resume Builder platform.
            You help users optimize their resumes, improve ATS scores, and suggest job matches.

            When resume context is provided, use it to give highly personalized, specific advice.
            Reference actual details from their resume (job titles, skills, projects, achievements).

            IMPORTANT RULES:
            1. Ensure all resume advice/bullets result in high ATS scores. Use the STAR methodology (Situation, Task, Action, Result) with measurable metrics.
            2. ALWAYS WRITE LIKE A HUMAN. Avoid generic, typical AI-generated clichés and robotic buzzwords (e.g., "spearheaded", "synergized", "delighted", "tapestry", "revolutionized", "leveraged", "beacon", "testament"). Instead, write in a direct, professional, accomplishment-driven human tone.
            3. When user requests tailoring, modification, or improvement based on a job description, output the fully modified/updated resume in standard JSON format wrapped inside a markdown code block:
               ```json
               {
                 "personalInformation": { "fullName": "...", "email": "...", "phoneNumber": "...", "location": "...", "linkedIn": "...", "gitHub": "...", "portfolio": "..." },
                 "summary": "...",
                 "skills": ["...", "..."],
                 "experience": [
                   { "jobTitle": "...", "company": "...", "location": "...", "duration": "...", "responsibility": "..." }
                 ],
                 "education": [
                   { "degree": "...", "university": "...", "location": "...", "graduationYear": "..." }
                 ],
                 "certifications": [
                   { "title": "...", "issuingOrganization": "...", "year": "..." }
                 ],
                 "projects": [
                   { "title": "...", "description": "...", "technologiesUsed": "...", "githubLink": "..." }
                 ],
                 "languages": [
                   { "name": "..." }
                 ],
                 "interests": [
                   { "name": "..." }
                 ]
               }
               ```
               Always follow this exact JSON structure and ensure it represents the complete, updated resume (never truncate or return partial JSON).
            4. Make sure job recommendations include complete clickable URL links.
            """;

    /** Non-streaming: returns full response after completion. */
    public String chat(String userMessage, Long userId, String sessionId, String pageUrl) {
        String context = buildContext(userMessage, userId);
        String history = buildHistoryText(userId, sessionId);
        String augmentedPrompt = buildPrompt(context, history, userMessage, pageUrl);

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
    public void streamChat(String userMessage, Long userId, String sessionId, String pageUrl,
                           TokenCallback onToken, Runnable onDone, ErrorCallback onError) {
        String context = buildContext(userMessage, userId);
        String history = buildHistoryText(userId, sessionId);
        String augmentedPrompt = buildPrompt(context, history, userMessage, pageUrl);

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

    private String getLatestResumeJson(Long userId) {
        try {
            User user = userRepository.findById(userId).orElse(null);
            if (user != null) {
                List<ResumeHistory> historyList = resumeHistoryRepository.findByUserOrderByCreatedAtDesc(user);
                if (historyList != null && !historyList.isEmpty()) {
                    return historyList.get(0).getResumeData();
                }
            }
        } catch (Exception e) {
            log.warn("Failed to retrieve latest resume for user {}: {}", userId, e.getMessage());
        }
        return "";
    }

    private String getJobsContext(String userMessage, String latestResumeJson) {
        String query = userMessage.toLowerCase();
        boolean looksLikeJobQuery = query.contains("job") || query.contains("hiring") || query.contains("career") || query.contains("opening") || query.contains("vacancy") || query.contains("position");
        if (!looksLikeJobQuery) return "";

        try {
            List<Map<String, Object>> recommendedJobs = List.of();
            if (latestResumeJson != null && !latestResumeJson.isBlank()) {
                recommendedJobs = jobSearchService.recommendJobsForResume(latestResumeJson);
            }
            if (recommendedJobs.isEmpty()) {
                recommendedJobs = jobSearchService.searchJobs("software engineer", 5);
            }

            StringBuilder sb = new StringBuilder();
            sb.append("\n\n[AVAILABLE REMOTE JOB MATCHES - present these to the user with their url links]:\n");
            int count = 1;
            for (Map<String, Object> job : recommendedJobs) {
                if (count > 5) break;
                sb.append(count).append(". Title: ").append(job.get("title"))
                  .append(", Company: ").append(job.get("company"))
                  .append(", Match Score: ").append(job.getOrDefault("matchScore", 70)).append("%")
                  .append(", Apply Link: ").append(job.get("url")).append("\n");
                count++;
            }
            return sb.toString();
        } catch (Exception e) {
            log.warn("Failed to get job context: {}", e.getMessage());
            return "";
        }
    }

    private String buildContext(String userMessage, Long userId) {
        StringBuilder contextBuilder = new StringBuilder();

        // 1. Fetch the user's latest saved resume
        String latestResume = getLatestResumeJson(userId);
        if (!latestResume.isBlank()) {
            contextBuilder.append("\n\n[USER'S FULL CURRENT RESUME DATA]:\n")
                          .append(latestResume)
                          .append("\n");
        }

        // 2. Fetch semantic search RAG context
        if (embeddingService.isRagEnabled()) {
            String ragContext = embeddingService.searchRelevantContext(userMessage, userId, 5);
            if (!ragContext.isBlank()) {
                contextBuilder.append("\n\n[SEMANTICALLY RELEVANT RESUME CHUNKS]:\n")
                              .append(ragContext)
                              .append("\n");
            }
        }

        // 3. Fetch Job recommendations if requested
        String jobsContext = getJobsContext(userMessage, latestResume);
        if (!jobsContext.isBlank()) {
            contextBuilder.append(jobsContext);
        }

        return contextBuilder.toString();
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

    private String buildPrompt(String context, String history, String userMessage, String pageUrl) {
        String pageContext = "";
        if (pageUrl != null && !pageUrl.isBlank()) {
            pageContext = "\n[CURRENT USER PAGE CONTEXT]: The user is currently viewing the page path: " + pageUrl 
                    + " in the Resume Builder application. Please respond in the context of this page if appropriate.\n";
        }
        return context + pageContext + history + "\n[USER MESSAGE]\n" + userMessage;
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
