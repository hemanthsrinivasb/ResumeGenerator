import React, { useEffect, useState } from "react";
import "daisyui/dist/full.css";
import { FaMoon, FaSun } from "react-icons/fa";
import ModernTemplate from "./templates/ModernTemplate";
import ClassicTemplate from "./templates/ClassicTemplate";
import CreativeTemplate from "./templates/CreativeTemplate";

const Resume = ({ data, templateId = "modern" }) => {
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

  const renderTemplate = () => {
    switch (templateId) {
      case "creative":
        return <CreativeTemplate data={data} theme={theme} />;
      case "classic":
        return <ClassicTemplate data={data} theme={theme} />;
      case "modern":
      default:
        return <ModernTemplate data={data} theme={theme} />;
    }
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

      {renderTemplate()}
    </>
  );
};

export default Resume;
