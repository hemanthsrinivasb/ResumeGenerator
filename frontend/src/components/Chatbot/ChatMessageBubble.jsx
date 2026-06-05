import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { RiRobot2Fill } from "react-icons/ri";
import { FaUser } from "react-icons/fa";
import { useNavigate } from "react-router";
import useChatStore from "../../store/chatStore";

export default function ChatMessageBubble({ message, isStreaming = false }) {
  const isUser = message.role === "user";
  const navigate = useNavigate();
  const { updateResumeCallback, setPendingResume } = useChatStore();

  // Try to parse resume JSON block if it exists
  let parsedResume = null;
  if (!isUser && message.content) {
    const jsonBlockRegex = /```json\s*([\s\S]+?)\s*```/;
    const match = message.content.match(jsonBlockRegex);
    if (match) {
      try {
        const parsed = JSON.parse(match[1].trim());
        if (parsed && (parsed.personalInformation || parsed.experience || parsed.skills)) {
          parsedResume = parsed;
        }
      } catch {
        // May fail if JSON block is incomplete during streaming
      }
    }
  }

  const handleApply = () => {
    if (!parsedResume) return;
    if (updateResumeCallback) {
      updateResumeCallback(parsedResume);
    } else {
      setPendingResume(parsedResume);
      navigate("/generate-resume");
    }
  };

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
        className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
          isUser
            ? "bg-indigo-600 text-white rounded-tr-sm"
            : message.content === "Model Error"
              ? "bg-red-500/10 text-red-400 border border-red-500/20 rounded-tl-sm"
              : "bg-base-200 text-base-content rounded-tl-sm"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : message.content === "Model Error" ? (
          <div className="flex flex-col gap-1.5 p-0.5">
            <span className="font-semibold flex items-center gap-1">
              ⚠️ Model Error
            </span>
            <p className="text-xs text-red-400/80 leading-normal">
              An error occurred while generating a response. This usually indicates that the configured API key is invalid, out of credits, or unreachable. Please check your API key settings.
            </p>
          </div>
        ) : (
          <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-li:my-0">
            <ReactMarkdown>{message.content}</ReactMarkdown>
            {isStreaming && (
              <span className="inline-block w-1 h-4 bg-violet-400 animate-pulse ml-0.5 rounded" />
            )}
            {parsedResume && !isStreaming && (
              <div className="mt-3 pt-3 border-t border-base-content/10 flex justify-end">
                <button
                  onClick={handleApply}
                  className="btn btn-xs btn-theme-inverse rounded-lg shadow-md flex items-center gap-1"
                >
                  ✨ Apply Suggestions
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
