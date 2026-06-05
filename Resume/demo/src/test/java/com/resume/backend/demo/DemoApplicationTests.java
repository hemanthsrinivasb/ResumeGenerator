package com.resume.backend.demo;

import com.resume.backend.demo.service.ResumeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.model.Generation;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.prompt.Prompt;

import java.io.IOException;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@SpringBootTest(properties = {
		"spring.ai.openai.api-key=mock-key"
})
class DemoApplicationTests {

	@Autowired
	private ResumeService resumeService;

	@MockitoBean
	private ChatModel chatModel;

	@BeforeEach
	void setUp() {
		ChatResponse chatResponse = Mockito.mock(ChatResponse.class);
		Generation generation = Mockito.mock(Generation.class);
		AssistantMessage assistantMessage = Mockito.mock(AssistantMessage.class);

		when(chatModel.call(any(Prompt.class))).thenReturn(chatResponse);
		when(chatResponse.getResult()).thenReturn(generation);
		when(chatResponse.getResults()).thenReturn(List.of(generation));
		when(generation.getOutput()).thenReturn(assistantMessage);
		when(assistantMessage.getText()).thenReturn("<think>Mock reasoning</think>\n```json\n{\"data\": \"mock data\"}\n```");
	}

	@Test
	void contextLoads() throws IOException {
		Map<String, Object> response = resumeService.generateResumeResponse("i am hemanth, with 2yr of java expreience");
		assert response != null;
	}

}
