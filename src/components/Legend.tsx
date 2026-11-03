import { AvatarRing, BotGlyph, OutputIcon, SlashedIcon, ToolBadge } from './Marks';

function Arrow({ kind }: { kind: 'always' | 'only-when' | 'asks' }) {
  if (kind === 'asks') {
    return (
      <svg width="46" height="16" viewBox="0 0 46 16" aria-hidden="true">
        <path d="M2 12 C 14 12, 16 3, 26 3 S 36 11, 40 7" fill="none" stroke="#b7c0d0" strokeWidth="1.3" />
        <path d="M36.2 4.8 42 7.4 36.4 10.4" fill="#b7c0d0" />
      </svg>
    );
  }
  return (
    <svg width="46" height="16" viewBox="0 0 46 16" aria-hidden="true">
      <line
        x1="2"
        y1="8"
        x2="36"
        y2="8"
        stroke="#b7c0d0"
        strokeWidth="1.3"
        strokeDasharray={kind === 'only-when' ? '4 4' : undefined}
      />
      <path d="M34 4.8 42 8 34 11.2" fill="#b7c0d0" />
    </svg>
  );
}

export function Legend() {
  return (
    <div className="legend" aria-label="Diagram legend">
      <div className="legend-group">
        <span className="legend-item">
          <AvatarRing size={22} mark={14} color="#55B5A3" title="Chief of Staff">
            <BotGlyph bot={{ name: 'Chief of Staff', avatar: '/avatars/chief.png' }} size={14} />
          </AvatarRing>
          Bot
        </span>
        <span className="legend-item">
          <span className="legend-output">
            <OutputIcon />
          </span>
          Output
        </span>
        <span className="legend-item">
          <span className="legend-early">
            <SlashedIcon />
          </span>
          Early exit
        </span>
        <span className="legend-item">
          <span className="legend-start">Starts</span>
        </span>
        <span className="legend-item">
          <ToolBadge />
          Uses a tool
        </span>
      </div>
      <div className="legend-group">
        <span className="legend-item">
          <Arrow kind="always" />
          Always
        </span>
        <span className="legend-item">
          <Arrow kind="only-when" />
          Only when
        </span>
        <span className="legend-item">
          <Arrow kind="asks" />
          Asks and waits
        </span>
        <span className="legend-hint">Hover a line to highlight it</span>
      </div>
    </div>
  );
}
