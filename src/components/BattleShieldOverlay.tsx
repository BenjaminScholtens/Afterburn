interface BattleShieldOverlayProps {
  outsideZone: boolean;
  alive?: boolean;
}

/** Red vignette when outside the shrinking sector. */
export function BattleShieldOverlay({
  outsideZone,
  alive = true,
}: BattleShieldOverlayProps) {
  return (
    <div
      className={`battle-damage-vignette${outsideZone && alive ? ' active' : ''}`}
      aria-hidden
    />
  );
}
