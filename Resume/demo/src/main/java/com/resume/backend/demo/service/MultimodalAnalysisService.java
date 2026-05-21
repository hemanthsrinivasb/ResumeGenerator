package com.resume.backend.demo.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@Slf4j
@Service
public class MultimodalAnalysisService {

    @Value("${multimodal.service.url:http://localhost:8070}")
    private String multimodalServiceUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @SuppressWarnings("unchecked")
    public Map<String, Object> analyzeAudio(MultipartFile audioFile) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", new MultipartInputStreamFileResource(
                    audioFile.getInputStream(), audioFile.getOriginalFilename()));

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.exchange(
                    multimodalServiceUrl + "/analyze-audio",
                    HttpMethod.POST, requestEntity, Map.class);

            return response.getBody() != null ? response.getBody() : Map.of("error", "No response");
        } catch (Exception e) {
            log.error("Audio analysis call failed: {}", e.getMessage());
            return Map.of("error", "Multimodal service unavailable: " + e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> analyzeVideoFrame(MultipartFile imageFile) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", new MultipartInputStreamFileResource(
                    imageFile.getInputStream(), imageFile.getOriginalFilename()));

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.exchange(
                    multimodalServiceUrl + "/analyze-video-frame",
                    HttpMethod.POST, requestEntity, Map.class);

            return response.getBody() != null ? response.getBody() : Map.of("error", "No response");
        } catch (Exception e) {
            log.error("Video frame analysis call failed: {}", e.getMessage());
            return Map.of("error", "Multimodal service unavailable: " + e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> analyzeCommunication(String transcript) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("transcript", transcript);

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.exchange(
                    multimodalServiceUrl + "/analyze-communication",
                    HttpMethod.POST, requestEntity, Map.class);

            return response.getBody() != null ? response.getBody() : Map.of("error", "No response");
        } catch (Exception e) {
            log.error("Communication analysis call failed: {}", e.getMessage());
            return Map.of("error", "Multimodal service unavailable: " + e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> analyzeGitHub(String username, String token) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("username", username);
            if (token != null && !token.isBlank()) body.add("token", token);

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.exchange(
                    multimodalServiceUrl + "/analyze-github",
                    HttpMethod.POST, requestEntity, Map.class);

            return response.getBody() != null ? response.getBody() : Map.of("error", "No response");
        } catch (Exception e) {
            log.error("GitHub analysis call failed: {}", e.getMessage());
            return Map.of("error", "Multimodal service unavailable or GitHub rate limit: " + e.getMessage());
        }
    }

    // Helper: wraps InputStream as a named resource for multipart upload
    private static class MultipartInputStreamFileResource extends ByteArrayResource {
        private final String filename;

        MultipartInputStreamFileResource(java.io.InputStream inputStream, String filename) throws java.io.IOException {
            super(inputStream.readAllBytes());
            this.filename = filename != null ? filename : "file";
        }

        @Override
        public String getFilename() { return filename; }
    }
}
