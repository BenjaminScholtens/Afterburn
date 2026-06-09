import { pilotColorLabel } from '@/game/render/CanvasRenderer';

interface BattlePilotColorProps {
  color: string;
}

export function BattlePilotColor({ color }: BattlePilotColorProps) {
  const label = pilotColorLabel(color);

  return (
    <div className="battle-pilot-color" aria-label={`Your pilot color is ${label}`}>
      <span className="battle-pilot-swatch" style={{ backgroundColor: color }} />
      <span className="battle-pilot-text">
        You · <strong>{label}</strong>
      </span>
    </div>
  );
}
