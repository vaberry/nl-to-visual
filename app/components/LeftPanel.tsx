"use client";

import { useState } from "react";
import { useStore } from "@/app/lib/store";
import { GraphSchema } from "@/app/lib/schema";
import { computeLayout } from "@/app/lib/layout";
import { graphToExcalidrawElements } from "@/app/lib/converter";
import type { Graph } from "@/app/lib/schema";

export function LeftPanel() {
  const {
    prompt,
    setPrompt,
    model,
    setModel,
    temperature,
    setTemperature,
    layoutDirection,
    setLayoutDirection,
    isGenerating,
    setIsGenerating,
    error,
    setError,
    excalidrawAPI,
    currentElements,
    setElements,
    clearCanvas,
  } = useStore();

  const [localPrompt, setLocalPrompt] = useState(prompt);
  const [localTemp, setLocalTemp] = useState(temperature);

  const handleGenerate = async () => {
    if (!localPrompt.trim()) {
      setError("Please enter a prompt");
      return;
    }

    setPrompt(localPrompt);
    setTemperature(localTemp);
    setError(null);
    setIsGenerating(true);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: localPrompt,
          temperature: localTemp,
          model,
          layoutDirection,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      let fullText = "";
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
      }

      // Parse the streamed JSON
      const graph: Graph = JSON.parse(fullText);
      console.log("✓ Parsed graph:", graph);
      GraphSchema.parse(graph); // Validate
      console.log("✓ Schema validation passed");

      const { nodes: layout, edges: edgeLayout } = computeLayout(graph);
      console.log("✓ Layout computed:", layout);
      const elements = graphToExcalidrawElements(graph, layout, edgeLayout);
      console.log("✓ Elements generated:", elements.length, "elements");
      setElements(elements);
      console.log("✓ Elements set in store");
      setError(null);
      console.log("✓ Diagram ready!");
    } catch (err) {
      setError(`Generation failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClear = () => {
    clearCanvas();
    setLocalPrompt("");
    setPrompt("");
    setError(null);
  };

  return (
    <div className="flex flex-col h-screen w-1/5 border-r border-gray-300 bg-gray-50 p-4 overflow-y-auto">
      <h1 className="text-xl font-bold mb-6">Excalidraw NLP</h1>

      {/* Prompt Input */}
      <div className="mb-4">
        <label className="block text-sm font-semibold mb-2">Diagram Description</label>
        <textarea
          value={localPrompt}
          onChange={(e) => setLocalPrompt(e.target.value)}
          placeholder="e.g., Draw a login flow with email verification"
          className="w-full h-32 p-2 border border-gray-300 rounded text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isGenerating}
        />
      </div>

      {/* Model Selector */}
      <div className="mb-4">
        <label className="block text-sm font-semibold mb-2">Model</label>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value as "claude-sonnet-4-6" | "claude-haiku-4-5")}
          className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isGenerating}
        >
          <option value="claude-sonnet-4-6">Claude Sonnet 4.6 (Best Quality)</option>
          <option value="claude-haiku-4-5">Claude Haiku 4.5 (Fast)</option>
        </select>
      </div>

      {/* Temperature Slider */}
      <div className="mb-4">
        <label className="block text-sm font-semibold mb-2">
          Temperature: {localTemp.toFixed(2)}
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={localTemp}
          onChange={(e) => setLocalTemp(parseFloat(e.target.value))}
          className="w-full"
          disabled={isGenerating}
        />
        <p className="text-xs text-gray-600 mt-1">Lower = more consistent, Higher = more creative</p>
      </div>

      {/* Layout Direction */}
      <div className="mb-4">
        <label className="block text-sm font-semibold mb-2">Layout</label>
        <select
          value={layoutDirection}
          onChange={(e) => setLayoutDirection(e.target.value as "TB" | "LR" | "BT" | "RL")}
          className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isGenerating}
        >
          <option value="TB">Top → Bottom</option>
          <option value="LR">Left → Right</option>
          <option value="BT">Bottom → Top</option>
          <option value="RL">Right → Left</option>
        </select>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating || !localPrompt.trim()}
        className="w-full py-2 px-4 mb-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
      >
        {isGenerating ? "Generating..." : "Generate Diagram"}
      </button>

      {/* Clear Button */}
      <button
        onClick={handleClear}
        disabled={isGenerating}
        className="w-full py-2 px-4 mb-4 bg-gray-400 text-white font-semibold rounded hover:bg-gray-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
      >
        Clear Canvas
      </button>

      {/* Error Display */}
      {error && (
        <div className="p-3 mb-4 bg-red-100 border border-red-400 rounded text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Stats */}
      {currentElements.length > 0 && (
        <div className="text-xs text-gray-600 mt-4 p-2 bg-gray-100 rounded">
          <p className="font-semibold mb-1">Canvas Stats:</p>
          <p>Elements: {currentElements.length}</p>
        </div>
      )}
    </div>
  );
}
