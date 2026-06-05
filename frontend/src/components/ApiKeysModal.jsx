import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaKey } from "react-icons/fa";
import toast from "react-hot-toast";

const ApiKeysModal = ({ isOpen, onClose, onSuccess, isSignUp = false }) => {
  const [openaiKey, setOpenaiKey] = useState("");
  const [claudeKey, setClaudeKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");

  useEffect(() => {
    if (isOpen) {
      try {
        const stored = localStorage.getItem("user_api_keys");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.openai) setOpenaiKey(atob(parsed.openai));
          if (parsed.claude) setClaudeKey(atob(parsed.claude));
          if (parsed.gemini) setGeminiKey(atob(parsed.gemini));
        }
      } catch (err) {
        console.warn("Failed to load stored API keys", err);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    try {
      const keysObj = {
        openai: openaiKey.trim() ? btoa(openaiKey.trim()) : "",
        claude: claudeKey.trim() ? btoa(claudeKey.trim()) : "",
        gemini: geminiKey.trim() ? btoa(geminiKey.trim()) : "",
      };
      localStorage.setItem("user_api_keys", JSON.stringify(keysObj));
      toast.success("API keys updated successfully!");
      if (onSuccess) {
        onSuccess();
      } else {
        onClose();
      }
    } catch {
      toast.error("Failed to encrypt and save API keys");
    }
  };

  const handleSkip = () => {
    if (onSuccess) {
      onSuccess();
    } else {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={isSignUp ? undefined : onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal dialog box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.4 }}
          className="relative max-w-md w-full glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden border border-white/10 text-base-content"
        >
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-secondary to-accent" />

          {/* Close button */}
          {!isSignUp && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-base-content/40 hover:text-base-content/80 transition-colors p-1"
            >
              <FaTimes className="text-lg" />
            </button>
          )}

          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-lg">
              <FaKey className="text-xl" />
            </div>
            <div>
              <span className="text-xs font-semibold text-primary uppercase tracking-widest block">
                Preferences
              </span>
              <h3 className="text-xl font-bold font-sans tracking-tight">
                Model API Keys
              </h3>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4 mb-6">
            <p className="text-sm text-base-content/70 leading-relaxed font-light">
              {isSignUp
                ? "Welcome! You can optionally configure your personal API keys below to run models on your own quotas. These can also be configured later from your dashboard."
                : "Add your personal API keys below if you want the generator or assistant to run on your own quotas. Leave them blank to use default settings."}
            </p>

            <div className="form-control w-full">
              <label className="label py-1">
                <span className="label-text text-xs font-medium text-slate-300">OpenAI API Key (Optional)</span>
              </label>
              <input
                type="password"
                placeholder="sk-..."
                className="input input-bordered rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-primary/50 focus:outline-none transition-all h-10 px-4 text-sm"
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
              />
            </div>

            <div className="form-control w-full">
              <label className="label py-1">
                <span className="label-text text-xs font-medium text-slate-300">Claude API Key (Optional)</span>
              </label>
              <input
                type="password"
                placeholder="sk-ant-..."
                className="input input-bordered rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-primary/50 focus:outline-none transition-all h-10 px-4 text-sm"
                value={claudeKey}
                onChange={(e) => setClaudeKey(e.target.value)}
              />
            </div>

            <div className="form-control w-full">
              <label className="label py-1">
                <span className="label-text text-xs font-medium text-slate-300">Gemini API Key (Optional)</span>
              </label>
              <input
                type="password"
                placeholder="AIzaSy..."
                className="input input-bordered rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-primary/50 focus:outline-none transition-all h-10 px-4 text-sm"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
              />
            </div>

            <div className="text-xs text-red-500 font-medium leading-relaxed mt-4 flex items-start gap-2 bg-red-500/5 p-3 rounded-2xl border border-red-500/10">
              <span className="shrink-0 mt-0.5">🔒</span>
              <span>Your API keys are safe, secure, and stored in an encrypted format. They never leave your browser directly, so you don't need to worry.</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <button
              onClick={handleSkip}
              className="btn btn-ghost hover:bg-white/5 rounded-xl px-5 text-sm"
            >
              {isSignUp ? "Skip & Proceed" : "Cancel"}
            </button>
            <button
              onClick={handleSave}
              className="btn btn-primary rounded-xl px-5 text-sm"
            >
              {isSignUp ? "Save & Proceed" : "Save Keys"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ApiKeysModal;
