import React, { useEffect, useState } from "react";

function Contact() {
  const [theme, setTheme] = useState("light");
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission logic here (e.g., send to API, email service, etc.)
    alert("Message sent successfully!");
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <>
      {/* Theme Toggle */}
      <div className="flex justify-end p-4">
        <button
          onClick={toggleTheme}
          className="btn btn-sm btn-outline hover:scale-105 transition-transform"
        >
          {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
        </button>
      </div>

      <div className="max-w-3xl mx-auto shadow-2xl rounded-lg p-8 bg-base-100 text-base-content border border-gray-200 dark:border-gray-700 transition-all duration-300 animate-fade-in">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-primary animate-fade-in-up">
            Contact Me
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            I'd love to hear from you. Fill out the form below and I’ll get back to you soon.
          </p>
        </div>

        <div className="divider"></div>

        <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in-up">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Name</span>
            </label>
            <input
              type="text"
              name="name"
              className="input input-bordered"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Email</span>
            </label>
            <input
              type="email"
              name="email"
              className="input input-bordered"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Message</span>
            </label>
            <textarea
              name="message"
              className="textarea textarea-bordered h-32"
              value={form.message}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-control">
            <button type="submit" className="btn btn-primary w-full hover:scale-105 transition-transform">
              Send Message
            </button>
          </div>
        </form>
      </div>

      {/* Animations */}
      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.8s ease-in-out;
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-in-out;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}

export default Contact;
