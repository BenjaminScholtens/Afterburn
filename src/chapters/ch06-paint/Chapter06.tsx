import { ChapterShell } from '@/chapters/ChapterShell';
import { getChapter } from '@/chapters/registry';
import { DemoPane } from '@/components/DemoPane';
import { StatusPanel } from '@/components/StatusPanel';
import { useGameDemo } from '@/game/useGameDemo';
import { CrowdySession } from '@/game/session/CrowdySession';

export function Chapter06() {
  const chapter = getChapter(6)!;
  const session = CrowdySession.getInstance();
  const game = useGameDemo('paint');

  const checks = [
    { id: 'hydrate', label: 'Existing paint loaded on join', passed: game.hydrated },
    {
      id: 'paint',
      label: 'Click paints a cell',
      passed: game.voxelStore.size() > 0,
    },
    {
      id: 'sync',
      label: 'Second window sees strokes live',
      passed: game.events.some((e) => e.includes('VoxelUpdateNotification')),
    },
  ];

  return (
    <ChapterShell
      chapter={chapter}
      checks={checks}
      status={
        <StatusPanel
          userEmail={session.user?.email}
          udpConnected
          peerCount={game.peerCount}
          paintedCells={game.paintCount}
          events={game.events}
        />
      }
      demo={
        <>
          <div className="palette">
            {game.palette.map((c, i) => (
              <button
                key={c.voxelType}
                type="button"
                className={i === game.selectedIdx ? 'selected' : ''}
                style={{ background: `rgb(${c.r},${c.g},${c.b})` }}
                onClick={() => game.setSelectedIdx(i)}
                aria-label={`Color ${c.voxelType}`}
              />
            ))}
          </div>
          <p className="hint">Click to paint. Reload to verify persistence.</p>
          <DemoPane
            renderOptions={{
              viewport: game.viewport,
              localPose: game.localPose,
              remoteActors: game.remoteActors,
              voxelStore: game.voxelStore,
              showGrid: game.showGrid,
            }}
            onPointerMove={game.handlePointerMove}
            onClick={(x, y) => void game.handleClick(x, y)}
          />
        </>
      }
    >
      <p>
        Clicks send <code>sendVoxelUpdate</code> with a palette index and base64
        RGBA <code>voxelState</code>. Painted cells persist in the game database
        and reload via <code>listVoxelUpdatesByDistance</code>.
      </p>
    </ChapterShell>
  );
}
