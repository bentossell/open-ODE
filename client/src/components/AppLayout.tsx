import React from "react";
import Sidebar from "./Sidebar";
import MainChat from "./MainChat";

export default function AppLayout() {
  return (
    <div className="flex w-full h-screen overflow-hidden">
      <Sidebar />
      <MainChat />
    </div>
  );
}