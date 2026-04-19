import Graph from "@dagrejs/dagre";
import type { Graph as GraphType } from "./schema";

export interface LayoutNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutEdge {
  points: { x: number; y: number }[];
}

export interface LayoutResult {
  nodes: Map<string, LayoutNode>;
  edges: Map<string, LayoutEdge>;
}

export function computeLayout(graph: GraphType): LayoutResult {
  const g = new Graph.graphlib.Graph();

  const rankdir = (graph.layout || "TB") as
    | "TB"
    | "LR"
    | "BT"
    | "RL";

  g.setGraph({
    rankdir,
    nodesep: 80,
    edgesep: 20,
    ranksep: 100,
    marginx: 40,
    marginy: 40,
  });

  // Set default edge label object
  g.setDefaultEdgeLabel(() => ({}));

  // Add nodes to dagre graph
  const nodeWidth = 160;
  const nodeHeight = 60;

  graph.nodes.forEach((node) => {
    g.setNode(node.id, {
      width: nodeWidth,
      height: nodeHeight,
      label: node.id,
    });
  });

  // Add edges to dagre graph
  graph.edges.forEach((edge) => {
    g.setEdge(edge.from, edge.to);
  });

  // Run layout algorithm
  Graph.layout(g);

  // Extract positions
  const layout = new Map<string, LayoutNode>();
  g.nodes().forEach((nodeId) => {
    const node = g.node(nodeId);
    layout.set(nodeId, {
      id: nodeId,
      x: Math.round(node.x - node.width / 2),
      y: Math.round(node.y - node.height / 2),
      width: nodeWidth,
      height: nodeHeight,
    });
  });

  // Extract edge routes
  const edgeRoutes = new Map<string, LayoutEdge>();
  g.edges().forEach((e) => {
    const edgeData = g.edge(e);
    if (edgeData.points && edgeData.points.length > 0) {
      edgeRoutes.set(`${e.v}-${e.w}`, {
        points: edgeData.points.map((p) => ({
          x: Math.round(p.x),
          y: Math.round(p.y),
        })),
      });
    }
  });

  return { nodes: layout, edges: edgeRoutes };
}
