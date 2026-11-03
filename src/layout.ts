import dagre from '@dagrejs/dagre';
import { MarkerType, type Edge } from '@xyflow/react';
import type { FlowGraphNode } from './components/nodes';
import { applyEdgePaths, RING, type EndBox, type RoutedEdgeData } from './edgeGeometry';
import { nodeSize, ownersOf, senderColor } from './theme';
import type { EdgeKind, Workflow, WorkflowNode } from './types';

function anchorY(node: WorkflowNode): number {
  if (node.type === 'task' || node.type === 'approval') return RING / 2;
  return nodeSize(node).height / 2;
}

function edgeWeight(kind: EdgeKind): number {
  if (kind === 'asks-and-waits') return 0.2;
  if (kind === 'only-when') return 1;
  return 3;
}

function nodeData(workflow: Workflow, node: WorkflowNode) {
  const vertical = workflow.direction === 'TB';
  return { node, owners: ownersOf(node, workflow), frame: nodeSize(node, vertical) };
}

function fallback(workflow: Workflow): FlowGraphNode[] {
  const vertical = workflow.direction === 'TB';
  return workflow.nodes.map((node, index) => {
    const size = nodeSize(node, vertical);
    return {
      id: node.id,
      type: node.type,
      position: { x: index * (size.width + 72), y: 0 },
      data: nodeData(workflow, node),
      draggable: false,
      style: { width: size.width, height: size.height },
    };
  });
}

export function layoutWorkflow(workflow: Workflow): {
  nodes: FlowGraphNode[];
  edges: Edge[];
} {
  if (workflow.direction === 'HUB') return layoutHub(workflow);
  const vertical = workflow.direction === 'TB';
  const nodeIds = new Set(workflow.nodes.map((node) => node.id));
  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({
    rankdir: vertical ? 'TB' : 'LR',
    nodesep: vertical ? 72 : 64,
    ranksep: vertical ? 156 : 180,
    marginx: 12,
    marginy: 16,
    ranker: 'network-simplex',
  });

  for (const node of workflow.nodes) {
    const size = nodeSize(node, vertical);
    graph.setNode(node.id, size);
  }

  const edges = workflow.edges.filter((edge) => {
    const ok = nodeIds.has(edge.from) && nodeIds.has(edge.to);
    if (!ok) console.warn(`Skipping edge ${edge.from} -> ${edge.to} in ${workflow.id}`);
    return ok;
  });

  const seenPairs = new Set<string>();
  for (const edge of edges) {
    const key = [edge.from, edge.to].sort().join('::');
    const back = seenPairs.has(key);
    seenPairs.add(key);
    graph.setEdge(edge.from, edge.to, { weight: back ? 0.05 : edgeWeight(edge.kind), minlen: 1 });
  }

  try {
    dagre.layout(graph);
  } catch (error) {
    console.error(error);
    const recovered = fallback(workflow);
    return { nodes: recovered, edges: applyEdgePaths(toFlowEdges(workflow, edges, recovered)) };
  }

  const nodes: FlowGraphNode[] = workflow.nodes.map((node) => {
    const placed = graph.node(node.id);
    const size = nodeSize(node, vertical);
    const x = placed && Number.isFinite(placed.x) ? placed.x - size.width / 2 : 0;
    const y = placed && Number.isFinite(placed.y) ? placed.y - anchorY(node) : 0;
    return {
      id: node.id,
      type: node.type,
      position: { x, y },
      data: nodeData(workflow, node),
      draggable: false,
      style: { width: size.width, height: size.height },
    };
  });

  return { nodes, edges: applyEdgePaths(toFlowEdges(workflow, edges, nodes)) };
}

function endBox(node: WorkflowNode | undefined, at: { x: number; y: number } | undefined, vertical: boolean): EndBox {
  if (!node) return { x: 0, y: 0, w: 40, h: 40, mode: 'rect', count: 1 };
  const size = nodeSize(node, vertical);
  return {
    x: at?.x ?? 0,
    y: at?.y ?? 0,
    w: size.width,
    h: size.height,
    mode: node.type === 'task' || node.type === 'approval' ? 'avatar' : 'rect',
    count: Math.max(1, node.owners.length),
  };
}

function toFlowEdges(workflow: Workflow, edges: Workflow['edges'], placed: FlowGraphNode[]): Edge[] {
  const vertical = workflow.direction === 'TB';
  const byId = new Map(workflow.nodes.map((node) => [node.id, node]));
  const at = new Map(placed.map((node) => [node.id, node.position]));
  const pairCount = new Map<string, number>();
  for (const edge of edges) {
    const key = [edge.from, edge.to].sort().join('::');
    pairCount.set(key, (pairCount.get(key) ?? 0) + 1);
  }
  let returnOrdinal = 0;
  return edges.map((edge, index) => {
    const target = byId.get(edge.to);
    const from = at.get(edge.from);
    const to = at.get(edge.to);
    const upward = (from?.y ?? 0) > (to?.y ?? 0) + 24;
    const reciprocal = (pairCount.get([edge.from, edge.to].sort().join('::')) ?? 0) > 1;
    const returnLane = reciprocal && upward;
    const curve = edge.kind === 'asks-and-waits' || target?.type === 'early-exit' || returnLane;
    const color = senderColor(byId.get(edge.from), workflow);
    const bow = returnLane ? 52 + returnOrdinal++ * 28 : 0;
    const route = returnLane ? 'return' : curve ? 'curve' : 'line';
    const data: RoutedEdgeData = {
      kind: edge.kind,
      label: edge.label,
      color,
      curve,
      returnLane,
      bow,
      route,
      sourceBox: endBox(byId.get(edge.from), at.get(edge.from), vertical),
      targetBox: endBox(byId.get(edge.to), at.get(edge.to), vertical),
    };
    return {
      id: `${edge.from}->${edge.to}:${index}`,
      source: edge.from,
      target: edge.to,
      sourceHandle: curve ? 'top' : 'right',
      targetHandle: curve ? 'top-in' : 'left',
      type: 'flow',
      zIndex: 1,
      interactionWidth: 14,
      ariaLabel: edge.label ? `${edge.label}` : `Connection from ${edge.from} to ${edge.to}`,
      data,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 13,
        height: 13,
        color: '#d7e2f2',
      },
    };
  });
}

function layoutHub(workflow: Workflow): { nodes: FlowGraphNode[]; edges: Edge[] } {
  const starts = workflow.nodes.filter((node) => node.type === 'start');
  const actors = workflow.nodes.filter((node) => node.type === 'task' || node.type === 'approval');
  const hubNode = workflow.nodes.find((node) => node.type === 'hub');
  const pages = workflow.nodes.filter((node) => node.type === 'page');
  const claimed = new Set<string>([
    ...starts.map((node) => node.id),
    ...actors.map((node) => node.id),
    ...(hubNode ? [hubNode.id] : []),
    ...pages.map((node) => node.id),
  ]);
  const rest = workflow.nodes.filter((node) => !claimed.has(node.id));
  const byNode = new Map(workflow.nodes.map((node) => [node.id, node]));
  const pos = new Map<string, { x: number; y: number }>();
  const botX = 390;
  let botY = 80;
  for (const node of actors) {
    pos.set(node.id, { x: botX, y: botY });
    botY += nodeSize(node).height + 18;
  }
  const pageX = 1240;
  const hubSize = hubNode ? nodeSize(hubNode) : { width: 240, height: 118 };
  if (hubNode) pos.set(hubNode.id, { x: pageX, y: 48 });
  let pageY = hubNode ? 48 + hubSize.height + 24 : 48;
  for (const node of pages) {
    pos.set(node.id, { x: pageX, y: pageY });
    pageY += nodeSize(node).height + 14;
  }
  const usedStartY = new Set<number>();
  let fallbackY = 48;
  for (const node of starts) {
    const edge = workflow.edges.find((item) => item.from === node.id);
    const target = edge ? pos.get(edge.to) : undefined;
    let y = target ? target.y : fallbackY;
    while (usedStartY.has(y)) y += 52;
    usedStartY.add(y);
    pos.set(node.id, { x: 0, y });
    if (!target) fallbackY = y + nodeSize(node).height + 16;
  }
  let restY = Math.max(botY, pageY);
  for (const node of rest) {
    pos.set(node.id, { x: botX, y: restY });
    restY += nodeSize(node).height + 18;
  }

  const nodes: FlowGraphNode[] = [...starts, ...actors, ...(hubNode ? [hubNode] : []), ...pages, ...rest].map((node) => {
      const at = pos.get(node.id) ?? { x: 0, y: 0 };
      const size = nodeSize(node);
      return {
        id: node.id,
        type: node.type,
        position: at,
        data: nodeData(workflow, node),
        draggable: false,
        style: { width: size.width, height: size.height },
      };
    });

  const rawEdges = workflow.edges.filter((edge) => byNode.has(edge.from) && byNode.has(edge.to));
  const edges = toFlowEdges(workflow, rawEdges, nodes);
  const centerY = (id: string) => {
    const node = byNode.get(id);
    const at = pos.get(id);
    if (!node || !at) return 0;
    return at.y + (node.type === 'task' || node.type === 'approval' ? RING / 2 : nodeSize(node).height / 2);
  };
  const botRight = botX + 176;
  const riseX = botRight + 28;
  const gutterStart = botRight + 56;
  const spineX = pageX - 36;
  let channelLane = 0;
  for (const edge of edges) {
    const source = byNode.get(edge.source);
    const target = byNode.get(edge.target);
    if (source?.type !== 'start' || (target?.type !== 'task' && target?.type !== 'approval')) continue;
    if (Math.abs(centerY(edge.source) - centerY(edge.target)) <= 40) continue;
    const data = (edge.data ?? {}) as RoutedEdgeData;
    edge.data = { ...data, route: 'channel', channelX: botX - 40 - channelLane * 36 };
    channelLane += 1;
  }
  const overhead = edges.filter(
    (edge) => byNode.get(edge.target)?.type === 'page' && byNode.get(edge.source)?.type !== 'hub',
  );
  overhead.sort((a, b) => centerY(a.source) - centerY(b.source) || centerY(a.target) - centerY(b.target));
  const byTarget = new Map<string, Edge[]>();
  for (const edge of overhead) {
    const list = byTarget.get(edge.target) ?? [];
    list.push(edge);
    byTarget.set(edge.target, list);
  }
  overhead.forEach((edge, index) => {
    const siblings = byTarget.get(edge.target) ?? [edge];
    const slot = siblings.indexOf(edge);
    const data = (edge.data ?? {}) as RoutedEdgeData;
    edge.data = {
      ...data,
      route: 'gutter',
      gutterX: gutterStart + index * 32,
      endBias: (slot - (siblings.length - 1) / 2) * 14,
    };
  });
  for (const edge of edges) {
    const data = (edge.data ?? {}) as RoutedEdgeData;
    if (byNode.get(edge.target)?.type === 'hub') edge.data = { ...data, route: 'over', riseX, topY: 18 };
    if (byNode.get(edge.source)?.type === 'hub') edge.data = { ...data, route: 'spine', spineX };
  }
  nodes.unshift({
    id: 'pad-top',
    type: 'start',
    position: { x: 0, y: 0 },
    data: {
      node: {
        id: 'pad-top',
        type: 'start',
        owners: [],
        title: '',
        summary: '',
        steps: [],
        inputs: [],
        outputs: [],
        stopsForUser: false,
        usesTool: false,
      },
      owners: [],
      frame: { width: 8, height: 8 },
    },
    draggable: false,
    selectable: false,
    focusable: false,
    style: { width: 8, height: 8, opacity: 0, pointerEvents: 'none' },
  });
  return { nodes, edges: applyEdgePaths(edges) };
}

