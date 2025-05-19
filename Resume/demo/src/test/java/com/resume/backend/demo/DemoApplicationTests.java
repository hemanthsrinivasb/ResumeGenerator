package com.resume.backend.demo;

import com.resume.backend.demo.service.ResumeService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.io.IOException;

@SpringBootTest
class DemoApplicationTests {

	@Autowired
	private ResumeService resumeService;
	@Test
	void contextLoads() throws IOException {
		resumeService.generateResumeResponse("i am hemanth, with 2yr of java expreience");
	}

}
