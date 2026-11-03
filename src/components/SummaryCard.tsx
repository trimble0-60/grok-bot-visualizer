import { useState } from 'react';
import { AvatarRing, BotGlyph, ToolBadge } from './Marks';
import { toolNames, workflowCount } from '../theme';
import type { Workflow } from '../types';

export function SummaryCard({ workflow }: { workflow: Workflow }) {
  const [open, setOpen] = useState(false);
  const tools = toolNames(workflow);
  const lead = workflow.bots[0];
  return (
    <section className="summary-card" aria-label="Workflow summary">
      <div className="summary-heading">
        {lead ? (
          <AvatarRing size={36} mark={24} color={lead.color} title={lead.name}>
            <BotGlyph bot={lead} size={24} />
          </AvatarRing>
        ) : null}
        <h2>{workflow.title}</h2>
      </div>
      <p className="count">{workflow.summaryCount ?? workflowCount(workflow)}</p>
      <p className={open ? 'summary-copy is-open' : 'summary-copy'}>{workflow.description}</p>
      <div className="tools-row">
        <ToolBadge />
        <span>Tools</span>
        <span className="tools-count">{tools.length}</span>
      </div>
      {open && tools.length > 0 ? (
        <ul className="tool-list">
          {tools.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      ) : null}
      <button type="button" className="view-more" onClick={() => setOpen((value) => !value)}>
        {open ? 'View less' : 'View more'}
      </button>
    </section>
  );
}
