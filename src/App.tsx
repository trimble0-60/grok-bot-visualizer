import { useEffect, useMemo, useState } from 'react';
import { DetailPanel } from './components/DetailPanel';
import { FlowCanvas } from './components/FlowCanvas';
import { Header } from './components/Header';
import { Legend } from './components/Legend';
import { SummaryCard } from './components/SummaryCard';
import { loadWorkflows } from './loadWorkflows';

export function App() {
  const workflows = useMemo(() => loadWorkflows(), []);
  const [workflowId, setWorkflowId] = useState(workflows[0]?.id ?? '');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const workflow = workflows.find((item) => item.id === workflowId) ?? workflows[0];

  useEffect(() => {
    setSelectedId(null);
  }, [workflowId]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    document.title = workflow ? `${workflow.title} · Visualizer` : 'Grok Bot Visualizer';
  }, [workflow]);

  if (!workflow) {
    return (
      <div className="empty">
        <h1>Visualizer</h1>
        <p>No workflows found. Add a JSON file to the workflows folder.</p>
      </div>
    );
  }

  const selected = workflow.nodes.find((node) => node.id === selectedId) ?? null;

  return (
    <div className="app">
      <Header workflows={workflows} workflow={workflow} onChange={setWorkflowId} />
      <Legend />
      <div className="stage">
        <FlowCanvas workflow={workflow} selectedId={selectedId} onSelect={setSelectedId} />
        <SummaryCard workflow={workflow} />
        {selected ? (
          <DetailPanel workflow={workflow} node={selected} onClose={() => setSelectedId(null)} />
        ) : null}
      </div>
    </div>
  );
}
