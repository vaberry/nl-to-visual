import { create } from "zustand";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/types";

interface DiagramStore {
  prompt: string;
  model: "claude-sonnet-4-6" | "claude-haiku-4-5";
  temperature: number;
  layoutDirection: "TB" | "LR" | "BT" | "RL";
  isGenerating: boolean;
  error: string | null;
  excalidrawAPI: ExcalidrawImperativeAPI | null;
  currentElements: ExcalidrawElement[];

  setPrompt: (prompt: string) => void;
  setModel: (model: "claude-sonnet-4-6" | "claude-haiku-4-5") => void;
  setTemperature: (temp: number) => void;
  setLayoutDirection: (dir: "TB" | "LR" | "BT" | "RL") => void;
  setExcalidrawAPI: (api: ExcalidrawImperativeAPI) => void;
  setElements: (elements: ExcalidrawElement[]) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setError: (error: string | null) => void;
  clearCanvas: () => void;
}

export const useStore = create<DiagramStore>((set) => ({
  prompt: "",
  model: "claude-sonnet-4-6",
  temperature: 0.3,
  layoutDirection: "TB",
  isGenerating: false,
  error: null,
  excalidrawAPI: null,
  currentElements: [],

  setPrompt: (prompt) => set({ prompt }),
  setModel: (model) => set({ model }),
  setTemperature: (temp) => set({ temperature: temp }),
  setLayoutDirection: (dir) => set({ layoutDirection: dir }),
  setExcalidrawAPI: (api) => set({ excalidrawAPI: api }),
  setElements: (elements) => set({ currentElements: elements }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setError: (error) => set({ error }),
  clearCanvas: () => {
    set((state) => {
      state.excalidrawAPI?.resetScene();
      return { currentElements: [] };
    });
  },
}));
