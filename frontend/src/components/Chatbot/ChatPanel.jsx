import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RiRobot2Fill, RiSendPlanFill } from "react-icons/ri";
import { IoClose, IoTrash } from "react-icons/io5";
import useChatStore from "../../store/chatStore";
import ChatMessageBubble from "./ChatMessageBubble";
import { streamMessage, clearChatHistory, getChatHistory } from "../../api/ChatService";

const SUGGESTED_PROMPTS = [
  "Improve my ATS score",
  "Tailor for Google SWE role",
  "Add measurable achievements",
  "Rewrite projects professionally",
  "Make my resume FAANG-ready",
  "Identify my skill gaps",
  "Generate a cover letter",
  "Suggest relevant certifications",
];

export default function ChatPanel() {
  const {
    isOpen, closeChat, messages, streamingContent,
    sessionId, isTyping, setTyping,
    addMessage, appendStreamToken, finalizeStream, clearHistory,
  } = useChatStore();

  const [input, setInput] = useState("");
  const [stopStream, setStopStream] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);

  const handleSend = (text) => {
    const msg = (text || input).trim();
    if (!msg || isTyping) return;

    addMessage("user", msg);
    setInput("");
    setTyping(true);

    const stop = streamMessage(
      msg,
      sessionId,
      (token) => appendStreamToken(token),
      () => finalizeStream(),
      (err) => {
        console.error("Stream error:", err);
        finalizeStream();
      }
    );
    setStopStream(() => stop);
  };

  const handleClear = async () => {
    try {
      await clearChatHistory(sessionId);
    } catch (_) { /* silent */ }
    clearHistory();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Assemble visible messages (persist + current streaming)
  const allMessages = streamingContent
    ? [...messages, { id: "streaming", role: "assistant", content: streamingContent }]
    : messages;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed bottom-24 right-6 z-50 flex flex-col w-[360px] sm:w-[400px] h-[580px] rounded-2xl shadow-2xl shadow-black/30 bg-base-100 border border-base-300 overflow-hidden"
          initial={{ opacity: 0, y: 40, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.92 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
            <div className="flex items-center gap-2">
              <RiRobot2Fill size={20} />
              <div>
                <p className="font-semibold text-sm leading-tight">AI Career Coach</p>
                <p className="text-xs text-violet-200">Powered by DeepSeek-r1 + RAG</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleClear}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                title="Clear history"
              >
                <IoTrash size={16} />
              </button>
              <button
                onClick={closeChat}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
              >
                <IoClose size={18} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 scroll-smooth">
            {allMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3 text-base-content/60">
                <RiRobot2Fill size={40} className="text-violet-400" />
                <div>
                  <p className="font-medium text-sm">Your AI Career Coach</p>
                  <p className="text-xs mt-1">Save a resume first to unlock personalized advice.</p>
                </div>
              </div>
            )}

            {allMessages.map((msg, i) => (
              <ChatMessageBubble
                key={msg.id}
                message={msg}
                isStreaming={msg.id === "streaming"}
              />
            ))}

            {isTyping && !streamingContent && (
              <div className="flex items-center gap-2 pl-9">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="w-2 h-2 rounded-full bg-violet-400"
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested prompts (only when no messages) */}
          {allMessages.length === 0 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {SUGGESTED_PROMPTS.slice(0, 4).map((p) => (
                <button
                  key={p}
                  onClick={() => handleSend(p)}
                  className="text-xs px-2.5 py-1 rounded-full border border-base-300 bg-base-200 hover:bg-violet-100 hover:border-violet-300 hover:text-violet-700 transition-colors truncate max-w-[180px]"
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-3 pb-3 pt-2 border-t border-base-200">
            <div className="flex items-end gap-2 bg-base-200 rounded-xl px-3 py-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your resume…"
                className="flex-1 bg-transparent resize-none text-sm focus:outline-none min-h-[36px] max-h-[100px] leading-5"
                rows={1}
                disabled={isTyping}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isTyping}
                className="flex-shrink-0 p-1.5 rounded-lg bg-violet-600 text-white disabled:opacity-40 hover:bg-violet-700 transition-colors"
              >
                <RiSendPlanFill size={16} />
              </button>
            </div>
            <p className="text-center text-xs text-base-content/40 mt-1">Enter to send · Shift+Enter for new line</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
