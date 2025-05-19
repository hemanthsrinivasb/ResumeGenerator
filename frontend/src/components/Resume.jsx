import React, { useEffect, useRef, useState } from "react";
import "daisyui/dist/full.css";
import { FaGithub, FaLinkedin, FaPhone, FaEnvelope, FaMoon, FaSun } from "react-icons/fa";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

const Resume = ({ data }) => {
  const resumeRef = useRef(null);
  const [theme, setTheme] = useState("light");

  // Load theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  // Toggle between light and dark themes
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const handleDownloadPdf = () => {
    toPng(resumeRef.current, { quality: 1.0 })
      .then((dataUrl) => {
        const pdf = new jsPDF("p", "mm", "a4");
        pdf.addImage(dataUrl, "PNG", 10, 10, 190, 0);
        pdf.save(`${data.personalInformation.fullName}.pdf`);
      })
      .catch((err) => {
        console.error("Error generating PDF", err);
      });
  };

  return (
    <>
      {/* Theme Toggle Button */}
      <div className="flex justify-end p-4">
        <button
          onClick={toggleTheme}
          className="btn btn-sm btn-outline text-sm hover:scale-105 transition-transform"
        >
          {theme === "light" ? (
            <><FaMoon className="mr-2" /> Dark Mode</>
          ) : (
            <><FaSun className="mr-2" /> Light Mode</>
          )}
        </button>
      </div>

      <div
        ref={resumeRef}
        className="max-w-4xl mx-auto shadow-2xl rounded-lg p-8 space-y-6 bg-base-100 text-base-content border border-gray-200 dark:border-gray-700 transition-all duration-300 animate-fade-in"
      >
        {/* Header Section */}
        <div className="text-center space-y-2 animate-fade-in-up">
          <h1 className="text-4xl font-bold text-primary transition-transform duration-300 hover:scale-105">
            {data.personalInformation.fullName}
          </h1>
          <p className="text-lg text-gray-500">{data.personalInformation.location}</p>

          <div className="flex justify-center space-x-4 mt-2">
            {data.personalInformation.email && (
              <a
                href={`mailto:${data.personalInformation.email}`}
                className="flex items-center text-secondary hover:underline hover:text-accent transition-all duration-200"
              >
                <FaEnvelope className="mr-2" /> {data.personalInformation.email}
              </a>
            )}
            {data.personalInformation.phoneNumber && (
              <p className="flex items-center text-gray-500">
                <FaPhone className="mr-2" /> {data.personalInformation.phoneNumber}
              </p>
            )}
          </div>

          <div className="flex justify-center space-x-4 mt-2">
            {data.personalInformation.gitHub && (
              <a
                href={data.personalInformation.gitHub}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-gray-700 flex items-center transition-transform hover:scale-105"
              >
                <FaGithub className="mr-2" /> GitHub
              </a>
            )}
            {data.personalInformation.linkedIn && (
              <a
                href={data.personalInformation.linkedIn}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700 flex items-center transition-transform hover:scale-105"
              >
                <FaLinkedin className="mr-2" /> LinkedIn
              </a>
            )}
          </div>
        </div>

        <div className="divider"></div>

        {/* The rest of your sections below remain unchanged (Summary, Skills, etc.) */}
        {/* ... Insert all other sections from previous full code exactly as they are ... */}

        <section className="flex justify-center mt-4">
          <div
            onClick={handleDownloadPdf}
            className="btn btn-primary hover:scale-105 transition-transform duration-200 shadow-md"
          >
            Print
          </div>
        </section>

        {/* Fade-in animation styles */}
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
      </div>
    </>
  );
};

export default Resume;
