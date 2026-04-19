# Setup Instructions

## Prerequisites

- Node.js 18+ (check with `node --version`)
- npm 9+ (check with `npm --version`)
- Anthropic API key (get at https://console.anthropic.com)

## Step 1: Configure Environment Variables

```bash
cd ~/Desktop/excalidraw-nlp
cp .env.example .env
```

Edit `.env` and add your API key:
```
ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
```

**Do NOT commit `.env` to git** — it contains secrets.

## Step 2: Install Dependencies

Dependencies are already installed in this scaffold, but if you need to reinstall:

```bash
npm install
```

## Step 3: Run the Development Server

```bash
npm run dev
```

You'll see:
```
  ▲ Next.js 15.0.0
  ▲ Local: http://localhost:3000
```

Open http://localhost:3000 in your browser.

## Step 4: Generate Your First Diagram

1. **Left Panel** — Enter a prompt:
   ```
   Draw a login flow with email verification and 2FA
   ```

2. **Select Model** — Choose Claude Sonnet 4.6 (best quality) or Haiku 4.5 (fastest)

3. **Adjust Parameters** (optional):
   - **Temperature**: 0.0–1.0 (lower = more consistent structure)
   - **Layout**: TB (top-to-bottom), LR (left-to-right), etc.

4. **Click "Generate Diagram"**

5. **Right Panel** — The Excalidraw canvas will auto-populate with a non-overlapping diagram in ~2–5 seconds.

## Troubleshooting

### "ANTHROPIC_API_KEY is not set"
- You didn't create or edit `.env` properly
- After editing, restart the server: `Ctrl+C` then `npm run dev`

### "Cannot generate diagram"
- Check the browser console (F12) for error messages
- Verify your API key is valid at https://console.anthropic.com
- Make sure you have API credits/quota

### Canvas is blank
- Check the browser console for errors
- Verify the prompt is non-empty
- Try a simpler prompt: `"Draw a simple flowchart"`

### Arrows don't connect to shapes
- This is the LLM's fault — it's creating node IDs that don't match edge references
- The system prompt should prevent this, but try:
  1. Increase `temperature` to 0.5 for more variation
  2. Try a different model (Haiku vs Sonnet)
  3. Make your prompt more explicit: `"Create 3 nodes: login, verify, success. Arrow from login to verify, then verify to success"`

### Too many overlaps / diagram is messy
- Decrease the number of nodes: the prompt suggests max 30
- Try: `"Create a simplified version with only the key steps"`
- Increase `nodesep` and `ranksep` in `app/lib/layout.ts`

## Building for Production

```bash
npm run build
npm start
```

This creates an optimized build in `.next/`. The app will run on http://localhost:3000 and is ready to deploy to Vercel, AWS, or any Node.js host.

## Development Tips

### Hot Reload
- Changing files in `app/` will auto-reload in the browser
- Changing `.env` requires restarting the server

### TypeScript
- Type errors will show in the terminal and browser console
- Fix them before submitting — TypeScript helps catch bugs early

### Browser DevTools
- Open F12 to see console logs and network requests
- The Network tab shows your API calls to `/api/generate`

## Architecture Quick Reference

```
Request Flow:
  User Types Prompt in Left Panel
    ↓
  [POST /api/generate] with prompt + model + temperature
    ↓
  [Claude Sonnet 4.6] streams structured JSON (Graph schema)
    ↓
  [dagre Layout Engine] computes deterministic x/y positioning
    ↓
  [Converter] transforms to full Excalidraw JSON with bindings
    ↓
  [Excalidraw Canvas] updates imperatively (no React re-renders)
```

## Next Steps

1. **Play with different prompts** — try flowcharts, architecture diagrams, decision trees
2. **Customize the system prompt** — edit `app/lib/prompts.ts` to change LLM behavior
3. **Adjust layout parameters** — edit `nodesep`/`ranksep` in `app/lib/layout.ts` for spacing
4. **Experiment with models** — try Claude Haiku 4.5 for speed vs Sonnet for quality

## Reference

- **Full Technical Reference**: `/Users/vinceberry/Desktop/excalidraw-reference.md`
- **Implementation Plan**: `/Users/vinceberry/.claude/plans/okay-here-s-the-deal-gentle-hamster.md`
- **Excalidraw Docs**: https://docs.excalidraw.com/
- **Claude API Docs**: https://platform.claude.com/docs/build-with-claude
