import { z } from "zod";

export const GraphSchema = z.object({
  title: z.string(),
  nodes: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      shape: z.enum(["rectangle", "ellipse", "diamond"]),
      color: z.string().optional(),
      description: z.string().optional(),
    })
  ),
  edges: z.array(
    z.object({
      from: z.string(),
      to: z.string(),
      label: z.string().optional(),
      style: z.enum(["solid", "dashed", "dotted"]).optional(),
      arrowhead: z.enum(["arrow", "none", "diamond"]).optional(),
    })
  ),
  layout: z.enum(["TB", "LR", "BT", "RL"]).optional(),
});

export type Graph = z.infer<typeof GraphSchema>;
