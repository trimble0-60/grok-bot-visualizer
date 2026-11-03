import { useEffect, useRef, useState } from 'react';
import { AvatarRing, BotGlyph, PersonGlyph, RoleIcon } from './Marks';
import type { Workflow } from '../types';

export function Header({
  workflows,
  workflow,
  onChange,
}: {
  workflows: Workflow[];
  workflow: Workflow;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const lead = workflow.bots[0];
  const people = workflow.people ?? [];

  useEffect(() => {
    const onPointer = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', onPointer);
    return () => window.removeEventListener('mousedown', onPointer);
  }, []);

  return (
    <div className="chrome">
      <header className="topbar">
        <div className="brand">
          <span className="logo" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="15" fill="#1c2433" stroke="#3a455c" />
              <polygon points="16,7 24,12 24,20 16,25 8,20 8,12" fill="none" stroke="#d5deee" strokeWidth="1.4" />
            </svg>
          </span>
          <h1>Visualizer</h1>
        </div>
        <button type="button" className="back-btn" aria-label="Back">
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M10 3.5 5.5 8 10 12.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="workflow-menu" ref={menuRef}>
          <button
            type="button"
            className="workflow-btn"
            aria-expanded={open}
            aria-haspopup="listbox"
            onClick={() => setOpen((value) => !value)}
          >
            {lead ? (
              <AvatarRing size={22} mark={14} color={lead.color} title={lead.name}>
                <BotGlyph bot={lead} size={14} />
              </AvatarRing>
            ) : null}
            <span>{workflow.title}</span>
            <svg width="12" height="12" viewBox="0 0 12 8" aria-hidden="true">
              <path d="M1 1.5 6 6.5 11 1.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
          {open ? (
            <ul className="workflow-list" role="listbox">
              {workflows.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={item.id === workflow.id}
                    onClick={() => {
                      onChange(item.id);
                      setOpen(false);
                    }}
                  >
                    {item.bots[0] ? (
                      <AvatarRing size={20} mark={13} color={item.bots[0].color}>
                        <BotGlyph bot={item.bots[0]} size={13} />
                      </AvatarRing>
                    ) : null}
                    {item.title}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="run-pill">
          <span>Run:</span> As written
        </div>
      </header>
      <div className="bot-row" aria-label="Bots in this workflow">
        {workflow.bots.map((bot) => (
          <div key={bot.id} className="bot-chip">
            <AvatarRing size={34} mark={22} color={bot.color} title={bot.name}>
              <BotGlyph bot={bot} size={22} />
            </AvatarRing>
            <strong>{bot.name}</strong>
            <RoleIcon name={bot.icon} />
          </div>
        ))}
        {people.map((person) => (
          <div key={person.id} className="bot-chip">
            <AvatarRing size={34} mark={22} color={person.color} title={person.name}>
              <PersonGlyph size={22} color={person.color} name={person.name} />
            </AvatarRing>
            <strong>{person.name}</strong>
            <RoleIcon name="person" />
          </div>
        ))}
      </div>
    </div>
  );
}
