import { ChapterShell } from '@/chapters/ChapterShell';
import { getChapter } from '@/chapters/registry';
import { DemoPane } from '@/components/DemoPane';
import { useGameDemo } from '@/game/useGameDemo';

export function Chapter07() {
  const chapter = getChapter(7)!;
  const game = useGameDemo('viewport');

  const checks = [
    {
      id: 'edge',
      label: 'Dot at edge scrolls viewport',
      passed: game.localPose !== null && (game.viewport.x !== 0 || game.viewport.y !== 0),
    },
    { id: 'move', label: 'Mouse moves dot', passed: game.localPose !== null },
  ];

  return (
    <ChapterShell
      chapter={chapter}
      checks={checks}
      status={
        <aside className="status-panel">
          <h3>Viewport</h3>
          <dl>
            <dt>Position</dt>
            <dd className="mono">
              ({Math.round(game.viewport.x)}, {Math.round(game.viewport.y)})
            </dd>
          </dl>
        </aside>
      }
      demo={
        <>
          <p className="hint">Move to the edge — the window scrolls over the infinite canvas.</p>
          <DemoPane
            renderOptions={{
              viewport: game.viewport,
              localPose: game.localPose,
              remoteActors: game.remoteActors,
              voxelStore: game.voxelStore,
              showGrid: game.showGrid,
            }}
            onPointerMove={game.handlePointerMove}
          />
        </>
      }
    >
      <p>
        The viewport is a fixed window into an infinite world. When your dot
        reaches the margin, the viewport shifts so you can keep exploring.
      </p>
    </ChapterShell>
  );
}
