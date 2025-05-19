import React from "react";
import { Link } from "react-router";

const Services = () => {
  return (
    <div className="bg-base-100 text-base-content">
      {/* Hero Section */}
      <section className="hero min-h-[60vh] bg-base-200 animate-fade-in">
        <div className="hero-content text-center">
          <div className="max-w-2xl">
            <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary animate-slide-up mb-4">
              Our Services
            </h1>
            <p className="text-lg text-gray-700 animate-fade-in-up">
              Discover how our AI-powered platform helps you create standout
              resumes tailored to your career goals.
            </p>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
            What We Offer
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Service 1 */}
            <div className="card bg-base-200 shadow-xl transition hover:scale-105 duration-300">
              <div className="card-body text-center">
                <div className="text-4xl mb-4">🧠</div>
                <h3 className="card-title text-2xl font-semibold">AI Resume Builder</h3>
                <p className="text-gray-600">
                  Generate professional resumes using intelligent AI trained on industry best practices.
                </p>
              </div>
            </div>
            {/* Service 2 */}
            <div className="card bg-base-200 shadow-xl transition hover:scale-105 duration-300">
              <div className="card-body text-center">
                <div className="text-4xl mb-4">🎨</div>
                <h3 className="card-title text-2xl font-semibold">Customizable Templates</h3>
                <p className="text-gray-600">
                  Pick from a range of modern, clean templates to match your profession and personality.
                </p>
              </div>
            </div>
            {/* Service 3 */}
            <div className="card bg-base-200 shadow-xl transition hover:scale-105 duration-300">
              <div className="card-body text-center">
                <div className="text-4xl mb-4">📌</div>
                <h3 className="card-title text-2xl font-semibold">Job-Specific Tailoring</h3>
                <p className="text-gray-600">
                  Tailor your resume for different job roles and industries to improve your chances of landing interviews.
                </p>
              </div>
            </div>
            {/* Service 4 */}
            <div className="card bg-base-200 shadow-xl transition hover:scale-105 duration-300">
              <div className="card-body text-center">
                <div className="text-4xl mb-4">📝</div>
                <h3 className="card-title text-2xl font-semibold">Live Resume Editor</h3>
                <p className="text-gray-600">
                  Easily edit and update your resume with a real-time preview to see changes instantly.
                </p>
              </div>
            </div>
            {/* Service 5 */}
            <div className="card bg-base-200 shadow-xl transition hover:scale-105 duration-300">
              <div className="card-body text-center">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="card-title text-2xl font-semibold">ATS Optimization</h3>
                <p className="text-gray-600">
                  Ensure your resume passes Applicant Tracking Systems (ATS) used by major employers.
                </p>
              </div>
            </div>
            {/* Service 6 */}
            <div className="card bg-base-200 shadow-xl transition hover:scale-105 duration-300">
              <div className="card-body text-center">
                <div className="text-4xl mb-4">📥</div>
                <h3 className="card-title text-2xl font-semibold">Export & Download</h3>
                <p className="text-gray-600">
                  Download your resume in PDF format instantly and apply for jobs right away.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-base-200 animate-fade-in">
        <div className="container mx-auto text-center px-4">
          <h2 className="text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
            Ready to Build Your Resume?
          </h2>
          <p className="mb-6 text-lg text-gray-600">
            Get started in just a few clicks and let AI guide your career forward.
          </p>
          <Link
            to="/generate-resume"
            className="btn btn-primary transition transform hover:scale-105"
          >
            Start Now
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Services;
