import { ChapterShell } from '@/chapters/ChapterShell';
import { getChapter } from '@/chapters/registry';
import { DemoPane } from '@/components/DemoPane';
import { useGameDemo } from '@/game/useGameDemo';

export function Chapter04() {
  const chapter = getChapter(4)!;
  const game = useGameDemo('coords');

  const checks = [
    {
      id: 'hover',
      label: 'Hover shows chunk/voxel coords',
      passed: game.hoverVoxel !== null,
    },
    {
      id: 'grid',
      label: 'Grid overlay visible',
      passed: true,
    },
  ];

  return (
    <ChapterShell
      chapter={chapter}
      checks={checks}
      status={
        <aside className="status-panel">
          <h3>Coordinates</h3>
          {game.hoverVoxel ? (
            <dl>
              <dt>Chunk</dt>
              <dd className="mono">
                ({game.hoverVoxel.chunkX}, {game.hoverVoxel.chunkY}, {game.hoverVoxel.chunkZ})
              </dd>
              <dt>Voxel</dt>
              <dd className="mono">
                ({game.hoverVoxel.voxelX}, {game.hoverVoxel.voxelY}, {game.hoverVoxel.voxelZ})
              </dd>
              <dt>Cell</dt>
              <dd className="mono">
                ({game.hoverCell?.cellX ?? '—'}, {game.hoverCell?.cellY ?? '—'})
              </dd>
            </dl>
          ) : (
            <p>Hover the canvas</p>
          )}
        </aside>
      }
      demo={
        <DemoPane
          renderOptions={{
            viewport: game.viewport,
            localPose: null,
            remoteActors: [],
            voxelStore: game.voxelStore,
            hoverCell: game.hoverCell,
            showGrid: true,
          }}
          onPointerMove={game.handlePointerMove}
          onPointerLeave={game.handlePointerLeave}
        />
      }
    >
      <p>
        The world is an infinite 2D plane. Each paint cell is 8×8 pixels; server
        chunks are 16×16 voxels. Move your mouse over the canvas to see the mapping.
      </p>
      <p>No network calls yet — pure coordinate math.</p>
    </ChapterShell>
  );
}
