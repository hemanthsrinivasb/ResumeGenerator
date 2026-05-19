package com.resume.backend.demo.service.agents;

import com.resume.backend.demo.model.AgentSession;
import com.resume.backend.demo.model.User;
import com.resume.backend.demo.repository.AgentSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
@RequiredArgsConstructor
public class AgentOrchestrator {

    private final AgentSessionRepository agentSessionRepository;
    private final ChatClient.Builder chatClientBuilder;

    private static final Map<String, String> AGENT_PROMPTS = Map.of(
        "ATS", """
            You are an elite ATS (Applicant Tracking System) expert and resume optimization specialist.
            Your role: analyze resumes purely through the lens of automated screening systems.
            Focus on: keyword density, formatting compliance, section structure, quantified achievements.
            Always provide: an ATS compatibility score (0-100), top 3 missing keywords, specific formatting fixes.
            Be direct, technical, and data-driven. End with a confidence rating (0-100).
            """,
        "RECRUITER", """
            You are a senior technical recruiter at a top-tier tech company with 15 years of experience.
            Your role: evaluate resumes from a human recruiter's first-impression perspective.
            Focus on: career narrative, impact statements, progression clarity, red flags, standout elements.
            Always provide: overall impression, top strength, top concern, actionable rewrites for weak bullets.
            Be candid but encouraging. End with a confidence rating (0-100).
            """,
        "TECHNICAL", """
            You are a FAANG staff engineer conducting a technical resume review.
            Your role: evaluate technical credibility, depth, and accuracy of claimed skills and projects.
            Focus on: technical stack relevance, project complexity, measurable engineering impact, skill gaps for the target role.
            Always provide: technical credibility score (0-100), skills to add, projects to elaborate, specific technical rewrites.
            Be rigorous and specific. End with a confidence rating (0-100).
            """,
        "CAREER", """
            You are an executive career coach who has helped 500+ engineers land FAANG roles.
            Your role: evaluate the overall career strategy, personal brand, and trajectory narrative.
            Focus on: career progression story, role positioning, unique value proposition, LinkedIn alignment.
            Always provide: positioning assessment, 3 strategic recommendations, best target companies/roles.
            Be strategic and motivational. End with a confidence rating (0-100).
            """
    );

    /**
     * Run a single agent against the given context.
     */
    public Map<String, Object> runAgent(String agentType, String userMessage, String resumeContext, User user) {
        String type = agentType.toUpperCase();
        String systemPrompt = AGENT_PROMPTS.getOrDefault(type,
                "You are an AI career assistant. Provide thoughtful, specific feedback.");

        String fullPrompt = """
                %s

                === RESUME CONTEXT ===
                %s

                === USER REQUEST ===
                %s

                Provide your expert analysis now:
                """.formatted(systemPrompt,
                resumeContext.isBlank() ? "No resume provided — give general career advice." : resumeContext,
                userMessage);

        String response;
        int confidence = 75;
        try {
            response  = chatClientBuilder.build().prompt().user(fullPrompt).call().content();
            confidence = extractConfidence(response);
        } catch (Exception e) {
            log.error("Agent {} failed: {}", type, e.getMessage());
            response = "The AI agent is temporarily unavailable. Please ensure the Ollama backend is running.";
        }

        // Persist session
        agentSessionRepository.save(AgentSession.builder()
                .user(user)
                .agentType(type)
                .userMessage(userMessage)
                .agentResponse(response)
                .confidence(confidence)
                .build());

        List<String> suggestions = extractSuggestions(response, type);

        return Map.of(
                "agentType",   type,
                "agentLabel",  agentLabel(type),
                "response",    response,
                "confidence",  confidence,
                "suggestions", suggestions
        );
    }

    /**
     * Run all 4 agents in parallel and return a combined result map.
     */
    public Map<String, Object> runPanel(String userMessage, String resumeContext, User user) {
        List<String> types = List.of("ATS", "RECRUITER", "TECHNICAL", "CAREER");

        List<CompletableFuture<Map<String, Object>>> futures = types.stream()
                .map(t -> CompletableFuture.supplyAsync(() -> runAgent(t, userMessage, resumeContext, user)))
                .toList();

        Map<String, Object> panel = new LinkedHashMap<>();
        for (int i = 0; i < types.size(); i++) {
            try {
                panel.put(types.get(i), futures.get(i).join());
            } catch (Exception e) {
                panel.put(types.get(i), Map.of(
                        "agentType", types.get(i),
                        "response",  "Agent unavailable.",
                        "confidence", 0,
                        "suggestions", List.of()
                ));
            }
        }
        return panel;
    }

    // ── Helpers ────────────────────────────────────────────────────────

    private int extractConfidence(String response) {
        if (response == null) return 70;
        String lower = response.toLowerCase();
        int idx = lower.lastIndexOf("confidence");
        if (idx == -1) return 70;
        String sub = response.substring(idx, Math.min(idx + 30, response.length()));
        String num = sub.replaceAll("[^0-9]", " ").trim().split("\\s+")[0];
        try {
            int v = Integer.parseInt(num);
            return Math.max(0, Math.min(100, v));
        } catch (Exception e) { return 70; }
    }

    private List<String> extractSuggestions(String response, String agentType) {
        return switch (agentType) {
            case "ATS"       -> List.of("Add more keywords", "Quantify achievements", "Fix formatting");
            case "RECRUITER" -> List.of("Strengthen bullets", "Add impact metrics", "Clarify role scope");
            case "TECHNICAL" -> List.of("Detail tech stack", "Add architecture diagrams", "Show scale");
            case "CAREER"    -> List.of("Define target role", "Improve LinkedIn", "Build personal brand");
            default          -> List.of("Review feedback", "Apply suggestions", "Iterate resume");
        };
    }

    private String agentLabel(String type) {
        return switch (type) {
            case "ATS"       -> "ATS Optimizer";
            case "RECRUITER" -> "Senior Recruiter";
            case "TECHNICAL" -> "Staff Engineer";
            case "CAREER"    -> "Career Coach";
            default          -> type;
        };
    }
}
