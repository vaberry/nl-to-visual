# Excalidraw NLP: Natural Language to Diagram Generator

The best-in-class natural language to Excalidraw visual generator. Eliminates overlapping/data-integrity failures by separating **semantic generation** (LLM) from **spatial positioning** (deterministic layout engine).

## Architecture

```
User Prompt
    ↓
[Claude Sonnet 4.6] → Graph Structure (nodes + edges, no coordinates)
    ↓
[dagre Layout Engine] → Deterministic x/y positioning (guaranteed non-overlap)
    ↓
[Converter] → Full Excalidraw JSON with bindings
    ↓
Canvas Update (imperative API, no re-renders)
```

This decoupling is the key to reliability. The LLM handles semantics; dagre handles spatial math.

## Quick Start

### 1. Setup

```bash
cd ~/Desktop/excalidraw-nlp
cp .env.example .env
```

Edit `.env` and add your Anthropic API key:
```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

### 2. Run

```bash
npm run dev
```

Open http://localhost:3000

### 3. Generate a Diagram

1. **Left Panel (20%)**: Enter a description like `"Draw a login flow with email verification"`
2. **Select Model**: Claude Sonnet 4.6 (best quality, slower) or Haiku 4.5 (fast, less complex)
3. **Adjust Parameters**: Temperature (0.0–1.0), Layout (TB/LR/BT/RL)
4. **Click Generate**
5. **Right Panel (80%)**: Excalidraw canvas updates with non-overlapping diagram

### Example Prompts

- `"Draw a microservices architecture for an e-commerce platform"`
- `"Create a decision tree for password reset flow"`
- `"Design a data pipeline from sources to warehouse"`
- `"Show a UML class hierarchy for a game engine"`

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js 15 (App Router) | Built-in API routes, zero-config deployment |
| Canvas | @excalidraw/excalidraw v0.18 | Official package, battle-tested |
| Layout Engine | @dagrejs/dagre | Deterministic graph layout, no overlaps |
| LLM SDK | Vercel AI SDK v6 | Streaming structured output with Zod schema |
| LLM | Claude Sonnet 4.6 | Best structured JSON fidelity |
| State | Zustand | Simple, imperative API ref management |
| Styling | Tailwind CSS | Ships with Next.js |

## File Structure

```
app/
├── api/generate/route.ts           # LLM API endpoint (streamObject)
├── components/
│   ├── LeftPanel.tsx               # Prompt input, controls
│   └── ExcalidrawCanvas.tsx        # Dynamic Excalidraw embed
├── lib/
│   ├── schema.ts                   # Zod graph structure
│   ├── layout.ts                   # dagre layout computation
│   ├── converter.ts                # Graph → Excalidraw JSON
│   ├── store.ts                    # Zustand state
│   └── prompts.ts                  # System prompt for LLM
├── page.tsx                        # Two-column layout (20/80)
└── globals.css                     # Tailwind base styles
```

## Key Design Patterns

### 1. LLM Outputs Graph, Not Coordinates

The LLM schema requires:
```json
{
  "nodes": [
    { "id": "login", "label": "Login", "shape": "rectangle", "color": "#a5d8ff" }
  ],
  "edges": [
    { "from": "login", "to": "verify" }
  ]
}
```

Never x/y coordinates — the deterministic layout engine computes them.

### 2. Two-Way Arrow Bindings

For each arrow, both the arrow and the source/target shapes must reference each other:
```ts
arrow.startBinding = { elementId: fromNodeId, ... }
fromNode.boundElements.push({ id: arrow.id, type: "arrow" })
```

Missing either direction breaks silently.

### 3. Imperative Canvas Updates (No Re-renders)

```ts
excalidrawAPI.updateScene({ elements });
excalidrawAPI.scrollToContent(elements, { animate: true, fitToContent: true });
```

Never pass `elements` as a React prop to `<Excalidraw>`. Use the imperative API only.

## Customization

### Change LLM Model

Edit `app/api/generate/route.ts`:
```ts
const modelMap: Record<string, string> = {
  "claude-sonnet-4-6": "claude-3-5-sonnet-20241022",
  "claude-haiku-4-5": "claude-3-5-haiku-20241022",
  "gpt-4o": "gpt-4o",  // add if OPENAI_API_KEY set
};
```

### Adjust System Prompt

Edit `app/lib/prompts.ts` — this controls how the LLM interprets diagrams (semantic shapes, colors, layout hints).

### Change Layout Algorithm

Edit `app/lib/layout.ts` — currently uses dagre with:
- `rankdir: "TB"` (top-to-bottom, user-configurable)
- `nodesep: 80` (horizontal gap)
- `ranksep: 100` (vertical gap)

Tweak these for tighter/looser diagrams.

### Adjust Shape Dimensions

In `app/lib/layout.ts`, change:
```ts
const nodeWidth = 160;
const nodeHeight = 60;
```

Larger values = more spacious diagrams.

## Performance Notes

- **Max 30 nodes recommended** — the system prompt enforces this
- **Layout computation** is instant (dagre is O(n) in practice)
- **Rendering** scales linearly with element count
- **Streaming** shows partial JSON as it arrives (Vercel AI SDK)

For larger diagrams, have the LLM break them into sub-components.

## Troubleshooting

### "API key is required"
- Make sure `.env` has `ANTHROPIC_API_KEY=sk-ant-...`
- Restart `npm run dev` after changing `.env`

### Arrows don't connect
- Check the browser console for errors
- Verify node IDs in edges match existing node IDs exactly
- The system prompt should prevent this, but it's the #1 source of issues

### Text overlaps or cuts off
- The bound text system has auto-sizing built in
- If labels are too long, edit the prompt to use shorter labels
- Adjust `fontSize` in `app/lib/converter.ts`

### Diagram is too tight/loose
- Change `nodesep`, `ranksep` in `app/lib/layout.ts`
- Or change `nodeWidth`, `nodeHeight` in the same file

### Canvas renders blank
- Excalidraw requires the parent div to have explicit height
- Check that `<div style={{ height: "100%", width: "100%" }}>` is set in ExcalidrawCanvas
- Verify browser console for errors

## Research Document

See `/Users/vinceberry/Desktop/excalidraw-reference.md` for a complete technical deep dive into Excalidraw's rendering pipeline, element schema, and programmatic generation patterns.

## Future Enhancements

**Phase 2 (Quality):**
- Two-stage LLM with auditor loop (DiagrammerGPT approach)
- Element-by-element streaming visualization
- Export to PNG/SVG

**Phase 3 (Features):**
- History/undo panel with snapshots
- Multi-diagram projects
- Collaboration support
- Custom CSS theming

## References

- [Excalidraw Docs](https://docs.excalidraw.com/)
- [Excalidraw GitHub](https://github.com/excalidraw/excalidraw)
- [dagre Documentation](https://dagrejs.github.io/project/dagre/)
- [Vercel AI SDK](https://ai-sdk.vercel.dev/)
- [Claude API](https://platform.claude.com/)
- [DiagrammerGPT Paper](https://diagrammergpt.github.io/) — two-stage LLM diagram generation

---

Made with 🔮 for deterministic, beautiful diagrams from natural language.
