import React, { useEffect, useState } from "react";

function About() {
  const [theme, setTheme] = useState("light");

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

      <div className="max-w-4xl mx-auto shadow-2xl rounded-lg p-8 space-y-6 bg-base-100 text-base-content border border-gray-200 dark:border-gray-700 transition-all duration-300 animate-fade-in">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-primary animate-fade-in-up">
            About Me
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 animate-fade-in-up">
            I am a passionate developer who enjoys solving real-world problems through
            efficient code and creative design. With a strong background in full-stack
            development, I love working on products that make a difference.
          </p>
        </div>

        <div className="divider"></div>

        {/* Core Values */}
        <section className="animate-fade-in-up">
          <h2 className="text-2xl font-semibold text-secondary">Core Values</h2>
          <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2 mt-2">
            <li>💡 Innovation – I enjoy pushing boundaries and exploring new technologies.</li>
            <li>🤝 Collaboration – Teamwork and communication are at the heart of my workflow.</li>
            <li>🎯 Focus – I believe in staying consistent and focused on high-quality outcomes.</li>
            <li>🚀 Growth – Constant learning and growth fuel my passion for technology.</li>
          </ul>
        </section>

        <div className="divider"></div>

        {/* Hobbies */}
        <section className="animate-fade-in-up">
          <h2 className="text-2xl font-semibold text-secondary">Hobbies & Interests</h2>
          <p className="text-gray-700 dark:text-gray-300 mt-2">
            When I’m not coding, I enjoy:
          </p>
          <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1 mt-2">
            <li>📚 Reading tech blogs and fiction</li>
            <li>🎮 Gaming and game development</li>
            <li>🌍 Traveling and exploring new cultures</li>
            <li>📷 Photography and visual storytelling</li>
          </ul>
        </section>
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

export default About;
