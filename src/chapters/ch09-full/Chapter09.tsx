import { Link } from 'react-router-dom';
import { ChapterShell } from '@/chapters/ChapterShell';
import { getChapter } from '@/chapters/registry';

export function Chapter09() {
  const chapter = getChapter(9)!;

  const checks = [
    { id: 'play', label: 'Full game available at /play', passed: true },
    { id: 'docs', label: 'Documentation complete', passed: true },
  ];

  return (
    <ChapterShell
      chapter={chapter}
      checks={checks}
      status={
        <div className="summary-panel">
          <h3>You built it</h3>
          <ul>
            <li>Dev-tier connectivity</li>
            <li>Auto guest auth</li>
            <li>UDP bootstrap + subscribe</li>
            <li>Coordinate mapping</li>
            <li>Multiplayer actors</li>
            <li>Persistent voxel paint</li>
            <li>Viewport edge scroll</li>
            <li>Collaborative push</li>
          </ul>
        </div>
      }
      demo={
        <div className="connect-demo">
          <Link to="/play" className="play-link big">
            Launch full game →
          </Link>
        </div>
      }
    >
      <p>
        Every chapter added one slice. The full game at <Link to="/play">/play</Link>{' '}
        combines them: move with your mouse, paint with click, scroll at edges, and
        coordinate viewport pushes with other players.
      </p>
      <p>
        The tutorial docs in <code>cks-docs/docs-build-a-game/</code> mirror each
        chapter — a developer can rebuild this entirely from documentation alone.
      </p>
    </ChapterShell>
  );
}
