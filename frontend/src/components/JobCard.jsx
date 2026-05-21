import { motion } from "framer-motion";
import { FaBriefcase, FaBuilding, FaExternalLinkAlt, FaTag } from "react-icons/fa";

export default function JobCard({ job }) {
  const matchColor =
    job.matchScore >= 80 ? "badge-success" :
    job.matchScore >= 60 ? "badge-warning" :
    "badge-ghost";

  return (
    <motion.div
      className="card bg-base-100 shadow-md hover:shadow-xl border border-base-200 transition-shadow"
      whileHover={{ scale: 1.015 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
    >
      <div className="card-body p-4">
        {/* Company logo + name */}
        <div className="flex items-center gap-3 mb-1">
          {job.companyLogo ? (
            <img
              src={job.companyLogo}
              alt={job.company}
              className="w-8 h-8 object-contain rounded"
              onError={(e) => { e.target.style.display = "none"; }}
            />
          ) : (
            <div className="w-8 h-8 rounded bg-base-200 flex items-center justify-center">
              <FaBuilding className="text-base-content/40" size={14} />
            </div>
          )}
          <span className="text-sm font-semibold text-base-content/70">{job.company}</span>
          {job.matchScore != null && (
            <span className={`badge ${matchColor} badge-sm ml-auto`}>
              {job.matchScore}% match
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-bold text-base leading-tight mb-1">{job.title}</h3>

        {/* Meta */}
        <div className="flex flex-wrap gap-2 text-xs text-base-content/60 mb-2">
          {job.jobType && (
            <span className="flex items-center gap-1">
              <FaBriefcase size={10} /> {job.jobType}
            </span>
          )}
          {job.category && <span>• {job.category}</span>}
          {job.salary && <span className="text-success font-medium">• {job.salary}</span>}
        </div>

        {/* Tags */}
        {job.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {job.tags.slice(0, 5).map((tag) => (
              <span key={tag} className="badge badge-ghost badge-xs gap-1">
                <FaTag size={8} />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Match reason */}
        {job.matchReason && (
          <p className="text-xs text-base-content/50 italic mb-3">{job.matchReason}</p>
        )}

        {/* Apply button */}
        <div className="card-actions">
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-sm gap-1 w-full"
          >
            Apply Now <FaExternalLinkAlt size={11} />
          </a>
        </div>
      </div>
    </motion.div>
  );
}
