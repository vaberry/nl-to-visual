"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useStore } from "@/app/lib/store";
import "@excalidraw/excalidraw/index.css";

const ExcalidrawContent = dynamic(
  () => import("./ExcalidrawContent"),
  { ssr: false }
);

export function ExcalidrawCanvas() {
  return (
    <div style={{ height: "100%", width: "100%" }}>
      <ExcalidrawContent />
    </div>
  );
}
