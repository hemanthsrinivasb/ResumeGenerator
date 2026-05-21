import React from "react";
import { Outlet } from "react-router";
import Navbar from "../components/Navbar";
import ChatbotButton from "../components/Chatbot/ChatbotButton";
import ChatPanel from "../components/Chatbot/ChatPanel";

function Root() {
  return (
    <div>
      <Navbar />
      <Outlet />
      {/* Floating AI Career Coach — visible to logged-in users on all pages */}
      <ChatbotButton />
      <ChatPanel />
    </div>
  );
}

export default Root;