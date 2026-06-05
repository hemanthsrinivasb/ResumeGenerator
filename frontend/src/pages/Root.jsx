import React from "react";
import { Outlet } from "react-router";
import Navbar from "../components/Navbar";

function Root() {
  return (
    <div className="relative min-h-screen">
      <div className="bg-mesh" />
      <Navbar />
      <main className="py-6">
        <Outlet />
      </main>
    </div>
  );
}

export default Root;