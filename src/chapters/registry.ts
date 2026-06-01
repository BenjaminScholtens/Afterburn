export interface ChapterCheck {
  id: string;
  label: string;
  passed: boolean;
}

export interface ChapterMeta {
  number: number;
  slug: string;
  title: string;
  goal: string;
  docPath: string;
}

export const CHAPTERS: ChapterMeta[] = [
  {
    number: 1,
    slug: 'setup',
    title: 'Project setup',
    goal: 'Verify connectivity to the dev-tier Management and Game APIs.',
    docPath: '/build-a-game/01-project-setup',
  },
  {
    number: 2,
    slug: 'auth',
    title: 'Auto guest auth',
    goal: 'Automatically register and restore guest credentials on visit.',
    docPath: '/build-a-game/02-auto-guest-auth',
  },
  {
    number: 3,
    slug: 'connect',
    title: 'Connect & bootstrap',
    goal: 'Bootstrap the game client and subscribe to UDP notifications.',
    docPath: '/build-a-game/03-connect-and-bootstrap',
  },
  {
    number: 4,
    slug: 'coordinates',
    title: 'Canvas coordinates',
    goal: 'Map world pixels to server chunk and voxel coordinates.',
    docPath: '/build-a-game/04-canvas-coordinates',
  },
  {
    number: 5,
    slug: 'actors',
    title: 'Actor presence',
    goal: 'Move your dot with the mouse and see other players.',
    docPath: '/build-a-game/05-actor-presence',
  },
  {
    number: 6,
    slug: 'paint',
    title: 'Painting voxels',
    goal: 'Click to color cells that persist in the game database.',
    docPath: '/build-a-game/06-painting-voxels',
  },
  {
    number: 7,
    slug: 'viewport',
    title: 'Viewport edge scroll',
    goal: 'Scroll the window when your dot reaches the edge.',
    docPath: '/build-a-game/07-viewport-edge-scroll',
  },
  {
    number: 8,
    slug: 'collab',
    title: 'Collaborative viewport',
    goal: 'Coordinate with others to push the shared viewport.',
    docPath: '/build-a-game/08-collaborative-viewport',
  },
  {
    number: 9,
    slug: 'full',
    title: 'Full game',
    goal: 'All mechanics combined — paint forever with friends.',
    docPath: '/build-a-game/09-full-game',
  },
];

export function getChapter(n: number): ChapterMeta | undefined {
  return CHAPTERS.find((c) => c.number === n);
}
