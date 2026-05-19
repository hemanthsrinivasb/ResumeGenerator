import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";

const useChatStore = create((set, get) => ({
  // UI state
  isOpen: false,
  isTyping: false,

  // Session
  sessionId: uuidv4(),

  // Messages: [{ id, role: "user"|"assistant", content, timestamp }]
  messages: [],

  // Currently streaming token buffer
  streamingContent: "",

  // Actions
  toggleChat: () => set((s) => ({ isOpen: !s.isOpen })),
  openChat: () => set({ isOpen: true }),
  closeChat: () => set({ isOpen: false }),

  setTyping: (v) => set({ isTyping: v }),

  addMessage: (role, content) => {
    const msg = { id: uuidv4(), role, content, timestamp: new Date().toISOString() };
    set((s) => ({ messages: [...s.messages, msg] }));
    return msg.id;
  },

  appendStreamToken: (token) =>
    set((s) => ({ streamingContent: s.streamingContent + token })),

  finalizeStream: () => {
    const content = get().streamingContent;
    if (content.trim()) {
      const msg = { id: uuidv4(), role: "assistant", content, timestamp: new Date().toISOString() };
      set((s) => ({ messages: [...s.messages, msg], streamingContent: "", isTyping: false }));
    } else {
      set({ streamingContent: "", isTyping: false });
    }
  },

  clearHistory: () =>
    set({ messages: [], streamingContent: "", sessionId: uuidv4() }),

  loadHistory: (serverMessages) => {
    const msgs = serverMessages.map((m) => ({
      id: m.id?.toString() || uuidv4(),
      role: m.role,
      content: m.content,
      timestamp: m.createdAt || new Date().toISOString(),
    }));
    set({ messages: msgs });
  },
}));

export default useChatStore;
