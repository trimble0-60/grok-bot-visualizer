import type { Edge } from '@xyflow/react';
import type { EdgeKind } from './types';

export const RING = 60;

export interface EndBox {
  x: number;
  y: number;
  w: number;
  h: number;
  mode: 'avatar' | 'rect';
  count: number;
}

export type EdgeRoute = 'line' | 'curve' | 'return' | 'gutter' | 'spine' | 'over' | 'channel';

export interface RoutedEdgeData {
  kind: EdgeKind;
  label: string;
  color: string;
  curve: boolean;
  returnLane?: boolean;
  route?: EdgeRoute;
  gutterX?: number;
  channelX?: number;
  spineX?: number;
  riseX?: number;
  topY?: number;
  endBias?: number;
  sourceBox: EndBox;
  targetBox: EndBox;
  path?: string;
  labelX?: number;
  labelY?: number;
  [key: string]: unknown;
}

interface Point {
  x: number;
  y: number;
}

interface Segment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface BuiltPath {
  d: string;
  segments: Segment[];
}

const fmt = (value: number) => (Math.round(value * 10) / 10).toString();

function focus(box: EndBox): { x: number; y: number; rx: number; ry: number } {
  if (box.mode === 'avatar') {
    const step = RING - 12;
    const group = RING + Math.max(0, box.count - 1) * step;
    return {
      x: box.x + box.w / 2,
      y: box.y + RING / 2,
      rx: group / 2 + 5,
      ry: RING / 2 + 5,
    };
  }
  return {
    x: box.x + box.w / 2,
    y: box.y + box.h / 2,
    rx: box.w / 2 + 4,
    ry: box.h / 2 + 4,
  };
}

function outlinePoint(box: EndBox, toward: Point): Point {
  const spot = focus(box);
  const dx = toward.x - spot.x;
  const dy = toward.y - spot.y;
  if (box.mode === 'avatar') {
    const scale = Math.hypot(dx / spot.rx, dy / spot.ry) || 1;
    return { x: spot.x + dx / scale, y: spot.y + dy / scale };
  }
  const tx = dx === 0 ? Infinity : spot.rx / Math.abs(dx);
  const ty = dy === 0 ? Infinity : spot.ry / Math.abs(dy);
  const t = Math.min(tx, ty);
  return { x: spot.x + dx * t, y: spot.y + dy * t };
}

function simplify(points: Point[]): Point[] {
  const deduped: Point[] = [];
  for (const point of points) {
    const prev = deduped[deduped.length - 1];
    if (!prev || Math.hypot(point.x - prev.x, point.y - prev.y) >= 0.8) deduped.push(point);
  }
  if (deduped.length <= 2) return deduped;
  const out = [deduped[0]];
  for (let i = 1; i < deduped.length - 1; i += 1) {
    const a = out[out.length - 1];
    const b = deduped[i];
    const c = deduped[i + 1];
    const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
    if (Math.abs(cross) >= 1) out.push(b);
  }
  out.push(deduped[deduped.length - 1]);
  return out;
}

function segmentsOf(points: Point[]): Segment[] {
  const segments: Segment[] = [];
  for (let i = 1; i < points.length; i += 1) {
    segments.push({ x1: points[i - 1].x, y1: points[i - 1].y, x2: points[i].x, y2: points[i].y });
  }
  return segments;
}

function roundedPath(points: Point[], radius = 16): BuiltPath {
  const simplified = simplify(points);
  const segments = segmentsOf(simplified);
  if (simplified.length < 2) return { d: '', segments };
  if (simplified.length === 2) {
    const [start, end] = simplified;
    return { d: `M ${fmt(start.x)} ${fmt(start.y)} L ${fmt(end.x)} ${fmt(end.y)}`, segments };
  }
  const parts = [`M ${fmt(simplified[0].x)} ${fmt(simplified[0].y)}`];
  for (let i = 1; i < simplified.length - 1; i += 1) {
    const prev = simplified[i - 1];
    const curr = simplified[i];
    const next = simplified[i + 1];
    const inLen = Math.hypot(curr.x - prev.x, curr.y - prev.y) || 1;
    const outLen = Math.hypot(next.x - curr.x, next.y - curr.y) || 1;
    const bend = Math.min(radius, inLen / 2, outLen / 2);
    if (bend < 2) {
      parts.push(`L ${fmt(curr.x)} ${fmt(curr.y)}`);
      continue;
    }
    const inX = (curr.x - prev.x) / inLen;
    const inY = (curr.y - prev.y) / inLen;
    const outX = (next.x - curr.x) / outLen;
    const outY = (next.y - curr.y) / outLen;
    const enter = { x: curr.x - inX * bend, y: curr.y - inY * bend };
    const exit = { x: curr.x + outX * bend, y: curr.y + outY * bend };
    parts.push(`L ${fmt(enter.x)} ${fmt(enter.y)} Q ${fmt(curr.x)} ${fmt(curr.y)} ${fmt(exit.x)} ${fmt(exit.y)}`);
  }
  const last = simplified[simplified.length - 1];
  parts.push(`L ${fmt(last.x)} ${fmt(last.y)}`);
  return { d: parts.join(' '), segments };
}

function linePath(source: EndBox, target: EndBox): BuiltPath {
  const start = outlinePoint(source, focus(target));
  const end = outlinePoint(target, focus(source));
  return roundedPath([start, end]);
}

function curvePath(source: EndBox, target: EndBox): BuiltPath {
  const start = outlinePoint(source, focus(target));
  const end = outlinePoint(target, focus(source));
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.hypot(dx, dy) || 1;
  let px = -dy / len;
  let py = dx / len;
  if (py > 0) {
    px = -px;
    py = -py;
  }
  const bow = Math.min(96, 42 + len * 0.22);
  const cx = (start.x + end.x) / 2 + px * bow;
  const cy = (start.y + end.y) / 2 + py * bow;
  return {
    d: `M ${fmt(start.x)} ${fmt(start.y)} Q ${fmt(cx)} ${fmt(cy)} ${fmt(end.x)} ${fmt(end.y)}`,
    segments: [{ x1: start.x, y1: start.y, x2: cx, y2: cy }, { x1: cx, y1: cy, x2: end.x, y2: end.y }],
  };
}

function returnPath(source: EndBox, target: EndBox): BuiltPath {
  const targetSide = outlinePoint(target, focus(source));
  const sourceSide = outlinePoint(source, focus(target));
  const dx = sourceSide.x - targetSide.x;
  const dy = sourceSide.y - targetSide.y;
  const len = Math.hypot(dx, dy) || 1;
  const gap = 36;
  const nx = (dy / len) * gap;
  const ny = (-dx / len) * gap;
  const start = { x: sourceSide.x + nx, y: sourceSide.y + ny };
  const end = { x: targetSide.x + nx, y: targetSide.y + ny };
  return roundedPath([start, end]);
}

function gutterPath(source: EndBox, target: EndBox, gutterX: number, endBias: number): BuiltPath {
  const sourceFocus = focus(source);
  const targetFocus = focus(target);
  const start = outlinePoint(source, { x: source.x + source.w + 140, y: sourceFocus.y });
  const end = outlinePoint(target, { x: target.x - 140, y: targetFocus.y + endBias });
  const exitX = Math.max(start.x + 12, source.x + source.w + 18);
  return roundedPath([
    start,
    { x: exitX, y: start.y },
    { x: gutterX, y: start.y },
    { x: gutterX, y: end.y },
    end,
  ]);
}

function channelPath(source: EndBox, target: EndBox, channelX: number): BuiltPath {
  const sourceFocus = focus(source);
  const targetFocus = focus(target);
  const start = outlinePoint(source, { x: source.x + source.w + 80, y: sourceFocus.y });
  const end = outlinePoint(target, { x: target.x - 80, y: targetFocus.y });
  return roundedPath([
    start,
    { x: channelX, y: start.y },
    { x: channelX, y: end.y },
    end,
  ]);
}

function spinePath(source: EndBox, target: EndBox, spineX: number): BuiltPath {
  const sourceFocus = focus(source);
  const start = outlinePoint(source, { x: source.x - 40, y: sourceFocus.y });
  const end = outlinePoint(target, { x: target.x - 40, y: target.y + 16 });
  return roundedPath([
    start,
    { x: spineX, y: start.y },
    { x: spineX, y: end.y },
    end,
  ]);
}

function overPath(source: EndBox, target: EndBox, riseX: number, topY: number): BuiltPath {
  const sourceFocus = focus(source);
  const targetFocus = focus(target);
  const start = outlinePoint(source, { x: source.x + source.w + 80, y: sourceFocus.y });
  const end = outlinePoint(target, { x: targetFocus.x, y: target.y - 40 });
  return roundedPath([
    start,
    { x: riseX, y: start.y },
    { x: riseX, y: topY },
    { x: end.x, y: topY },
    end,
  ]);
}

function dataOf(edge: Edge): RoutedEdgeData {
  return (edge.data ?? {}) as RoutedEdgeData;
}

function buildRoute(data: RoutedEdgeData): BuiltPath {
  const source = data.sourceBox;
  const target = data.targetBox;
  if (!source || !target) return { d: '', segments: [] };
  const route = data.route ?? (data.returnLane ? 'return' : data.curve ? 'curve' : 'line');
  if (route === 'gutter' && data.gutterX != null) return gutterPath(source, target, data.gutterX, data.endBias ?? 0);
  if (route === 'channel' && data.channelX != null) return channelPath(source, target, data.channelX);
  if (route === 'spine' && data.spineX != null) return spinePath(source, target, data.spineX);
  if (route === 'over' && data.riseX != null && data.topY != null) return overPath(source, target, data.riseX, data.topY);
  if (route === 'return') return returnPath(source, target);
  if (route === 'curve') return curvePath(source, target);
  return linePath(source, target);
}

function measureLabel(text: string): { w: number; h: number } {
  return { w: Math.ceil(text.length * 6.7 + 22), h: 28 };
}

function overlapAmount(a: Rect, b: Rect): number {
  const width = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const height = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  if (width <= 0 || height <= 0) return 0;
  return width * height;
}

function segmentHitsRect(seg: Segment, rect: Rect): boolean {
  const len = Math.hypot(seg.x2 - seg.x1, seg.y2 - seg.y1);
  const steps = Math.max(2, Math.ceil(len / 8));
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const x = seg.x1 + (seg.x2 - seg.x1) * t;
    const y = seg.y1 + (seg.y2 - seg.y1) * t;
    if (x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h) return true;
  }
  return false;
}

function inflate(rect: Rect, pad: number): Rect {
  return { x: rect.x - pad, y: rect.y - pad, w: rect.w + pad * 2, h: rect.h + pad * 2 };
}

function fractions(len: number): number[] {
  const values = new Set<number>([0.5, 0.36, 0.64]);
  if (len > 90) {
    values.add(0.24);
    values.add(0.76);
  }
  if (len > 180) {
    const step = 46 / len;
    for (let t = 0.18; t <= 0.82; t += step) values.add(Math.round(t * 100) / 100);
  }
  return [...values].filter((t) => t > 0.14 && t < 0.86);
}

function placeLabels(
  items: { id: string; label: string; segments: Segment[] }[],
  obstacles: Rect[],
  foreign: { id: string; segments: Segment[] }[],
): Map<string, Point> {
  const placed: Rect[] = [];
  const positions = new Map<string, Point>();
  const ordered = [...items].sort((a, b) => b.label.length - a.label.length || a.id.localeCompare(b.id));
  for (const item of ordered) {
    const size = measureLabel(item.label);
    let best: { x: number; y: number; score: number } | null = null;
    for (const seg of item.segments) {
      const len = Math.hypot(seg.x2 - seg.x1, seg.y2 - seg.y1);
      if (len < 24) continue;
      const px = -(seg.y2 - seg.y1) / len;
      const py = (seg.x2 - seg.x1) / len;
      for (const t of fractions(len)) {
        const x = seg.x1 + (seg.x2 - seg.x1) * t;
        const y = seg.y1 + (seg.y2 - seg.y1) * t;
        for (const offset of [18, -18, 34, -34, 52, -52, 74, -74]) {
          const point = { x: x + px * offset, y: y + py * offset };
          const box = { x: point.x - size.w / 2, y: point.y - size.h / 2, w: size.w, h: size.h };
          let score = Math.abs(offset) * 0.35 + Math.abs(t - 0.48) * 18 - Math.min(len, 520) * 0.03;
          if (box.y < 2 || box.x < -8) score += 400;
          for (const obstacle of obstacles) {
            const amount = overlapAmount(box, inflate(obstacle, 6));
            if (amount > 0) score += 8000 + amount;
          }
          for (const other of placed) {
            const amount = overlapAmount(inflate(box, 4), other);
            if (amount > 0) score += 1200 + amount;
          }
          for (const other of foreign) {
            if (other.id === item.id) continue;
            for (const otherSeg of other.segments) {
              if (segmentHitsRect(otherSeg, box)) score += 12;
            }
          }
          if (!best || score < best.score) best = { x: point.x, y: point.y, score };
        }
      }
    }
    if (!best) {
      const seg = item.segments[0];
      best = seg
        ? { x: (seg.x1 + seg.x2) / 2, y: (seg.y1 + seg.y2) / 2 - 16, score: 0 }
        : { x: 0, y: 0, score: 0 };
    }
    positions.set(item.id, { x: best.x, y: best.y });
    placed.push({ x: best.x - size.w / 2, y: best.y - size.h / 2, w: size.w, h: size.h });
  }
  return positions;
}

function sameBox(a: EndBox | undefined, b: EndBox | undefined): boolean {
  if (!a || !b) return false;
  return a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h;
}

export function applyEdgePaths(edges: Edge[]): Edge[] {
  const built = edges.map((edge) => {
    const data = dataOf(edge);
    return { edge, data, geometry: buildRoute(data) };
  });
  const obstacles: Rect[] = [];
  for (const item of built) {
    for (const box of [item.data.sourceBox, item.data.targetBox]) {
      if (!box || obstacles.some((obstacle) => obstacle.x === box.x && obstacle.y === box.y && obstacle.w === box.w && obstacle.h === box.h)) {
        continue;
      }
      obstacles.push({ x: box.x, y: box.y, w: box.w, h: box.h });
    }
  }
  const labeled = built
    .filter((item) => item.data.label?.trim())
    .map((item) => ({ id: item.edge.id, label: item.data.label, segments: item.geometry.segments }));
  const foreign = built.map((item) => ({ id: item.edge.id, segments: item.geometry.segments }));
  const positions = placeLabels(labeled, obstacles, foreign);
  return built.map(({ edge, data, geometry }) => {
    const spot = positions.get(edge.id);
    const fallback = geometry.segments[0];
    return {
      ...edge,
      interactionWidth: 14,
      data: {
        ...data,
        path: geometry.d,
        labelX: spot?.x ?? (fallback ? (fallback.x1 + fallback.x2) / 2 : 0),
        labelY: spot?.y ?? (fallback ? (fallback.y1 + fallback.y2) / 2 - 14 : 0),
      },
    };
  });
}

export interface RouteAudit {
  crossings: string[];
  labelNodeOverlaps: string[];
  labelLabelOverlaps: string[];
}

export function auditRoutedEdges(edges: Edge[]): RouteAudit {
  const built = edges.map((edge) => ({ edge, data: dataOf(edge), geometry: buildRoute(dataOf(edge)) }));
  const boxes: EndBox[] = [];
  for (const item of built) {
    for (const box of [item.data.sourceBox, item.data.targetBox]) {
      if (box && !boxes.some((itemBox) => sameBox(itemBox, box))) boxes.push(box);
    }
  }
  const crossings = new Set<string>();
  for (const item of built) {
    for (const seg of item.geometry.segments) {
      const len = Math.hypot(seg.x2 - seg.x1, seg.y2 - seg.y1);
      const steps = Math.max(2, Math.ceil(len / 12));
      for (let i = 1; i < steps; i += 1) {
        const t = i / steps;
        const x = seg.x1 + (seg.x2 - seg.x1) * t;
        const y = seg.y1 + (seg.y2 - seg.y1) * t;
        for (const box of boxes) {
          if (sameBox(box, item.data.sourceBox) || sameBox(box, item.data.targetBox)) continue;
          if (x > box.x + 8 && x < box.x + box.w - 8 && y > box.y + 8 && y < box.y + box.h - 8) {
            crossings.add(item.edge.id);
          }
        }
      }
    }
  }
  const labels = built
    .filter((item) => item.data.label?.trim())
    .map((item) => {
      const size = measureLabel(item.data.label);
      const x = Number(item.data.labelX ?? 0);
      const y = Number(item.data.labelY ?? 0);
      return { id: item.edge.id, box: { x: x - size.w / 2, y: y - size.h / 2, w: size.w, h: size.h } };
    });
  const labelNodeOverlaps = labels
    .filter((label) => boxes.some((box) => overlapAmount(label.box, inflate(box, 2)) > 0))
    .map((label) => label.id);
  const labelLabelOverlaps: string[] = [];
  for (let i = 0; i < labels.length; i += 1) {
    for (let j = i + 1; j < labels.length; j += 1) {
      if (overlapAmount(inflate(labels[i].box, 2), labels[j].box) > 0) {
        labelLabelOverlaps.push(`${labels[i].id} :: ${labels[j].id}`);
      }
    }
  }
  return { crossings: [...crossings], labelNodeOverlaps, labelLabelOverlaps };
}
