import { ChapterShell } from '@/chapters/ChapterShell';
import { getChapter } from '@/chapters/registry';
import { DemoPane } from '@/components/DemoPane';
import { StatusPanel } from '@/components/StatusPanel';
import { useGameDemo } from '@/game/useGameDemo';
import { CrowdySession } from '@/game/session/CrowdySession';

export function Chapter05() {
  const chapter = getChapter(5)!;
  const session = CrowdySession.getInstance();
  const game = useGameDemo('actors');

  const checks = [
    { id: 'move', label: 'Mouse moves local dot', passed: game.localPose !== null },
    { id: 'udp', label: 'Actor updates sending', passed: game.events.some((e) => e.includes('Actor')) },
    {
      id: 'multi',
      label: 'Open a second window to see peers',
      passed: game.peerCount > 0,
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
          events={game.events}
        />
      }
      demo={
        <>
          <p className="hint">Move mouse inside the pane. Open another tab to see remote dots.</p>
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
        Your pointer position becomes actor state sent via{' '}
        <code>sendActorUpdate</code> at ~10 Hz. Other clients render remote dots
        from <code>ActorUpdateNotification</code> events.
      </p>
    </ChapterShell>
  );
}
