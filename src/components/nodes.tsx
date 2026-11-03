import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { AvatarGroup, OutputIcon, SlashedIcon, ToolBadge } from './Marks';
import { useHighlight } from './highlight';
import { nodeSize, type AvatarRef } from '../theme';
import type { WorkflowNode } from '../types';

export interface FlowNodeData {
  node: WorkflowNode;
  owners: AvatarRef[];
  frame?: { width: number; height: number };
  [key: string]: unknown;
}

export type FlowGraphNode = Node<FlowNodeData, WorkflowNode['type']>;

function PageIcon({ name }: { name: string }) {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  if (name === 'press') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="5" width="16" height="14" rx="2" {...common} />
        <path d="M8 9h8M8 13h5" {...common} />
      </svg>
    );
  }
  if (name === 'contact') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="8" r="3" {...common} />
        <path d="M5 19c1.2-3 3.4-4.5 7-4.5S17.8 16 19 19" {...common} />
      </svg>
    );
  }
  if (name === 'sponsors') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 11V7a4 4 0 0 1 8 0v4" {...common} />
        <rect x="5" y="11" width="14" height="8" rx="1.5" {...common} />
      </svg>
    );
  }
  if (name === 'mentors') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="8" cy="9" r="2.2" {...common} />
        <circle cx="16" cy="9" r="2.2" {...common} />
        <path d="M4.5 18c.6-2.2 2-3.3 3.5-3.3S11 15.8 11.5 18M12.5 18c.6-2.2 2-3.3 3.5-3.3S19 15.8 19.5 18" {...common} />
      </svg>
    );
  }
  if (name === 'sheet') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="5" y="4" width="14" height="16" rx="1.5" {...common} />
        <path d="M5 9h14M5 14h14M10 9v11" {...common} />
      </svg>
    );
  }
  if (name === 'dashboard') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="4" width="7" height="7" rx="1.2" {...common} />
        <rect x="13" y="4" width="7" height="4" rx="1.2" {...common} />
        <rect x="13" y="10" width="7" height="10" rx="1.2" {...common} />
        <rect x="4" y="13" width="7" height="7" rx="1.2" {...common} />
      </svg>
    );
  }
  if (name === 'report') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 4h7l4 4v12H7V4Z" {...common} />
        <path d="M14 4v4h4M9 13h6M9 17h4" {...common} />
      </svg>
    );
  }
  if (name === 'slides') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="5" width="18" height="12" rx="1.5" {...common} />
        <path d="M12 17v3M8 20h8" {...common} />
      </svg>
    );
  }
  if (name === 'newsletter') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 6h14v12H5V6Z" {...common} />
        <path d="m5 7 7 6 7-6" {...common} />
      </svg>
    );
  }
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="7" {...common} />
      <path d="M12 8v4l3 2" {...common} />
    </svg>
  );
}

export function StepNode({ id, data, selected }: NodeProps<FlowGraphNode>) {
  const { node, owners } = data;
  const { hotNodes, dimming } = useHighlight();
  const dim = dimming && !hotNodes.has(id) ? 'is-dimmed' : '';
  const lead = owners[0];
  const size = data.frame ?? nodeSize(node);

  if (node.type === 'start') {
    if (!node.title) return <div className={dim} style={{ width: size.width, height: size.height }} />;
    return (
      <div className={`trigger ${selected ? 'is-selected' : ''} ${dim}`} style={{ width: size.width, height: size.height }}>
        <Handle id="right" type="source" position={Position.Right} />
        <Handle id="top" type="source" position={Position.Top} />
        <span>{node.title}</span>
      </div>
    );
  }

  if (node.type === 'page' || node.type === 'hub') {
    return (
      <div
        className={`page-tile ${node.type === 'hub' ? 'is-hub' : ''} ${selected ? 'is-selected' : ''} ${dim}`}
        style={{ width: size.width, height: size.height }}
        aria-label={`${node.title}. ${node.summary}`}
      >
        <Handle id="left" type="target" position={Position.Left} />
        <Handle id="top-in" type="target" position={Position.Top} />
        <Handle id="right" type="source" position={Position.Right} />
        <span className="page-icon">
          <PageIcon name={node.icon ?? 'hub'} />
        </span>
        <span className="terminal-copy">
          <span className="terminal-title">{node.title}</span>
          <span className="terminal-sub">{node.summary}</span>
        </span>
      </div>
    );
  }

  if (node.type === 'output' || node.type === 'early-exit') {
    const early = node.type === 'early-exit';
    return (
      <div
        className={`terminal ${early ? 'is-early' : 'is-output'} ${selected ? 'is-selected' : ''} ${dim}`}
        style={{ width: size.width, height: size.height }}
        aria-label={`${node.title}. ${node.summary}`}
      >
        <Handle id="left" type="target" position={Position.Left} />
        <Handle id="top-in" type="target" position={Position.Top} />
        <Handle id="right" type="source" position={Position.Right} />
        <Handle id="top" type="source" position={Position.Top} />
        <span className="terminal-icon">{early ? <SlashedIcon /> : <OutputIcon />}</span>
        <span className="terminal-copy">
          <span className="terminal-title">{node.title}</span>
          <span className="terminal-sub">{node.summary}</span>
        </span>
      </div>
    );
  }

  return (
    <div
      className={`bot-node ${selected ? 'is-selected' : ''} ${dim}`}
      style={{ width: size.width, height: size.height }}
      aria-label={`${lead?.name ?? node.title}. ${node.summary}`}
    >
      <Handle id="left" type="target" position={Position.Left} style={{ top: 30 }} />
      <Handle id="top-in" type="target" position={Position.Top} />
      <div className="glyph-wrap">
        <AvatarGroup people={owners} ring={60} mark={38} />
        {node.usesTool ? <ToolBadge /> : null}
      </div>
      <div className="bot-node-name">{lead?.name ?? node.title}</div>
      <div className="bot-node-role">{node.summary}</div>
      {node.tools && node.tools.length > 0 ? (
        <div className="tool-pills">
          {node.tools.map((tool) => (
            <span key={tool} className="tool-pill">
              {tool}
            </span>
          ))}
        </div>
      ) : null}
      <Handle id="right" type="source" position={Position.Right} style={{ top: 30 }} />
      <Handle id="top" type="source" position={Position.Top} />
    </div>
  );
}
