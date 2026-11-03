import { useEffect, useId, useState } from 'react';
import { BaseEdge, EdgeLabelRenderer, type Edge, type EdgeProps } from '@xyflow/react';
import type { EndBox } from '../edgeGeometry';
import type { EdgeKind } from '../types';
import { useHighlight } from './highlight';

export interface FlowEdgeData {
  kind: EdgeKind;
  label: string;
  color: string;
  curve: boolean;
  returnLane?: boolean;
  path?: string;
  labelX?: number;
  labelY?: number;
  sourceBox?: EndBox;
  targetBox?: EndBox;
  [key: string]: unknown;
}

export type FlowGraphEdge = Edge<FlowEdgeData, 'flow'>;

export function brighten(hex: string): string {
  const raw = hex.replace('#', '');
  if (raw.length !== 6) return hex;
  const channel = (index: number) => Number.parseInt(raw.slice(index, index + 2), 16);
  const mix = (value: number) => Math.round(value + (255 - value) * 0.28);
  const part = (value: number) => mix(value).toString(16).padStart(2, '0');
  return `#${part(channel(0))}${part(channel(2))}${part(channel(4))}`;
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

function dashFor(kind: EdgeKind, returnLane: boolean): string | undefined {
  if (returnLane) return '1.8 5.4';
  if (kind === 'only-when') return '6 5';
  return undefined;
}

export function FlowEdge({ id, data, markerEnd }: EdgeProps<FlowGraphEdge>) {
  const reduced = useReducedMotion();
  const { hotEdges, dimming, armEdge, disarmEdge, pinEdge } = useHighlight();
  const path = data?.path;
  if (!path) return null;

  const hot = hotEdges.has(id);
  const dimmed = dimming && !hot;
  const kind = data?.kind ?? 'always';
  const color = brighten(data?.color ?? '#d7e2f2');
  const labelX = data?.labelX ?? 0;
  const labelY = data?.labelY ?? 0;
  const dotId = useId();
  const duration = hot ? 1.05 : 2.8;
  const begins = hot ? [0, 0.26, 0.52, 0.78] : [0, 0.92, 1.84];

  return (
    <>
      <path
        d={path}
        fill="none"
        stroke="#05070c"
        strokeWidth={hot ? 4.6 : 3.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ pointerEvents: 'none' }}
      />
      {hot ? (
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeOpacity={0.35}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ pointerEvents: 'none' }}
        />
      ) : null}
      <BaseEdge
        path={path}
        markerEnd={markerEnd}
        interactionWidth={14}
        style={{
          stroke: hot ? color : '#d7e2f2',
          strokeWidth: hot ? 2.5 : 1.75,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          strokeDasharray: dashFor(kind, Boolean(data?.returnLane)),
        }}
      />
      <path d={path} fill="none" stroke="transparent" strokeWidth={14} className="edge-hit" />
      {reduced
        ? null
        : begins.map((begin) => (
            <circle key={`${dotId}-${begin}`} r={hot ? 2.6 : 2.15} fill={hot ? color : '#d7e2f2'} className="stream-dot">
              <animateMotion dur={`${duration}s`} begin={`${begin}s`} repeatCount="indefinite" path={path} />
            </circle>
          ))}
      {data?.label ? (
        <EdgeLabelRenderer>
          <div
            className={`edge-pill${hot ? ' is-hot' : ''}${dimmed ? ' is-dimmed' : ''}`}
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              borderColor: hot ? color : undefined,
              zIndex: hot ? 5 : 1,
            }}
            onMouseEnter={() => armEdge(id)}
            onMouseLeave={() => disarmEdge(id)}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              pinEdge(id);
            }}
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}
