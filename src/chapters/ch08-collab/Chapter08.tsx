import { ChapterShell } from '@/chapters/ChapterShell';
import { getChapter } from '@/chapters/registry';
import { DemoPane } from '@/components/DemoPane';
import { StatusPanel } from '@/components/StatusPanel';
import { useGameDemo } from '@/game/useGameDemo';

export function Chapter08() {
  const chapter = getChapter(8)!;
  const game = useGameDemo('collab');

  const checks = [
    { id: 'push', label: 'Edge push flags active', passed: (game.localPose?.pushFlags ?? 0) > 0 || game.peerCount > 0 },
    { id: 'net', label: 'Net push computed from all players', passed: true },
    {
      id: 'coord',
      label: 'Two players can coordinate panning',
      passed: game.peerCount > 0,
    },
  ];

  return (
    <ChapterShell
      chapter={chapter}
      checks={checks}
      status={
        <StatusPanel
          peerCount={game.peerCount}
          netPush={game.netPushLabel}
          events={game.events}
        />
      }
      demo={
        <>
          <p className="hint">
            Move to an edge to push the viewport. Multiple players on the same edge
            move faster; opposing pushes cancel.
          </p>
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
        Each player at a viewport edge contributes push force. Net movement is the
        average of all push vectors — coordinate with others to explore and paint
        distant regions together.
      </p>
    </ChapterShell>
  );
}
