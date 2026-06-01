import { useCallback, useEffect, useState } from 'react';
import { ChapterShell } from '@/chapters/ChapterShell';
import { getChapter } from '@/chapters/registry';
import { StatusPanel } from '@/components/StatusPanel';
import { CONFIG_DISPLAY } from '@/config';
import { CrowdySession } from '@/game/session/CrowdySession';

export function Chapter01() {
  const chapter = getChapter(1)!;
  const [mgmt, setMgmt] = useState<boolean | null>(null);
  const [game, setGame] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  const runCheck = useCallback(async () => {
    setChecking(true);
    const session = CrowdySession.getInstance();
    const result = await session.checkConnectivity();
    setMgmt(result.managementOk);
    setGame(result.gameOk);
    setChecking(false);
  }, []);

  useEffect(() => {
    void runCheck();
  }, [runCheck]);

  const checks = [
    { id: 'mgmt', label: 'Management API reachable', passed: mgmt === true },
    { id: 'game', label: 'Game API reachable', passed: game === true },
    { id: 'config', label: 'AppId=1 configured', passed: CONFIG_DISPLAY.AppId === '1' },
  ];

  return (
    <ChapterShell
      chapter={chapter}
      checks={checks}
      status={
        <StatusPanel managementOk={mgmt} gameOk={game} />
      }
      demo={
        <div className="connect-demo">
          <pre className="config-block">{JSON.stringify(CONFIG_DISPLAY, null, 2)}</pre>
          <button type="button" onClick={() => void runCheck()} disabled={checking}>
            {checking ? 'Checking…' : 'Re-check connectivity'}
          </button>
        </div>
      }
    >
      <p>
        Crowded Kingdoms splits <strong>identity</strong> (Management API) from{' '}
        <strong>gameplay</strong> (Game API). This chapter verifies both dev-tier
        endpoints are reachable before we write any game code.
      </p>
      <p>
        The config block shows the five values every chapter uses. Management URL
        has no <code>/graphql</code> suffix; game URLs include it.
      </p>
    </ChapterShell>
  );
}
