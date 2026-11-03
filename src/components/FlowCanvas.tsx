import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  ReactFlow,
  useReactFlow,
  type NodeMouseHandler,
  type ReactFlowInstance,
} from '@xyflow/react';
import { brighten, FlowEdge, type FlowEdgeData, type FlowGraphEdge } from './edges';
import { HighlightProvider, type HighlightValue } from './highlight';
import { StepNode, type FlowGraphNode, type FlowNodeData } from './nodes';
import { layoutWorkflow } from '../layout';
import { nodeSize } from '../theme';
import type { Workflow } from '../types';

const nodeTypes = {
  start: StepNode,
  task: StepNode,
  approval: StepNode,
  output: StepNode,
  'early-exit': StepNode,
  page: StepNode,
  hub: StepNode,
};

const edgeTypes = { flow: FlowEdge };

function ReadableFit() {
  const { setViewport, getNodes } = useReactFlow();

  useEffect(() => {
    const fit = () => {
      const host = document.querySelector('.react-flow');
      if (!host) return;
      const width = host.clientWidth;
      const height = host.clientHeight;
      if (width < 40 || height < 40) return;
      const nodes = getNodes();
      if (!nodes.length) return;

      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (const node of nodes) {
        const fallback = nodeSize((node.data as FlowNodeData).node);
        const boxW = node.width && node.width > 20 ? node.width : fallback.width;
        const boxH = node.height && node.height > 20 ? node.height : fallback.height;
        minX = Math.min(minX, node.position.x);
        minY = Math.min(minY, node.position.y);
        maxX = Math.max(maxX, node.position.x + boxW);
        maxY = Math.max(maxY, node.position.y + boxH);
      }

      const pad = 28;
      const insetLeft = 280;
      const graphW = Math.max(1, maxX - minX);
      const graphH = Math.max(1, maxY - minY);
      const zoomW = (width - insetLeft - pad) / graphW;
      const zoomH = (height - pad * 2) / graphH;
      const zoom = Math.min(zoomW, zoomH, 1);
      const x = insetLeft - minX * zoom;
      const y = (height - graphH * zoom) / 2 - minY * zoom;
      setViewport({ x, y, zoom }, { duration: 0 });
    };

    const early = window.setTimeout(fit, 0);
    const late = window.setTimeout(fit, 120);
    window.addEventListener('resize', fit);
    return () => {
      window.clearTimeout(early);
      window.clearTimeout(late);
      window.removeEventListener('resize', fit);
    };
  }, [getNodes, setViewport]);

  return null;
}

function FocusSelection({ selectedId }: { selectedId: string | null }) {
  const { setCenter, getZoom, getNodes } = useReactFlow();

  useEffect(() => {
    if (!selectedId) return;
    const node = getNodes().find((item) => item.id === selectedId);
    if (!node) return;
    const panel = document.querySelector('.detail');
    const panelWidth = panel ? panel.getBoundingClientRect().width + 24 : 0;
    const size = nodeSize((node.data as FlowNodeData).node);
    const zoom = getZoom();
    const shift = panelWidth / (2 * zoom);
    setCenter(node.position.x + size.width / 2 + shift, node.position.y + size.height / 2, {
      zoom,
      duration: 280,
    });
    // Only recenter when the selection changes. getZoom/setCenter are stable store helpers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  return null;
}

function linkedIds(edges: FlowGraphEdge[], focus: { kind: 'edge' | 'node'; id: string } | null) {
  const hotEdges = new Set<string>();
  const hotNodes = new Set<string>();
  if (!focus || focus.id === 'pad-top') return { hotEdges, hotNodes, active: false };
  if (focus.kind === 'edge') {
    const edge = edges.find((item) => item.id === focus.id);
    if (!edge) return { hotEdges, hotNodes, active: false };
    hotEdges.add(edge.id);
    hotNodes.add(edge.source);
    hotNodes.add(edge.target);
    return { hotEdges, hotNodes, active: true };
  }
  hotNodes.add(focus.id);
  for (const edge of edges) {
    if (edge.source !== focus.id && edge.target !== focus.id) continue;
    hotEdges.add(edge.id);
    hotNodes.add(edge.source);
    hotNodes.add(edge.target);
  }
  return { hotEdges, hotNodes, active: hotEdges.size > 0 || hotNodes.size > 0 };
}

export function FlowCanvas({
  workflow,
  selectedId,
  onSelect,
}: {
  workflow: Workflow;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const { nodes, edges } = useMemo(() => layoutWorkflow(workflow), [workflow]);
  const flowEdges = edges as FlowGraphEdge[];
  const rfRef = useRef<ReactFlowInstance<FlowGraphNode, FlowGraphEdge> | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const leaveTimer = useRef<number | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);
  const [focusedEdge, setFocusedEdge] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [focusedNode, setFocusedNode] = useState<string | null>(null);
  const [pinnedEdge, setPinnedEdge] = useState<string | null>(null);

  useEffect(() => {
    setHoveredEdge(null);
    setFocusedEdge(null);
    setHoveredNode(null);
    setFocusedNode(null);
    setPinnedEdge(null);
  }, [workflow.id]);

  const armEdge = useCallback((id: string) => {
    if (leaveTimer.current) window.clearTimeout(leaveTimer.current);
    setHoveredEdge(id);
  }, []);

  const disarmEdge = useCallback((id: string) => {
    if (leaveTimer.current) window.clearTimeout(leaveTimer.current);
    leaveTimer.current = window.setTimeout(() => {
      setHoveredEdge((current) => (current === id ? null : current));
    }, 80);
  }, []);

  const pinEdge = useCallback(
    (id: string) => {
      setPinnedEdge(id);
      onSelect(null);
      rfRef.current?.setNodes((current) => current.map((node) => (node.selected ? { ...node, selected: false } : node)));
    },
    [onSelect],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPinnedEdge(null);
        setFocusedEdge(null);
        setFocusedNode(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const host = canvasRef.current;
    if (!host) return;
    const onFocusIn = (event: FocusEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const edge = target?.closest('.react-flow__edge');
      const node = target?.closest('.react-flow__node');
      if (edge) {
        setFocusedEdge(edge.getAttribute('data-id'));
        setFocusedNode(null);
        return;
      }
      if (node) {
        setFocusedNode(node.getAttribute('data-id'));
        setFocusedEdge(null);
      }
    };
    const onFocusOut = (event: FocusEvent) => {
      const next = event.relatedTarget instanceof Element ? event.relatedTarget : null;
      if (!next?.closest('.react-flow__edge')) setFocusedEdge(null);
      if (!next?.closest('.react-flow__node')) setFocusedNode(null);
    };
    host.addEventListener('focusin', onFocusIn);
    host.addEventListener('focusout', onFocusOut);
    return () => {
      host.removeEventListener('focusin', onFocusIn);
      host.removeEventListener('focusout', onFocusOut);
    };
  }, []);

  const highlight = useMemo(() => {
    const focus = hoveredEdge
      ? { kind: 'edge' as const, id: hoveredEdge }
      : focusedEdge
        ? { kind: 'edge' as const, id: focusedEdge }
        : hoveredNode
          ? { kind: 'node' as const, id: hoveredNode }
          : focusedNode
            ? { kind: 'node' as const, id: focusedNode }
            : selectedId
              ? { kind: 'node' as const, id: selectedId }
              : pinnedEdge
                ? { kind: 'edge' as const, id: pinnedEdge }
                : null;
    return linkedIds(flowEdges, focus);
  }, [flowEdges, hoveredEdge, focusedEdge, hoveredNode, focusedNode, selectedId, pinnedEdge]);

  const viewEdges = useMemo(() => {
    if (!highlight.active) return flowEdges;
    return flowEdges.map((edge) => {
      const hot = highlight.hotEdges.has(edge.id);
      const color = (edge.data as FlowEdgeData | undefined)?.color ?? '#d7e2f2';
      return {
        ...edge,
        zIndex: hot ? 40 : 1,
        className: hot ? 'is-hot' : 'is-dimmed',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: hot ? 16 : 13,
          height: hot ? 16 : 13,
          color: hot ? brighten(color) : '#d7e2f2',
        },
      };
    });
  }, [flowEdges, highlight]);

  const highlightValue = useMemo<HighlightValue>(
    () => ({
      hotEdges: highlight.hotEdges,
      hotNodes: highlight.hotNodes,
      dimming: highlight.active,
      armEdge,
      disarmEdge,
      pinEdge,
    }),
    [highlight, armEdge, disarmEdge, pinEdge],
  );

  const clearPin = () => {
    setPinnedEdge(null);
    setFocusedEdge(null);
    setFocusedNode(null);
    onSelect(null);
    const active = document.activeElement;
    if (
      (active instanceof HTMLElement || active instanceof SVGElement) &&
      active.closest('.react-flow__edge, .react-flow__node')
    ) {
      active.blur();
    }
  };

  const onNodeClick: NodeMouseHandler<FlowGraphNode> = (_, node) => {
    setPinnedEdge(null);
    onSelect(node.id);
  };

  return (
    <HighlightProvider value={highlightValue}>
      <div
        className="canvas"
        ref={canvasRef}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          const edge = event.target instanceof Element ? event.target.closest('.react-flow__edge') : null;
          if (!edge) return;
          event.preventDefault();
          const id = edge.getAttribute('data-id');
          if (id) pinEdge(id);
        }}
      >
        <ReactFlow
          key={workflow.id}
          nodes={nodes}
          edges={viewEdges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onInit={(instance) => {
            rfRef.current = instance;
          }}
          onNodeClick={onNodeClick}
          onNodeMouseEnter={(_, node) => {
            if (node.id !== 'pad-top') setHoveredNode(node.id);
          }}
          onNodeMouseLeave={() => setHoveredNode(null)}
          onEdgeMouseEnter={(_, edge) => armEdge(edge.id)}
          onEdgeMouseLeave={(_, edge) => disarmEdge(edge.id)}
          onEdgeClick={(_, edge) => pinEdge(edge.id)}
          onPaneClick={clearPin}
          nodesDraggable={false}
          nodesConnectable={false}
          edgesReconnectable={false}
          elementsSelectable
          edgesFocusable
          nodesFocusable
          zoomOnDoubleClick={false}
          deleteKeyCode={null}
          multiSelectionKeyCode={null}
          minZoom={0.28}
          maxZoom={1.4}
          colorMode="dark"
          proOptions={{ hideAttribution: true }}
          fitView={false}
        >
          <Background variant={BackgroundVariant.Dots} gap={22} size={1.15} color="#2a3346" />
          <Controls position="bottom-right" showFitView showInteractive={false} />
          <ReadableFit />
          <FocusSelection selectedId={selectedId} />
        </ReactFlow>
      </div>
    </HighlightProvider>
  );
}
