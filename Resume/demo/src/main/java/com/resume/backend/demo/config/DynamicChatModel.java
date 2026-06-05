package com.resume.backend.demo.config;

import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.chat.prompt.ChatOptions;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.api.OpenAiApi;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.ai.anthropic.AnthropicChatModel;
import org.springframework.ai.anthropic.api.AnthropicApi;
import org.springframework.ai.anthropic.AnthropicChatOptions;
import org.springframework.stereotype.Component;
import org.springframework.context.annotation.Primary;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import jakarta.servlet.http.HttpServletRequest;
import reactor.core.publisher.Flux;
import lombok.extern.slf4j.Slf4j;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Primary
@Slf4j
public class DynamicChatModel implements ChatModel {

    private final OpenAiChatModel defaultOpenAiChatModel;
    private final ConcurrentHashMap<String, ChatModel> cachedModels = new ConcurrentHashMap<>();

    public DynamicChatModel(OpenAiChatModel defaultOpenAiChatModel) {
        this.defaultOpenAiChatModel = defaultOpenAiChatModel;
    }

    private ChatModel getActiveModel() {
        ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs == null) {
            return defaultOpenAiChatModel;
        }
        HttpServletRequest request = attrs.getRequest();

        String openaiKey = request.getHeader("X-OpenAI-API-Key");
        String claudeKey = request.getHeader("X-Claude-API-Key");
        String geminiKey = request.getHeader("X-Gemini-API-Key");

        // 1. If Claude API Key is provided
        if (claudeKey != null && !claudeKey.isBlank()) {
            return cachedModels.computeIfAbsent("claude_" + claudeKey, k -> {
                log.info("Creating dynamic AnthropicChatModel with user-supplied Claude API key");
                AnthropicApi anthropicApi = new AnthropicApi(claudeKey);
                AnthropicChatOptions options = AnthropicChatOptions.builder()
                        .model("claude-3-5-sonnet-20241022")
                        .build();
                return new AnthropicChatModel(anthropicApi, options);
            });
        }

        // 2. If Gemini API Key is provided
        if (geminiKey != null && !geminiKey.isBlank()) {
            return cachedModels.computeIfAbsent("gemini_" + geminiKey, k -> {
                log.info("Creating dynamic OpenAiChatModel for Gemini with user-supplied API key");
                OpenAiApi openAiApi = new OpenAiApi("https://generativelanguage.googleapis.com/v1beta/openai", geminiKey);
                OpenAiChatOptions options = OpenAiChatOptions.builder()
                        .model("gemini-1.5-flash")
                        .build();
                return new OpenAiChatModel(openAiApi, options);
            });
        }

        // 3. If OpenAI API Key is provided
        if (openaiKey != null && !openaiKey.isBlank()) {
            return cachedModels.computeIfAbsent("openai_" + openaiKey, k -> {
                log.info("Creating dynamic OpenAiChatModel with user-supplied OpenAI API key");
                OpenAiApi openAiApi = new OpenAiApi(openaiKey);
                OpenAiChatOptions options = OpenAiChatOptions.builder()
                        .model("gpt-4o-mini")
                        .build();
                return new OpenAiChatModel(openAiApi, options);
            });
        }

        return defaultOpenAiChatModel;
    }

    @Override
    public ChatResponse call(Prompt prompt) {
        return getActiveModel().call(prompt);
    }

    @Override
    public Flux<ChatResponse> stream(Prompt prompt) {
        return getActiveModel().stream(prompt);
    }

    @Override
    public ChatOptions getDefaultOptions() {
        return getActiveModel().getDefaultOptions();
    }
}
