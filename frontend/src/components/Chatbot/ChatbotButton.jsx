import { motion } from "framer-motion";
import { RiRobot2Fill } from "react-icons/ri";
import useChatStore from "../../store/chatStore";
import { isLoggedIn } from "../../api/ResumeService";

export default function ChatbotButton() {
  const { isOpen, toggleChat, messages } = useChatStore();
  const unread = messages.filter((m) => m.role === "assistant").length;

  // Only show for logged-in users
  if (!isLoggedIn()) return null;

  return (
    <motion.button
      onClick={toggleChat}
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/40 text-white focus:outline-none"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      title="AI Career Coach"
    >
      {/* Pulse ring when closed */}
      {!isOpen && (
        <span className="absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-30 animate-ping" />
      )}

      <RiRobot2Fill size={24} />

      {/* Unread badge */}
      {!isOpen && unread > 0 && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </motion.button>
  );
}
