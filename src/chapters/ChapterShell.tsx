import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import type { ChapterMeta } from './registry';
import { CHAPTERS } from './registry';
import { CheckList } from '@/components/CheckList';
import type { ChapterCheck } from './registry';

interface ChapterShellProps {
  chapter: ChapterMeta;
  children: ReactNode;
  demo: ReactNode;
  status: ReactNode;
  checks: ChapterCheck[];
}

export function ChapterShell({ chapter, children, demo, status, checks }: ChapterShellProps) {
  const prev = CHAPTERS.find((c) => c.number === chapter.number - 1);
  const next = CHAPTERS.find((c) => c.number === chapter.number + 1);
  const allPassed = checks.every((c) => c.passed);

  return (
    <div className="chapter-layout">
      <nav className="chapter-nav">
        <Link to="/">Home</Link>
        {CHAPTERS.map((c) => (
          <Link
            key={c.number}
            to={`/chapter/${c.number}`}
            className={c.number === chapter.number ? 'active' : ''}
          >
            {c.number}
          </Link>
        ))}
        <Link to="/play">Play</Link>
      </nav>
      <header className="chapter-header">
        <p className="chapter-label">Chapter {chapter.number}</p>
        <h1>{chapter.title}</h1>
        <p className="goal">{chapter.goal}</p>
        <a
          href={`https://docs.crowdedkingdoms.com${chapter.docPath}`}
          target="_blank"
          rel="noreferrer"
          className="doc-btn"
        >
          Read doc chapter →
        </a>
      </header>
      <div className="chapter-body">
        <section className="chapter-prose">{children}</section>
        <section className="chapter-demo">{demo}</section>
        <section className="chapter-sidebar">{status}</section>
      </div>
      <footer className="chapter-footer">
        <CheckList checks={checks} />
        <div className="chapter-nav-buttons">
          {prev && <Link to={`/chapter/${prev.number}`}>← Ch {prev.number}</Link>}
          {next && (
            <Link
              to={`/chapter/${next.number}`}
              className={allPassed ? '' : 'disabled'}
            >
              Ch {next.number} →
            </Link>
          )}
          {chapter.number === 9 && (
            <Link to="/play" className="play-link">
              Launch full game →
            </Link>
          )}
        </div>
      </footer>
    </div>
  );
}
