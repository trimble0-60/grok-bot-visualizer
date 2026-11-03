import type { ReactNode } from 'react';
import type { AvatarRef } from '../theme';

export function AvatarRing({
  size,
  mark,
  color,
  title,
  children,
}: {
  size: number;
  mark: number;
  color?: string;
  title?: string;
  children: ReactNode;
}) {
  return (
    <span
      className="avatar-ring"
      title={title}
      style={{ width: size, height: size, ['--glow' as string]: color ?? 'transparent' }}
    >
      <span className="avatar-ring-mark" style={{ width: mark, height: mark }}>
        {children}
      </span>
    </span>
  );
}

export function AvatarGroup({
  people,
  ring,
  mark,
}: {
  people: AvatarRef[];
  ring: number;
  mark: number;
}) {
  return (
    <span className={people.length > 1 ? 'avatar-stack' : 'avatar-single'}>
      {people.map((person) => (
        <AvatarRing key={person.id} size={ring} mark={mark} color={person.color} title={person.name}>
          {person.person ? (
            <PersonGlyph size={mark} color={person.color} name={person.name} />
          ) : (
            <BotGlyph bot={{ name: person.name, avatar: person.avatar }} size={mark} />
          )}
        </AvatarRing>
      ))}
    </span>
  );
}

export function BotGlyph({
  bot,
  size = 28,
}: {
  bot: { name: string; avatar: string };
  size?: number;
}) {
  return (
    <img
      className="bot-avatar"
      src={bot.avatar}
      alt=""
      title={bot.name}
      width={size}
      height={size}
      style={{ width: size, height: size }}
    />
  );
}

export function PersonGlyph({ size = 28, color = '#E7C27A', name = 'Person' }: { size?: number; color?: string; name?: string }) {
  return (
    <svg className="person-glyph" width={size} height={size} viewBox="0 0 48 48" role="img" aria-label={name}>
      <circle cx="24" cy="16" r="8" fill={color} />
      <path d="M8 43c1.8-10 7-14.5 16-14.5S38.2 33 40 43" fill={color} />
    </svg>
  );
}

export function RoleIcon({ name, size = 12 }: { name: string; size?: number }) {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  let body: ReactNode;
  switch (name) {
    case 'compass':
      body = (
        <>
          <circle cx="8" cy="8" r="5.2" {...common} />
          <path d="m9.4 6.4-2.2 3.2 2.4-.6 1.2-2.6Z" fill="currentColor" stroke="none" />
        </>
      );
      break;
    case 'book':
      body = (
        <path
          d="M3 3.5h4.2c1.4 0 2.6.6 2.8 1.8V13c-.2-1-1.4-1.6-2.8-1.6H3V3.5Z M13 3.5H8.8C7.4 3.5 6.2 4.1 6 5.3V13c.2-1 1.4-1.6 2.8-1.6H13V3.5Z"
          {...common}
        />
      );
      break;
    case 'search':
      body = (
        <>
          <circle cx="7" cy="7" r="4" {...common} />
          <path d="m10.2 10.2 3 3" {...common} />
        </>
      );
      break;
    case 'inbox':
      body = <path d="M2.5 8.5 4.2 3.8h7.6l1.7 4.7v4.2H2.5V8.5Z M2.5 8.5h3l.7 1.4h3.6L10.5 8.5h3" {...common} />;
      break;
    case 'calendar':
      body = (
        <>
          <rect x="2.5" y="3.2" width="11" height="10" rx="1.4" {...common} />
          <path d="M2.5 6.2h11M5.2 2.2v2.2M10.8 2.2v2.2" {...common} />
        </>
      );
      break;
    case 'pen':
      body = <path d="m9.8 2.4 2.2 2.2L5.2 11.4 3 12.2l.8-2.2L9.8 2.4Z" {...common} />;
      break;
    case 'person':
      body = (
        <>
          <circle cx="8" cy="5.2" r="2.1" {...common} />
          <path d="M3.4 13.2c.6-2.6 2.2-3.8 4.6-3.8s4 1.2 4.6 3.8" {...common} />
        </>
      );
      break;
    default:
      body = <circle cx="8" cy="8" r="2" fill="currentColor" />;
  }
  return (
    <svg className="role-icon" width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      {body}
    </svg>
  );
}

export function OutputIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 4.5v15" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path
        d="M6 5.5h11.2L15 9l2.2 3.6H6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SlashedIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M7.5 16.5 16.5 7.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function ToolBadge() {
  return <span className="tool-badge">+</span>;
}
