"use client";

import { Excalidraw } from "@excalidraw/excalidraw";
import { useEffect, useRef } from "react";
import { useStore } from "@/app/lib/store";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

export default function ExcalidrawContent() {
  const { currentElements, setExcalidrawAPI } = useStore();
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);

  console.log("✓ ExcalidrawContent: current elements count =", currentElements.length);

  // When elements change, update the scene (triggers A* routing)
  useEffect(() => {
    if (!apiRef.current) return;
    if (currentElements.length === 0) return;

    console.log("✓ Updating scene with", currentElements.length, "elements");
    apiRef.current.updateScene({ elements: currentElements });
    apiRef.current.scrollToContent(currentElements, {
      animate: false,
      fitToContent: true,
    });
  }, [currentElements]);

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <Excalidraw
        excalidrawAPI={(api) => {
          apiRef.current = api;
          setExcalidrawAPI(api);
          console.log("✓ Excalidraw API initialized");
        }}
        initialData={{ appState: { zoom: { value: 1 } } }}
        onChange={() => {}}
        zenModeEnabled={false}
        viewModeEnabled={false}
        gridModeEnabled={true}
      />
    </div>
  );
}
