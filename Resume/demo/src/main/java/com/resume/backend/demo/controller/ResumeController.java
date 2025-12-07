package com.resume.backend.demo.controller;

import com.resume.backend.demo.Resumerequest;
import com.resume.backend.demo.service.ResumeService;
import org.json.JSONObject;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.Map;

@RestController
@CrossOrigin("*")
@RequestMapping("/api/v1/resume")
public class ResumeController {
    private ResumeService resumeService;

    public ResumeController(ResumeService resumeService) {
        this.resumeService = resumeService;
    }

    @PostMapping("/generate")
    public ResponseEntity<Map<String, Object>> getResumeData(
            @RequestBody Resumerequest resumeRequest) throws IOException {

        Map<String, Object> stringObjectMap = resumeService.generateResumeResponse(resumeRequest.userDescription());
        return new ResponseEntity<>(stringObjectMap, HttpStatus.OK);
    }

    @PostMapping("/analyze")
    public ResponseEntity<Map<String, Object>> analyzeResume(
            @RequestBody com.resume.backend.demo.AnalyzeResumeRequest request) throws IOException {
        Map<String, Object> response = resumeService.analyzeResume(request.resumeData(), request.jobDescription());
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PostMapping("/cover-letter")
    public ResponseEntity<Map<String, Object>> generateCoverLetter(
            @RequestBody com.resume.backend.demo.CoverLetterRequest request) throws IOException {
        Map<String, Object> response = resumeService.generateCoverLetter(request.resumeData(),
                request.jobDescription());
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}
