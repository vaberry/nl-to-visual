"use client";

import { LeftPanel } from "@/app/components/LeftPanel";
import { ExcalidrawCanvas } from "@/app/components/ExcalidrawCanvas";

export default function Home() {
  return (
    <div className="flex h-screen bg-white">
      {/* Left Panel (20%) */}
      <LeftPanel />

      {/* Right Panel (80%) - Excalidraw Canvas */}
      <div className="flex-1">
        <ExcalidrawCanvas />
      </div>
    </div>
  );
}
