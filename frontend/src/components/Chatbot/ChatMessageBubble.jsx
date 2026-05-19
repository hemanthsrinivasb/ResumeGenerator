import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { RiRobot2Fill } from "react-icons/ri";
import { FaUser } from "react-icons/fa";

export default function ChatMessageBubble({ message, isStreaming = false }) {
  const isUser = message.role === "user";

  return (
    <motion.div
      className={`flex items-start gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full text-white text-xs mt-1 ${
          isUser ? "bg-indigo-600" : "bg-violet-700"
        }`}
      >
        {isUser ? <FaUser size={11} /> : <RiRobot2Fill size={13} />}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
          isUser
            ? "bg-indigo-600 text-white rounded-tr-sm"
            : "bg-base-200 text-base-content rounded-tl-sm"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-li:my-0">
            <ReactMarkdown>{message.content}</ReactMarkdown>
            {isStreaming && (
              <span className="inline-block w-1 h-4 bg-violet-400 animate-pulse ml-0.5 rounded" />
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
