package com.resume.backend.demo.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class ResumeServiceImpl implements ResumeService {

    private static final int MAX_RETRY_ATTEMPTS = 3;
    private final ChatClient chatClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ResumeServiceImpl(ChatClient.Builder builder) {
        this.chatClient = builder.build();
    }

    // ── Public AI methods ──────────────────────────────────────────

    @Override
    public Map<String, Object> generateResumeResponse(String userResumeDescription) throws IOException {
        String promptContent = buildResumePrompt(userResumeDescription);
        return callWithRetry(promptContent, MAX_RETRY_ATTEMPTS);
    }

    @Override
    public Map<String, Object> analyzeResume(Map<String, Object> resumeData, String jobDescription) throws IOException {
        String template = loadPromptFromFile("resume_analysis_prompt.txt");
        String promptContent = putValuesToTemplate(template, Map.of(
                "resumeData", new JSONObject(resumeData).toString(),
                "jobDescription", jobDescription));
        return callWithRetry(promptContent, MAX_RETRY_ATTEMPTS);
    }

    @Override
    public Map<String, Object> generateCoverLetter(Map<String, Object> resumeData, String jobDescription) throws IOException {
        String template = loadPromptFromFile("cover_letter_prompt.txt");
        String promptContent = putValuesToTemplate(template, Map.of(
                "resumeData", new JSONObject(resumeData).toString(),
                "jobDescription", jobDescription));
        return callWithRetry(promptContent, MAX_RETRY_ATTEMPTS);
    }

    @Override
    public Map<String, Object> generateInterviewQuestions(Map<String, Object> resumeData, String jobDescription) throws IOException {
        String template = loadPromptFromFile("interview_questions_prompt.txt");
        String promptContent = putValuesToTemplate(template, Map.of(
                "resumeData", new JSONObject(resumeData).toString(),
                "jobDescription", jobDescription));
        return callWithRetry(promptContent, MAX_RETRY_ATTEMPTS);
    }

    @Override
    public Map<String, Object> generateSkillsGap(Map<String, Object> resumeData, String jobDescription) throws IOException {
        String template = loadPromptFromFile("skills_gap_prompt.txt");
        String promptContent = putValuesToTemplate(template, Map.of(
                "resumeData", new JSONObject(resumeData).toString(),
                "jobDescription", jobDescription));
        return callWithRetry(promptContent, MAX_RETRY_ATTEMPTS);
    }

    @Override
    public Map<String, Object> generateLinkedinPost(Map<String, Object> resumeData, String targetRole) throws IOException {
        String template = loadPromptFromFile("linkedin_post_prompt.txt");
        String promptContent = putValuesToTemplate(template, Map.of(
                "resumeData", new JSONObject(resumeData).toString(),
                "targetRole", targetRole));
        return callWithRetry(promptContent, MAX_RETRY_ATTEMPTS);
    }

    @Override
    public String buildResumePrompt(String userDescription) throws IOException {
        String template = loadPromptFromFile("resume_prompt.txt");
        return putValuesToTemplate(template, Map.of("userDescription", userDescription));
    }

    // ── Internal helpers ───────────────────────────────────────────

    private Map<String, Object> callWithRetry(String promptContent, int maxAttempts) {
        Exception lastError = null;
        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                Prompt prompt = new Prompt(promptContent);
                String response = chatClient.prompt(prompt).call().content();
                Map<String, Object> parsed = parseMultipleResponses(response);
                if (parsed.get("data") != null) {
                    return parsed;
                }
                log.warn("LLM attempt {} returned null data — retrying", attempt);
            } catch (Exception e) {
                lastError = e;
                log.warn("LLM attempt {} failed: {}", attempt, e.getMessage());
            }
        }
        log.error("All {} LLM attempts failed", maxAttempts);
        Map<String, Object> errorResult = new HashMap<>();
        errorResult.put("think", null);
        errorResult.put("data", null);
        errorResult.put("error", lastError != null ? lastError.getMessage() : "Unknown error");
        return errorResult;
    }

    String loadPromptFromFile(String filename) throws IOException {
        Path path = new ClassPathResource(filename).getFile().toPath();
        return Files.readString(path);
    }

    String putValuesToTemplate(String template, Map<String, String> values) {
        for (Map.Entry<String, String> entry : values.entrySet()) {
            template = template.replace("{{" + entry.getKey() + "}}", entry.getValue());
        }
        return template;
    }

    public static Map<String, Object> parseMultipleResponses(String response) {
        Map<String, Object> jsonResponse = new HashMap<>();
        ObjectMapper mapper = new ObjectMapper();

        // Extract <think>...</think>
        int thinkStart = response.indexOf("<think>") + 7;
        int thinkEnd   = response.indexOf("</think>");
        if (thinkStart > 6 && thinkEnd != -1 && thinkStart < thinkEnd) {
            jsonResponse.put("think", response.substring(thinkStart, thinkEnd).trim());
        } else {
            jsonResponse.put("think", null);
        }

        // Extract ```json ... ```
        int jsonStart = response.indexOf("```json");
        int jsonEnd   = response.lastIndexOf("```");
        if (jsonStart != -1 && jsonEnd > jsonStart) {
            String jsonContent = response.substring(jsonStart + 7, jsonEnd).trim();
            try {
                jsonResponse.put("data", mapper.readValue(jsonContent, Map.class));
            } catch (Exception e) {
                // Try parsing the entire trimmed response as JSON (some models skip the fence)
                try {
                    jsonResponse.put("data", mapper.readValue(response.trim(), Map.class));
                } catch (Exception ex) {
                    log.error("Failed to parse LLM JSON response: {}", e.getMessage());
                    jsonResponse.put("data", null);
                }
            }
        } else {
            // No code fence — try raw JSON
            try {
                jsonResponse.put("data", mapper.readValue(response.trim(), Map.class));
            } catch (Exception e) {
                jsonResponse.put("data", null);
            }
        }

        return jsonResponse;
    }
}
