import { useCallback, useEffect, useState } from 'react';
import { ChapterShell } from '@/chapters/ChapterShell';
import { getChapter } from '@/chapters/registry';
import { StatusPanel } from '@/components/StatusPanel';
import { CrowdySession } from '@/game/session/CrowdySession';

export function Chapter02() {
  const chapter = getChapter(2)!;
  const session = CrowdySession.getInstance();
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [authed, setAuthed] = useState(false);

  const runAuth = useCallback(async () => {
    setError('');
    try {
      const user = await session.ensureGuestAuth();
      setUserId(user.userId);
      setEmail(user.email ?? '');
      setAuthed(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setAuthed(false);
    }
  }, [session]);

  useEffect(() => {
    void runAuth();
  }, [runAuth]);

  const reset = () => {
    session.resetGuest();
    setAuthed(false);
    setUserId('');
    setEmail('');
    void runAuth();
  };

  const checks = [
    { id: 'token', label: 'Bearer token stored', passed: session.isAuthenticated },
    { id: 'user', label: 'User ID assigned', passed: !!userId },
    { id: 'guest', label: 'Guest email generated', passed: email.includes('guest-') },
  ];

  return (
    <ChapterShell
      chapter={chapter}
      checks={checks}
      status={
        <StatusPanel
          userEmail={email}
          userId={userId}
          lastError={error}
          events={session.events}
        />
      }
      demo={
        <div className="auth-demo">
          <p>{authed ? `Signed in as ${email}` : 'Creating guest account…'}</p>
          <button type="button" onClick={reset}>
            Reset guest (new credentials)
          </button>
        </div>
      }
    >
      <p>
        Visitors should play immediately — no login form. On first visit we{' '}
        <code>register()</code> with generated credentials and store them in{' '}
        <code>localStorage</code>. Refresh restores the same session.
      </p>
      <p>
        This is a client-side integration pattern: the Management API still requires
        a valid email and 8+ character password; we generate those automatically.
      </p>
    </ChapterShell>
  );
}
