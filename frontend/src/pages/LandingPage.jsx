import React from "react";
import { Link } from "react-router";

const LandingPage = () => {
  return (
    <div className="bg-base-100">
      {/* Hero Section */}
      <section className="hero min-h-screen bg-base-200 animate-fade-in">
        <div className="hero-content text-center">
          <div className="max-w-2xl">
            <h1 className="text-5xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary animate-slide-up">
              Create Your Perfect Resume with AI
            </h1>
            <p className="py-6 text-lg text-gray-700 animate-fade-in-up">
              Build a professional resume in minutes. Just describe yourself,
              and our AI will do the rest!
            </p>
            <Link
              to={"/generate-resume"}
              className="btn btn-primary transition duration-300 transform hover:scale-105"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-base-100 animate-fade-in">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
            Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="card bg-base-200 shadow-xl transition-transform hover:scale-105 duration-300">
              <div className="card-body items-center text-center">
                <div className="text-4xl mb-4 animate-bounce">🚀</div>
                <h3 className="card-title text-2xl font-semibold">AI-Powered</h3>
                <p className="text-gray-600">
                  Our AI analyzes your input and generates a tailored resume for
                  you.
                </p>
              </div>
            </div>
            {/* Feature 2 */}
            <div className="card bg-base-200 shadow-xl transition-transform hover:scale-105 duration-300">
              <div className="card-body items-center text-center">
                <div className="text-4xl mb-4 animate-bounce">📄</div>
                <h3 className="card-title text-2xl font-semibold">Multiple Templates</h3>
                <p className="text-gray-600">
                  Choose from a variety of professionally designed resume
                  templates.
                </p>
              </div>
            </div>
            {/* Feature 3 */}
            <div className="card bg-base-200 shadow-xl transition-transform hover:scale-105 duration-300">
              <div className="card-body items-center text-center">
                <div className="text-4xl mb-4 animate-bounce">💼</div>
                <h3 className="card-title text-2xl font-semibold">Job-Specific Resumes</h3>
                <p className="text-gray-600">
                  Optimize your resume for specific job roles and industries.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-base-200 animate-fade-in">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
            What Our Users Say
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Testimonial 1 */}
            <div className="card bg-base-100 shadow-xl transform hover:scale-105 transition duration-300">
              <div className="card-body">
                <p className="text-gray-600">
                  "This AI resume maker saved me so much time! My resume looks
                  professional and got me multiple interviews."
                </p>
                <div className="flex items-center mt-4">
                  <div className="avatar">
                    <div className="w-12 rounded-full">
                      <img
                        src="https://randomuser.me/api/portraits/men/1.jpg"
                        alt="User"
                      />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h4 className="font-bold">John Doe</h4>
                    <p className="text-gray-700">Software Engineer</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Testimonial 2 */}
            <div className="card bg-base-100 shadow-xl transform hover:scale-105 transition duration-300">
              <div className="card-body">
                <p className="text-gray-600">
                  "I love the templates and the ease of use. Highly recommend
                  this tool to anyone looking for a job."
                </p>
                <div className="flex items-center mt-4">
                  <div className="avatar">
                    <div className="w-12 rounded-full">
                      <img
                        src="https://randomuser.me/api/portraits/women/2.jpg"
                        alt="User"
                      />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h4 className="font-bold">Jane Smith</h4>
                    <p className="text-gray-700">Marketing Specialist</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 bg-base-100 animate-fade-in">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
            Ready to Create Your Resume?
          </h2>
          <p className="mb-8 text-lg text-gray-600">
            Join thousands of users who have landed their dream jobs with our AI
            resume maker.
          </p>
          <button className="btn btn-primary transform hover:scale-105 transition duration-300">
            Get Started Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer p-10 bg-base-200 text-base-content animate-fade-in">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h4 className="footer-title text-lg font-semibold">AI Resume Maker</h4>
              <p>Your go-to tool for creating professional resumes with AI.</p>
            </div>
            <div>
              <h4 className="footer-title text-lg font-semibold">Quick Links</h4>
              <a href="#" className="link link-hover">
                About Us
              </a>
              <a href="#" className="link link-hover">
                Features
              </a>
              <a href="#" className="link link-hover">
                Contact
              </a>
            </div>
            <div>
              <h4 className="footer-title text-lg font-semibold">Legal</h4>
              <a href="#" className="link link-hover">
                Privacy Policy
              </a>
              <a href="#" className="link link-hover">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
