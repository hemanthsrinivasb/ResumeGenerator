import { useState } from "react";
import { ThumbsUp, ThumbsDown, MessageSquare, X } from "lucide-react";
import { axiosInstance } from "../api/ResumeService";
import toast from "react-hot-toast";

export default function FeedbackWidget({ endpointType, aiResponseSnippet, compact = false }) {
  const [rating,   setRating]   = useState(null);
  const [showText, setShowText] = useState(false);
  const [text,     setText]     = useState("");
  const [submitted,setSubmitted]= useState(false);
  const [loading,  setLoading]  = useState(false);

  const submit = async (r) => {
    const finalRating = r ?? rating;
    if (!finalRating) return;
    setLoading(true);
    try {
      await axiosInstance.post("/api/v1/feedback/submit", {
        endpointType,
        rating: finalRating,
        feedbackText: text || null,
        aiResponseSnippet: aiResponseSnippet ? aiResponseSnippet.slice(0, 500) : null,
      });
      setSubmitted(true);
      toast.success("Thank you for your feedback!");
    } catch { toast.error("Failed to submit feedback."); }
    finally { setLoading(false); }
  };

  if (submitted) {
    return (
      <div className="flex items-center gap-1 text-xs text-base-content/40">
        <ThumbsUp size={12} /> Feedback submitted
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-base-content/40">Helpful?</span>
        <button
          onClick={() => { setRating(5); submit(5); }}
          disabled={loading}
          className="btn btn-ghost btn-xs text-success"
        ><ThumbsUp size={12} /></button>
        <button
          onClick={() => { setRating(1); setShowText(true); }}
          disabled={loading}
          className="btn btn-ghost btn-xs text-error"
        ><ThumbsDown size={12} /></button>
        {showText && (
          <div className="flex items-center gap-1">
            <input
              className="input input-bordered input-xs w-32"
              placeholder="What went wrong?"
              value={text}
              onChange={e => setText(e.target.value)}
            />
            <button onClick={() => submit(1)} disabled={loading || !text.trim()} className="btn btn-xs btn-primary">
              {loading ? <span className="loading loading-xs loading-spinner" /> : "Send"}
            </button>
            <button onClick={() => setShowText(false)} className="btn btn-ghost btn-xs"><X size={10} /></button>
          </div>
        )}
      </div>
    );
  }

  // Full widget
  return (
    <div className="border border-base-200 rounded-xl p-3 mt-3">
      <p className="text-xs font-semibold text-base-content/50 mb-2">Rate this AI result</p>
      <div className="flex gap-1 mb-2">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            onClick={() => setRating(n)}
            className={`btn btn-xs ${rating === n ? "btn-primary" : "btn-ghost"}`}
          >{n}⭐</button>
        ))}
      </div>
      <button
        onClick={() => setShowText(p => !p)}
        className="btn btn-ghost btn-xs gap-1 mb-2"
      ><MessageSquare size={11} /> Add comment</button>
      {showText && (
        <textarea
          className="textarea textarea-bordered textarea-xs w-full h-16 resize-none text-xs"
          placeholder="Optional: What could be improved?"
          value={text}
          onChange={e => setText(e.target.value)}
        />
      )}
      <div className="flex justify-end mt-2">
        <button
          onClick={() => submit(rating)}
          disabled={loading || !rating}
          className="btn btn-primary btn-xs"
        >
          {loading ? <span className="loading loading-spinner loading-xs" /> : "Submit Feedback"}
        </button>
      </div>
    </div>
  );
}
