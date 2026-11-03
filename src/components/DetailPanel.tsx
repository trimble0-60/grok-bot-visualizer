import { AvatarRing, BotGlyph, OutputIcon, PersonGlyph, SlashedIcon, ToolBadge } from './Marks';
import { ownersOf } from '../theme';
import type { Workflow, WorkflowNode } from '../types';

export function DetailPanel({
  workflow,
  node,
  onClose,
}: {
  workflow: Workflow;
  node: WorkflowNode;
  onClose: () => void;
}) {
  const people = ownersOf(node, workflow);
  const lead = people[0];
  const bot = lead && !lead.person ? workflow.bots.find((item) => item.id === lead.id) : undefined;
  return (
    <aside className="detail" aria-label="Step detail">
      <div className="detail-top">
        <div className="identity">
          {node.type === 'output' ? (
            <span className="terminal-icon">
              <OutputIcon />
            </span>
          ) : node.type === 'early-exit' ? (
            <span className="terminal-icon">
              <SlashedIcon />
            </span>
          ) : lead?.person ? (
            <AvatarRing size={48} mark={32} color={lead.color} title={lead.name}>
              <PersonGlyph size={32} color={lead.color} name={lead.name} />
            </AvatarRing>
          ) : bot ? (
            <AvatarRing size={48} mark={32} color={bot.color} title={bot.name}>
              <BotGlyph bot={bot} size={32} />
            </AvatarRing>
          ) : null}
          <div>
            <div className="identity-kicker">{lead?.person ? 'Person' : lead ? 'Owner' : 'Step'}</div>
            <div className="identity-name">
              {lead?.person ? `${lead.name}, ${lead.role}` : (lead?.name ?? node.title)}
            </div>
          </div>
        </div>
        <button type="button" className="close-btn" onClick={onClose}>
          Close
        </button>
      </div>
      <h2 className="detail-title">{node.title}</h2>
      {node.usesTool || (node.tools && node.tools.length > 0) ? (
        <p className="tool-note">
          <ToolBadge /> {node.tools && node.tools.length > 0 ? node.tools.join(' · ') : 'Uses a tool'}
        </p>
      ) : null}
      {node.stopsForUser ? (
        <p className="stop-note">{lead?.person ? `${lead.name} acts here before this continues.` : 'A person acts here before this continues.'}</p>
      ) : null}
      <p className="detail-summary">{node.summary}</p>
      {node.cadence ? (
        <p className="detail-summary">How often: {node.cadence}</p>
      ) : null}
      {node.steps.length > 0 ? (
        <section className="detail-section">
          <h3>{node.type === 'page' || node.type === 'hub' ? "What's on this page" : node.appearsIn ? 'Tasks' : 'Steps'}</h3>
          <ol className="steps">
            {node.steps.map((step, index) => (
              <li key={step}>
                <span className="num">{index + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
      {node.appearsIn && node.appearsIn.length > 0 ? (
        <section className="detail-section">
          <h3>Workflows</h3>
          <ul>
            {node.appearsIn.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </section>
      ) : null}
      {node.inputs.length > 0 || node.outputs.length > 0 ? (
        <div className="io">
          {node.inputs.length > 0 ? (
            <section className="detail-section">
              <h3>{node.type === 'page' || node.type === 'hub' ? 'Updated by' : 'Receives'}</h3>
              <ul>
                {node.inputs.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ) : null}
          {node.outputs.length > 0 ? (
            <section className="detail-section">
              <h3>{node.type === 'page' || node.type === 'hub' ? 'Signed off' : 'Hands off'}</h3>
              <ul>
                {node.outputs.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      ) : null}
    </aside>
  );
}
