import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter, Route, Routes, Navigate } from "react-router";
import { Toaster } from "react-hot-toast";

import Root           from "./pages/Root";
import Home           from "./pages/Home";
import About          from "./pages/About";
import Services       from "./pages/Services";
import Contact        from "./pages/Contact";
import GenerateResume from "./pages/GenerateResume";
import Login          from "./pages/Login";
import Register       from "./pages/Register";
import Dashboard      from "./pages/Dashboard";
import Jobs           from "./pages/Jobs";
import Analytics      from "./pages/Analytics";
import Interview      from "./pages/Interview";
import AgentPanel     from "./pages/AgentPanel";
import Portfolio      from "./pages/Portfolio";

import { isLoggedIn } from "./api/ResumeService";

// Redirect logged-in users away from login/register
const GuestRoute = ({ children }) =>
  isLoggedIn() ? <Navigate to="/dashboard" replace /> : children;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Toaster position="top-center" />
      <Routes>
        {/* Auth pages — no navbar wrapper */}
        <Route path="/login"    element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Main app with Navbar */}
        <Route path="/" element={<Root />}>
          <Route index           element={<Home />} />
          <Route path="about"    element={<About />} />
          <Route path="services" element={<Services />} />
          <Route path="contact"  element={<Contact />} />
          <Route path="generate-resume" element={<GenerateResume />} />
          <Route path="jobs"            element={<Jobs />} />
          <Route path="analytics"       element={<Analytics />} />
          <Route path="interview"       element={<Interview />} />
          <Route path="agents"          element={<AgentPanel />} />
          <Route path="portfolio"       element={<Portfolio />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
