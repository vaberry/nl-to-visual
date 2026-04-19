import type { ExcalidrawElement } from "@excalidraw/excalidraw/types";
import type { Graph, GraphSchema } from "./schema";
import type { LayoutNode, LayoutEdge } from "./layout";

function randomInt(): number {
  return Math.floor(Math.random() * 0xffffffff);
}

function getColorForShape(
  shape: string
): { stroke: string; background: string } {
  // Default neutral colors
  return {
    stroke: "#1e1e1e",
    background: "#a5d8ff",
  };
}

function parseColor(colorStr?: string): string {
  if (!colorStr) return "#a5d8ff";
  // Accept hex colors
  if (colorStr.startsWith("#")) return colorStr;
  // Named colors fallback
  const colors: Record<string, string> = {
    blue: "#a5d8ff",
    yellow: "#fff4a3",
    green: "#a3f5c3",
    red: "#ffc9c9",
    orange: "#ffd8a8",
    purple: "#e6d9f6",
  };
  return colors[colorStr] || "#a5d8ff";
}

export function graphToExcalidrawElements(
  graph: Graph,
  layout: Map<string, LayoutNode>,
  edgeLayout: Map<string, LayoutEdge>
): ExcalidrawElement[] {
  const elements: ExcalidrawElement[] = [];
  const now = Date.now();
  const nodeIdMap = new Map<string, string>();

  // Create nodes with text
  graph.nodes.forEach((node) => {
    const layoutNode = layout.get(node.id);
    if (!layoutNode) return;

    const excalidrawId = `node-${node.id}`;
    const textId = `text-${node.id}`;
    nodeIdMap.set(node.id, excalidrawId);

    const { stroke, background } = getColorForShape(node.shape);
    const bgColor = parseColor(node.color) || background;

    // Shape element
    const shapeElement: ExcalidrawElement = {
      id: excalidrawId,
      type: node.shape as "rectangle" | "ellipse" | "diamond",
      x: layoutNode.x,
      y: layoutNode.y,
      width: layoutNode.width,
      height: layoutNode.height,
      angle: 0,
      strokeColor: stroke,
      backgroundColor: bgColor,
      fillStyle: "solid",
      strokeWidth: 2,
      strokeStyle: "solid",
      roughness: 1,
      opacity: 100,
      seed: randomInt(),
      version: 1,
      versionNonce: randomInt(),
      isDeleted: false,
      groupIds: [],
      frameId: null,
      boundElements: [{ id: textId, type: "text" }],
      updated: now,
      link: null,
      locked: false,
      index: null,
      roundness:
        node.shape === "rectangle"
          ? { type: 3 }
          : node.shape === "diamond"
            ? { type: 2 }
            : null,
      roughness: 0,
    };

    // Text element (bound to shape)
    const textElement: ExcalidrawElement = {
      id: textId,
      type: "text",
      x: layoutNode.x + 10,
      y: layoutNode.y + layoutNode.height / 2 - 10,
      width: layoutNode.width - 20,
      height: 20,
      angle: 0,
      strokeColor: stroke,
      backgroundColor: "transparent",
      fillStyle: "solid",
      strokeWidth: 2,
      strokeStyle: "solid",
      roughness: 1,
      opacity: 100,
      seed: randomInt(),
      version: 1,
      versionNonce: randomInt(),
      isDeleted: false,
      groupIds: [],
      frameId: null,
      boundElements: null,
      updated: now,
      link: null,
      locked: false,
      index: null,
      roundness: null,
      text: node.label,
      originalText: node.label,
      fontSize: 14,
      fontFamily: 5, // Excalifont
      textAlign: "center",
      verticalAlign: "middle",
      containerId: excalidrawId,
      autoResize: false,
      lineHeight: 1.25,
      roughness: 0,
    } as any;

    elements.push(shapeElement);
    elements.push(textElement);
  });

  // Create arrows
  const rankdir = graph.layout || "TB";
  const isVertical = rankdir === "TB" || rankdir === "BT";

  graph.edges.forEach((edge) => {
    const fromId = nodeIdMap.get(edge.from);
    const toId = nodeIdMap.get(edge.to);
    if (!fromId || !toId) return;

    const fromLayout = layout.get(edge.from);
    const toLayout = layout.get(edge.to);
    if (!fromLayout || !toLayout) return;

    // Calculate arrow position based on layout direction
    const sourceNode = graph.nodes.find(n => n.id === edge.from);
    const isSourceDecision = sourceNode?.shape === "diamond";

    let startX: number, startY: number, endX: number, endY: number;
    let startFixedPoint: [number, number], endFixedPoint: [number, number];

    if (isVertical) {
      // TB/BT: default bottom-center → top-center
      endX = toLayout.x + toLayout.width / 2;
      endY = toLayout.y;
      endFixedPoint = [0.5, 0.0];

      // For decision nodes, vary start based on edge label
      if (isSourceDecision && edge.label) {
        if (edge.label.toLowerCase() === "yes") {
          // "yes" → exit right
          startX = fromLayout.x + fromLayout.width;
          startY = fromLayout.y + fromLayout.height / 2;
          startFixedPoint = [1.0, 0.5];
        } else if (edge.label.toLowerCase() === "no") {
          // "no" → exit bottom
          startX = fromLayout.x + fromLayout.width / 2;
          startY = fromLayout.y + fromLayout.height;
          startFixedPoint = [0.5, 1.0];
        } else {
          // Other labels → exit bottom
          startX = fromLayout.x + fromLayout.width / 2;
          startY = fromLayout.y + fromLayout.height;
          startFixedPoint = [0.5, 1.0];
        }
      } else {
        // Non-decision nodes → exit bottom
        startX = fromLayout.x + fromLayout.width / 2;
        startY = fromLayout.y + fromLayout.height;
        startFixedPoint = [0.5, 1.0];
      }
    } else {
      // LR/RL: default right-center → left-center
      startX = fromLayout.x + fromLayout.width;
      startY = fromLayout.y + fromLayout.height / 2;
      startFixedPoint = [1.0, 0.5];
      endX = toLayout.x;
      endY = toLayout.y + toLayout.height / 2;
      endFixedPoint = [0.0, 0.5];
    }

    const dx = endX - startX;
    const dy = endY - startY;

    // Try to use dagre edge waypoints for better routing paths
    const edgeKey = `${edge.from}-${edge.to}`;
    const edgeRoute = edgeLayout.get(edgeKey);

    let points: [number, number][];
    let finalStartX = startX;
    let finalStartY = startY;
    let finalEndX = endX;
    let finalEndY = endY;

    if (edgeRoute && edgeRoute.points.length >= 2) {
      // Convert dagre global points to arrow-local coordinates
      const origin = edgeRoute.points[0];
      points = edgeRoute.points.map((p) => [
        p.x - origin.x,
        p.y - origin.y,
      ] as [number, number]);
      finalStartX = origin.x;
      finalStartY = origin.y;
      finalEndX = edgeRoute.points[edgeRoute.points.length - 1].x;
      finalEndY = edgeRoute.points[edgeRoute.points.length - 1].y;
    } else {
      // Fallback: use fixedPoint-based coordinates
      points = [[0, 0], [dx, dy]];
    }

    // Calculate width/height from points span
    const allX = points.map((p) => p[0]);
    const allY = points.map((p) => p[1]);
    const minX = Math.min(...allX);
    const maxX = Math.max(...allX);
    const minY = Math.min(...allY);
    const maxY = Math.max(...allY);
    const width = Math.max(1, maxX - minX);
    const height = Math.max(1, maxY - minY);

    // Adjust points to be relative to the final element position
    const adjustedPoints = points.map((p) => [p[0] - minX, p[1] - minY] as [number, number]);

    const arrowId = `arrow-${edge.from}-${edge.to}`;
    const arrowElement: ExcalidrawElement = {
      id: arrowId,
      type: "arrow",
      x: finalStartX + minX,
      y: finalStartY + minY,
      width,
      height,
      angle: 0,
      strokeColor: "#1e1e1e",
      backgroundColor: "transparent",
      fillStyle: "solid",
      strokeWidth: 2,
      strokeStyle: edge.style || "solid",
      roughness: 0,
      opacity: 100,
      seed: randomInt(),
      version: 1,
      versionNonce: randomInt(),
      isDeleted: false,
      groupIds: [],
      frameId: null,
      boundElements: edge.label ? [{ id: `arrow-label-${arrowId}`, type: "text" }] : null,
      updated: now,
      link: null,
      locked: false,
      index: null,
      roundness: null,
      points: adjustedPoints,
      startBinding: {
        elementId: fromId,
        fixedPoint: startFixedPoint,
        mode: "orbit" as const,
      },
      endBinding: {
        elementId: toId,
        fixedPoint: endFixedPoint,
        mode: "orbit" as const,
      },
      startArrowhead: null,
      endArrowhead: edge.arrowhead || "arrow",
      elbowed: true,
    } as any;

    elements.push(arrowElement);

    // Add bound element references to shape nodes
    const fromShapeElement = elements.find((e) => e.id === fromId);
    const toShapeElement = elements.find((e) => e.id === toId);

    if (fromShapeElement && fromShapeElement.boundElements) {
      fromShapeElement.boundElements.push({ id: arrowId, type: "arrow" });
    }
    if (toShapeElement && toShapeElement.boundElements) {
      toShapeElement.boundElements.push({ id: arrowId, type: "arrow" });
    }

    // Add edge label if present
    if (edge.label) {
      const labelId = `arrow-label-${arrowId}`;
      const midX = startX + dx / 2;
      const midY = startY + dy / 2;
      const labelElement: ExcalidrawElement = {
        id: labelId,
        type: "text",
        x: midX - 30,
        y: midY - 10,
        width: 60,
        height: 20,
        angle: 0,
        strokeColor: "#1e1e1e",
        backgroundColor: "transparent",
        fillStyle: "solid",
        strokeWidth: 2,
        strokeStyle: "solid",
        roughness: 0,
        opacity: 100,
        seed: randomInt(),
        version: 1,
        versionNonce: randomInt(),
        isDeleted: false,
        groupIds: [],
        frameId: null,
        boundElements: null,
        updated: now,
        link: null,
        locked: false,
        index: null,
        roundness: null,
        text: edge.label,
        originalText: edge.label,
        fontSize: 12,
        fontFamily: 5,
        textAlign: "center",
        verticalAlign: "middle",
        containerId: arrowId,
        autoResize: false,
        lineHeight: 1.25,
      } as any;

      elements.push(labelElement);
    }
  });

  return elements;
}
