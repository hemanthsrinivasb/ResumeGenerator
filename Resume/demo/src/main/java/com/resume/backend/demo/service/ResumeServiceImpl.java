package com.resume.backend.demo.service;
import com.fasterxml.jackson.databind.ObjectMapper;
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

@Service
public class ResumeServiceImpl implements ResumeService {
    private ChatClient chatClient;

    public ResumeServiceImpl(ChatClient.Builder builder) {
        this.chatClient = builder.build();
    }

    @Override
    public Map<String, Object> generateResumeResponse(String userResumeDescription) throws IOException {
        String promptString = this.loadPromptFromFile("resume_prompt.txt");
        String promptContent = this.putValuesToTemplate(promptString, Map.of(
                "userDescription", userResumeDescription
        ));
        Prompt prompt = new Prompt(promptContent);
        String response = chatClient.prompt(prompt).call().content();
        Map<String,Object> mp=parseMultipleResponses(response); //CONVER THE JSON BACK TO STRING
        return mp;
    }

    //    !LOAD FILE FROM THE PATH
    String loadPromptFromFile(String filename) throws IOException {
        Path path = new ClassPathResource(filename).getFile().toPath();
        return Files.readString(path);
    }

    //    !Replace the dynamic values int he prompt template by taking input form the user
    String putValuesToTemplate(String template, Map<String, String> values) {
        for (Map.Entry<String, String> entry : values.entrySet()) {
            template = template.replace("{{" + entry.getKey() + "}}", entry.getValue());
        }
        return template;
    }

    //    !METHOD TO CONVER THE JSON RESPONSE OF THE MODEL TO STRING


        public static Map<String, Object> parseMultipleResponses(String response) {
            Map<String, Object> jsonResponse = new HashMap<>();
            ObjectMapper objectMapper = new ObjectMapper();

            // Extract content inside <think> tags
            int thinkStart = response.indexOf("<think>") + 7;
            int thinkEnd = response.indexOf("</think>");
            if (thinkStart != -1 + 7 && thinkEnd != -1 && thinkStart < thinkEnd) {
                String thinkContent = response.substring(thinkStart, thinkEnd).trim();
                jsonResponse.put("think", thinkContent);
            } else {
                jsonResponse.put("think", null); // Handle missing <think> tags
            }

            // Extract content that is in JSON format
            int jsonStart = response.indexOf("```json") + 7; // After ```json
            int jsonEnd = response.lastIndexOf("```");       // Before closing ```
            if (jsonStart != -1 + 7 && jsonEnd != -1 && jsonStart < jsonEnd) {
                String jsonContent = response.substring(jsonStart, jsonEnd).trim();
                try {
                    Map<String, Object> dataContent = objectMapper.readValue(jsonContent, Map.class);
                    jsonResponse.put("data", dataContent);
                } catch (Exception e) {
                    jsonResponse.put("data", null); // Handle invalid JSON
                    System.err.println("Invalid JSON format in the response: " + e.getMessage());
                }
            } else {
                jsonResponse.put("data", null); // Handle missing JSON block
            }

            // Convert the result Map to a JSONObject and return it
            return jsonResponse;
        }
    }

