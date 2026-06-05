import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaExclamationTriangle, FaTimes, FaCopy, FaCheck } from "react-icons/fa";
import { useState } from "react";
import toast from "react-hot-toast";

const ApiErrorModal = ({ isOpen, onClose, error, title = "AI Service Alert" }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const errorMessage = error?.message || String(error || "An unknown service error occurred.");
  
  // Categorize error to offer advice
  let advice = "Please try again in a few moments or contact support if the issue persists.";
  let subtitle = "API Transaction Blocked";

  const lowerErr = errorMessage.toLowerCase();
  if (lowerErr.includes("quota") || lowerErr.includes("limit") || lowerErr.includes("exceeded") || lowerErr.includes("billing") || lowerErr.includes("429")) {
    advice = "Your AI model endpoint subscription quota or credit limit has been exceeded. Please check your API key dashboard, billing state, or model parameters.";
    subtitle = "Model Quota Exceeded";
  } else if (lowerErr.includes("ollama") || lowerErr.includes("connrefused") || lowerErr.includes("offline") || lowerErr.includes("localhost")) {
    advice = "The local inference service (Ollama) appears to be offline. Make sure Ollama is launched, models are loaded, and the server is listening on port 11434.";
    subtitle = "Local AI Service Unreachable";
  } else if (lowerErr.includes("unauthorized") || lowerErr.includes("token") || lowerErr.includes("jwt")) {
    advice = "Your session token has expired or is invalid. Please sign out and sign back in to renew credentials.";
    subtitle = "Authorization Failure";
  }

  const copyError = () => {
    navigator.clipboard.writeText(errorMessage);
    setCopied(true);
    toast.success("Error copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal dialog box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.4 }}
          className="relative max-w-lg w-full glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden border border-red-500/20 text-base-content"
        >
          {/* Top warning ribbon */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-amber-500 to-red-500 animate-pulse" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-base-content/40 hover:text-base-content/80 transition-colors p-1"
          >
            <FaTimes className="text-lg" />
          </button>

          {/* Header Warning Icon */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shrink-0 shadow-lg shadow-red-500/5">
              <FaExclamationTriangle className="text-xl" />
            </div>
            <div>
              <span className="text-xs font-semibold text-red-500 uppercase tracking-widest block">
                {subtitle}
              </span>
              <h3 className="text-xl font-bold font-sans tracking-tight">
                {title}
              </h3>
            </div>
          </div>

          {/* Core explanation */}
          <div className="space-y-4 mb-6">
            <p className="text-sm text-base-content/70 leading-relaxed font-light">
              {advice}
            </p>

            {/* Diagnostics details drawer */}
            <div className="bg-black/20 dark:bg-black/40 border border-base-content/10 rounded-2xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-mono text-base-content/40 uppercase tracking-wider">
                  Technical Diagnostics
                </span>
                <button
                  onClick={copyError}
                  className="text-xs text-primary hover:text-primary-focus flex items-center gap-1 transition-colors"
                >
                  {copied ? (
                    <>
                      <FaCheck className="text-[10px]" /> Copied
                    </>
                  ) : (
                    <>
                      <FaCopy className="text-[10px]" /> Copy Log
                    </>
                  )}
                </button>
              </div>
              <div className="max-h-24 overflow-y-auto text-xs font-mono text-error/90 whitespace-pre-wrap leading-relaxed break-all select-all">
                {errorMessage}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="btn btn-outline border-base-content/20 hover:bg-base-content/5 text-base-content hover:border-base-content/40 rounded-xl px-6"
            >
              Acknowledge & Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ApiErrorModal;
