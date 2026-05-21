import axios from "axios";
import { getToken } from "./ResumeService";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8050";

const authHeader = () => ({ Authorization: `Bearer ${getToken()}` });

/** Non-streaming: send a single message and await the full response. */
export const sendMessage = async (message, sessionId) => {
  const res = await axios.post(
    `${BASE_URL}/api/v1/chat/message`,
    { message, sessionId },
    { headers: authHeader() }
  );
  return res.data; // { response, sessionId }
};

/**
 * SSE streaming: opens an EventSource and streams tokens as they arrive.
 * Calls onToken(token) for each chunk, onDone() when complete, onError(err) on failure.
 * Returns a close() function to abort the stream.
 */
export const streamMessage = (message, sessionId, onToken, onDone, onError) => {
  const token = getToken();
  const params = new URLSearchParams({ message, sessionId });
  const url = `${BASE_URL}/api/v1/chat/stream?${params}`;

  // EventSource doesn't support custom headers — use fetch-based SSE instead
  const controller = new AbortController();

  fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop(); // keep incomplete line

        for (const line of lines) {
          if (line.startsWith("data:")) {
            const data = line.slice(5).trim();
            if (data === "[DONE]") {
              onDone();
              return;
            }
            if (data) onToken(data);
          }
        }
      }
      onDone();
    })
    .catch((err) => {
      if (err.name !== "AbortError") onError(err);
    });

  return () => controller.abort();
};

/** Load chat history for a session. */
export const getChatHistory = async (sessionId) => {
  const res = await axios.get(`${BASE_URL}/api/v1/chat/history/${sessionId}`, {
    headers: authHeader(),
  });
  return res.data; // [{ id, role, content, createdAt }]
};

/** Clear all messages in a session. */
export const clearChatHistory = async (sessionId) => {
  await axios.delete(`${BASE_URL}/api/v1/chat/history/${sessionId}`, {
    headers: authHeader(),
  });
};
