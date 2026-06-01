import type { ChapterCheck } from '@/chapters/registry';

interface CheckListProps {
  checks: ChapterCheck[];
}

export function CheckList({ checks }: CheckListProps) {
  return (
    <ul className="check-list">
      {checks.map((c) => (
        <li key={c.id} className={c.passed ? 'pass' : 'fail'}>
          <span className="check-icon">{c.passed ? '✓' : '○'}</span>
          {c.label}
        </li>
      ))}
    </ul>
  );
}
