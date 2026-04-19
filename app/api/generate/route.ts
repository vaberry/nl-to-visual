import { streamObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { GraphSchema } from "@/app/lib/schema";
import { SYSTEM_PROMPT } from "@/app/lib/prompts";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { prompt, temperature, layoutDirection, model } = await req.json();

    if (!prompt) {
      return Response.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Map UI model names to actual model IDs
    const modelMap: Record<string, string> = {
      "claude-haiku-4-5": "claude-haiku-4-5-20251001",
      "claude-sonnet-4-6": "claude-sonnet-4-6",
    };
    const selectedModel = modelMap[model] ?? "claude-sonnet-4-6";

    const systemWithLayout = `${SYSTEM_PROMPT}\n\nLayout preference: Use "${layoutDirection}" layout for this diagram (top-bottom, left-right, etc).`;

    const result = await streamObject({
      model: anthropic(selectedModel),
      schema: GraphSchema,
      system: systemWithLayout,
      prompt,
      temperature: temperature || 0.3,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Generation error:", error);
    return Response.json(
      { error: "Failed to generate diagram" },
      { status: 500 }
    );
  }
}
