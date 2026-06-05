import React from "react";
import { Link } from "react-router";
import { motion } from "framer-motion";

const LandingPage = () => {
  return (
    <div className="relative overflow-hidden min-h-screen bg-grid">
      {/* Hero Section */}
      <section className="relative pt-24 pb-20 md:pt-32 md:pb-28">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-3xl mx-auto"
          >
            <span className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-6">
              ✨ Next-gen AI Career Suite
            </span>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 leading-[1.1] text-gradient-animate">
              Craft Your Perfect Resume With AI
            </h1>
            <p className="text-lg md:text-xl text-base-content/85 mb-10 max-w-xl mx-auto font-light leading-relaxed">
              Build a professional, ATS-optimized resume in minutes. Describe your experience, and let our advanced AI coordinate the rest.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to={"/generate-resume"}
                className="btn btn-theme-inverse hover:scale-105 active:scale-95 transition-all rounded-2xl px-8 h-14"
              >
                Get Started Free
              </Link>
              <Link
                to={"/about"}
                className="btn btn-ghost hover:bg-base-content/5 border border-base-content/10 hover:border-base-content/20 rounded-2xl px-8 h-14"
              >
                Learn More
              </Link>
            </div>
          </motion.div>
          
          {/* Animated Interactive Mock Preview */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className="mt-16 md:mt-20 max-w-4xl mx-auto rounded-2xl glass-panel p-2 shadow-2xl relative"
          >
            <div className="rounded-xl overflow-hidden bg-base-300 border border-base-content/5 aspect-[16/9] relative flex flex-col">
              {/* Window controls */}
              <div className="h-10 bg-base-200/60 border-b border-base-content/5 px-4 flex items-center gap-2 shrink-0">
                <div className="w-3 h-3 rounded-full bg-error/80" />
                <div className="w-3 h-3 rounded-full bg-warning/80" />
                <div className="w-3 h-3 rounded-full bg-success/80" />
                <div className="w-40 h-5 rounded bg-base-content/5 mx-auto text-[10px] text-base-content/40 flex items-center justify-center font-mono">
                  ai-resume-generator.app
                </div>
              </div>
              {/* Content panel mock */}
              <div className="flex-1 p-6 grid grid-cols-3 gap-6 text-left overflow-hidden bg-gradient-to-b from-base-300/50 to-base-200/90">
                <div className="col-span-1 border-r border-base-content/5 pr-6 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary" />
                  <div className="h-4 bg-base-content/15 rounded w-3/4" />
                  <div className="space-y-2">
                    <div className="h-3 bg-base-content/5 rounded w-full" />
                    <div className="h-3 bg-base-content/5 rounded w-5/6" />
                    <div className="h-3 bg-base-content/5 rounded w-2/3" />
                  </div>
                </div>
                <div className="col-span-2 space-y-6">
                  <div className="h-5 bg-base-content/10 rounded w-1/3" />
                  <div className="space-y-3">
                    <div className="h-3 bg-base-content/5 rounded w-full" />
                    <div className="h-3 bg-base-content/5 rounded w-full" />
                    <div className="h-3 bg-base-content/5 rounded w-4/5" />
                  </div>
                  <div className="h-4 bg-base-content/10 rounded w-1/4" />
                  <div className="space-y-3">
                    <div className="h-3 bg-base-content/5 rounded w-full" />
                    <div className="h-3 bg-base-content/5 rounded w-5/6" />
                  </div>
                </div>
              </div>
            </div>
            {/* Ambient Glow */}
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary to-secondary opacity-20 blur-xl -z-10" />
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative border-t border-base-content/5 bg-base-200/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 text-gradient-primary">
              Engineered For Results
            </h2>
            <p className="text-base-content/70 max-w-lg mx-auto font-light">
              Equipped with deep analytical suites to ensure your application gets noticed.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <motion.div
              whileHover={{ y: -8 }}
              transition={{ duration: 0.3 }}
              className="card glass-panel card-glow rounded-3xl p-8"
            >
              <div className="text-4xl mb-6 bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center border border-primary/20">🚀</div>
              <h3 className="text-2xl font-bold mb-4">AI-Powered Creation</h3>
              <p className="text-base-content/75 font-light leading-relaxed">
                Smart resume composer analyzes your targets and writes highly optimized, professional job profiles instantly.
              </p>
            </motion.div>
            
            {/* Feature 2 */}
            <motion.div
              whileHover={{ y: -8 }}
              transition={{ duration: 0.3 }}
              className="card glass-panel card-glow rounded-3xl p-8"
            >
              <div className="text-4xl mb-6 bg-secondary/10 w-16 h-16 rounded-2xl flex items-center justify-center border border-secondary/20">📄</div>
              <h3 className="text-2xl font-bold mb-4">Designer Templates</h3>
              <p className="text-base-content/75 font-light leading-relaxed">
                Choose from modern, clean, and classic templates styled by typography experts and optimized for ATS filters.
              </p>
            </motion.div>
            
            {/* Feature 3 */}
            <motion.div
              whileHover={{ y: -8 }}
              transition={{ duration: 0.3 }}
              className="card glass-panel card-glow rounded-3xl p-8"
            >
              <div className="text-4xl mb-6 bg-accent/10 w-16 h-16 rounded-2xl flex items-center justify-center border border-accent/20">💼</div>
              <h3 className="text-2xl font-bold mb-4">Job Matching & RAG</h3>
              <p className="text-base-content/75 font-light leading-relaxed">
                Matches your skills with active remote job portals, predicting skills gaps and suggesting smart learning roadmaps.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 relative border-t border-base-content/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 text-gradient-primary">
              Trusted by Job Seekers
            </h2>
            <p className="text-base-content/70 max-w-lg mx-auto font-light">
              See how our digital coaching tool transformed careers globally.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Testimonial 1 */}
            <div className="card glass-panel p-8 rounded-3xl card-glow">
              <p className="text-base-content/80 font-light italic leading-relaxed mb-6">
                "This AI resume maker saved me so much time! My resume looks incredibly professional and clean, and I ended up landing multiple senior-level software engineering interviews in a week."
              </p>
              <div className="flex items-center gap-4 mt-auto">
                <div className="avatar">
                  <div className="w-12 h-12 rounded-full border border-primary/30 overflow-hidden">
                    <img src="https://randomuser.me/api/portraits/men/1.jpg" alt="John Doe" />
                  </div>
                </div>
                <div>
                  <h4 className="font-bold">John Doe</h4>
                  <p className="text-xs text-primary font-medium">Software Engineer</p>
                </div>
              </div>
            </div>
            
            {/* Testimonial 2 */}
            <div className="card glass-panel p-8 rounded-3xl card-glow">
              <p className="text-base-content/80 font-light italic leading-relaxed mb-6">
                "The templates are stunning and the dynamic AI suggestions make editing a breeze. The built-in ATS checker gave me immediate feedback to customize my keywords correctly."
              </p>
              <div className="flex items-center gap-4 mt-auto">
                <div className="avatar">
                  <div className="w-12 h-12 rounded-full border border-secondary/30 overflow-hidden">
                    <img src="https://randomuser.me/api/portraits/women/2.jpg" alt="Jane Smith" />
                  </div>
                </div>
                <div>
                  <h4 className="font-bold">Jane Smith</h4>
                  <p className="text-xs text-secondary font-medium">Product Manager</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-24 relative border-t border-base-content/5 bg-base-200/40">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="glass-panel rounded-3xl p-12 relative overflow-hidden">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-6 text-gradient-glow">
              Ready to Accelerate Your Career?
            </h2>
            <p className="mb-10 text-base-content/80 max-w-lg mx-auto font-light leading-relaxed">
              Join thousands of applicants landing interviews at global firms. Take control of your career twin today.
            </p>
            <Link
              to="/generate-resume"
              className="btn btn-theme-inverse hover:scale-105 active:scale-95 transition-all rounded-2xl px-10 h-14"
            >
              Get Started Now
            </Link>
            {/* Decorative background glow */}
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-secondary/10 rounded-full blur-3xl" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-base-content/5 bg-base-300/80">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <h4 className="font-bold text-lg">AI Resume Builder</h4>
              <p className="text-base-content/60 text-sm font-light">
                Your autonomous, intelligent workspace for resumes, interviews, and portfolio generation.
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold text-sm uppercase tracking-wider">Quick Links</h4>
              <ul className="space-y-2 text-base-content/70 text-sm font-light">
                <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold text-sm uppercase tracking-wider">Legal</h4>
              <ul className="space-y-2 text-base-content/70 text-sm font-light">
                <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-base-content/5 mt-12 pt-6 text-center text-xs text-base-content/40 font-light">
            &copy; {new Date().getFullYear()} AI Resume Maker. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
