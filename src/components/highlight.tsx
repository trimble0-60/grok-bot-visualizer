import { createContext, useContext } from 'react';

export interface HighlightValue {
  hotEdges: ReadonlySet<string>;
  hotNodes: ReadonlySet<string>;
  dimming: boolean;
  armEdge: (id: string) => void;
  disarmEdge: (id: string) => void;
  pinEdge: (id: string) => void;
}

const noop = () => {};

const HighlightContext = createContext<HighlightValue>({
  hotEdges: new Set<string>(),
  hotNodes: new Set<string>(),
  dimming: false,
  armEdge: noop,
  disarmEdge: noop,
  pinEdge: noop,
});

export const HighlightProvider = HighlightContext.Provider;

export function useHighlight(): HighlightValue {
  return useContext(HighlightContext);
}
