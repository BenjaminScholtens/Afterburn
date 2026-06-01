import { Link } from 'react-router-dom';
import { CHAPTERS } from '@/chapters/registry';

export function Home() {
  return (
    <div className="home">
      <header>
        <h1>Build a Collaborative Canvas Game</h1>
        <p>
          An interactive tutorial for Crowded Kingdoms — each chapter adds one
          working piece until you have a multiplayer pixel canvas.
        </p>
        <Link to="/play" className="play-link big">
          Jump to full game →
        </Link>
      </header>
      <ol className="chapter-list">
        {CHAPTERS.map((c) => (
          <li key={c.number}>
            <Link to={`/chapter/${c.number}`}>
              <span className="num">Chapter {c.number}</span>
              <span className="title">{c.title}</span>
              <span className="goal">{c.goal}</span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
