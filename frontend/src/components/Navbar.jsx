import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router";
import { isLoggedIn } from "../api/ResumeService";
import { FaSun, FaMoon } from "react-icons/fa";

const navLink = "text-sm font-medium hover:text-primary transition-colors duration-300 relative py-1 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-gradient-to-r after:from-primary after:to-secondary after:transition-all after:duration-300 hover:after:w-full";

function Navbar() {
  const location = useLocation();
  const loggedIn = isLoggedIn();
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "night");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "night" ? "light" : "night"));
  };

  return (
    <div className="sticky top-4 z-50 mx-4 lg:mx-auto max-w-7xl">
      <div className="navbar glass-panel rounded-2xl shadow-xl px-4 sm:px-6 py-2 transition-all duration-300">
        <div className="navbar-start">
          <div className="dropdown">
            <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden hover:scale-105 transition-transform p-2 mr-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 transition-transform hover:rotate-90 duration-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h8m-8 6h16"
                />
              </svg>
            </div>
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content bg-base-100/95 border border-base-content/10 rounded-2xl z-[1] mt-3 w-56 p-3 shadow-2xl space-y-1 backdrop-blur-md text-base-content"
            >
              <li><Link to="/about"    className={navLink}>About</Link></li>
              <li><Link to="/services" className={navLink}>Services</Link></li>
              <li><Link to="/contact"  className={navLink}>Contact Us</Link></li>
              <li><Link to="/jobs"     className={navLink}>Jobs</Link></li>
              {loggedIn && <>
                <div className="divider my-1 border-base-content/5"></div>
                <li><Link to="/analytics" className={navLink}>Analytics</Link></li>
                <li><Link to="/interview" className={navLink}>Interview</Link></li>
                <li><Link to="/agents"    className={navLink}>AI Panel</Link></li>
                <li><Link to="/portfolio" className={navLink}>Portfolio</Link></li>
                <li><Link to="/workflow"     className={navLink}>⚡ Workflow</Link></li>
                <li><Link to="/digital-twin" className={navLink}>🧬 Digital Twin</Link></li>
                <li><Link to="/multimodal"   className={navLink}>🎬 Multimodal</Link></li>
                <li><Link to="/job-tracker"  className={navLink}>💼 Job Tracker</Link></li>
                <li><Link to="/market-intel" className={navLink}>📊 Market Intel</Link></li>
              </>}
            </ul>
          </div>
          <Link 
            to={"/"} 
            className="flex items-center gap-2 font-bold text-lg sm:text-xl tracking-wide bg-gradient-to-r from-primary to-secondary text-transparent bg-clip-text hover:scale-102 transition-transform duration-200"
          >
            AI Resume Maker
          </Link>
        </div>
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1 gap-4 items-center">
            <li>
              <Link to="/about" className={navLink}>About</Link>
            </li>
            <li>
              <Link to="/services" className={navLink}>Services</Link>
            </li>
            <li>
              <Link to="/contact" className={navLink}>Contact Us</Link>
            </li>
            <li><Link to="/jobs" className={navLink}>Jobs</Link></li>
            {loggedIn && (
              <li className="relative group">
                <div className="dropdown dropdown-hover dropdown-end">
                  <div
                    tabIndex={0}
                    role="button"
                    className="text-sm font-medium hover:text-primary transition-colors duration-300 py-1 flex items-center gap-1 cursor-pointer select-none"
                  >
                    AI Workspace
                    <svg className="w-3.5 h-3.5 opacity-60 group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  <ul
                    tabIndex={0}
                    className="dropdown-content z-[100] menu p-2.5 shadow-2xl bg-base-100/95 border border-base-content/10 rounded-2xl w-60 space-y-0.5 backdrop-blur-md text-base-content mt-2"
                  >
                    <li><Link to="/analytics" className="hover:text-primary py-2 px-3 rounded-xl flex items-center gap-2"><span className="text-sm">📈</span> Analytics</Link></li>
                    <li><Link to="/interview" className="hover:text-primary py-2 px-3 rounded-xl flex items-center gap-2"><span className="text-sm">🎙️</span> Interview</Link></li>
                    <li><Link to="/agents" className="hover:text-primary py-2 px-3 rounded-xl flex items-center gap-2"><span className="text-sm">🤖</span> AI Panel</Link></li>
                    <li><Link to="/portfolio" className="hover:text-primary py-2 px-3 rounded-xl flex items-center gap-2"><span className="text-sm">💼</span> Portfolio</Link></li>
                    <li><Link to="/workflow" className="hover:text-primary py-2 px-3 rounded-xl flex items-center gap-2"><span className="text-sm">⚡</span> Workflow</Link></li>
                    <li><Link to="/digital-twin" className="hover:text-primary py-2 px-3 rounded-xl flex items-center gap-2"><span className="text-sm">🧬</span> Digital Twin</Link></li>
                    <li><Link to="/multimodal" className="hover:text-primary py-2 px-3 rounded-xl flex items-center gap-2"><span className="text-sm">🎬</span> Multimodal</Link></li>
                    <li><Link to="/job-tracker" className="hover:text-primary py-2 px-3 rounded-xl flex items-center gap-2"><span className="text-sm">💼</span> Job Tracker</Link></li>
                    <li><Link to="/market-intel" className="hover:text-primary py-2 px-3 rounded-xl flex items-center gap-2"><span className="text-sm">📊</span> Market Intel</Link></li>
                  </ul>
                </div>
              </li>
            )}
          </ul>
        </div>
        <div className="navbar-end gap-2 sm:gap-3">
          <button
            onClick={toggleTheme}
            className="btn btn-ghost btn-sm rounded-xl p-2.5 flex items-center justify-center transition-all duration-300 hover:bg-base-content/5 border border-transparent hover:border-base-content/10"
            title={`Switch to ${theme === "night" ? "Light" : "Dark"} Mode`}
          >
            {theme === "night" ? (
              <FaSun className="text-amber-400 rotate-0 transition-transform duration-500 scale-110 hover:rotate-45" />
            ) : (
              <FaMoon className="text-indigo-600 rotate-0 transition-transform duration-500 scale-110 hover:-rotate-12" />
            )}
          </button>

          <Link to="/jobs" className="btn btn-ghost btn-sm hidden md:flex hover:bg-base-content/5 border border-transparent hover:border-base-content/10 rounded-xl">
            🎯 Find Jobs
          </Link>
          <Link to="/dashboard" className="btn btn-theme-inverse hover:scale-105 active:scale-95 transition-all rounded-xl btn-sm px-4">
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Navbar;