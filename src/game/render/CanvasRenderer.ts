import type { Viewport } from '@/game/world/Viewport';
import type { VoxelStore, PaintedCell } from '@/game/world/VoxelStore';
import { TILE_SIZE } from '@/config';
import type { ActorPose } from '@/game/world/actorState';

export interface RemoteActor {
  uuid: string;
  pose: ActorPose;
  color: string;
}

export interface RenderOptions {
  viewport: Viewport;
  localPose: ActorPose | null;
  remoteActors: RemoteActor[];
  voxelStore: VoxelStore;
  hoverCell?: { cellX: number; cellY: number } | null;
  showGrid?: boolean;
  selectedColor?: string;
}

export const PILOT_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'] as const;

export const PILOT_COLOR_NAMES: Record<(typeof PILOT_COLORS)[number], string> = {
  '#e74c3c': 'Crimson',
  '#3498db': 'Azure',
  '#2ecc71': 'Jade',
  '#f39c12': 'Amber',
  '#9b59b6': 'Violet',
  '#1abc9c': 'Teal',
};

export function actorColorForUuid(uuid: string): string {
  let hash = 0;
  for (let i = 0; i < uuid.length; i++) {
    hash = (hash + uuid.charCodeAt(i) * (i + 1)) % PILOT_COLORS.length;
  }
  return PILOT_COLORS[hash]!;
}

export function pilotColorLabel(hex: string): string {
  return PILOT_COLOR_NAMES[hex as (typeof PILOT_COLORS)[number]] ?? 'Pilot';
}

export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D context unavailable');
    this.ctx = ctx;
  }

  resize(): void {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    this.canvas.width = parent.clientWidth;
    this.canvas.height = parent.clientHeight;
  }

  render(opts: RenderOptions): void {
    const { viewport, localPose, remoteActors, voxelStore, hoverCell, showGrid } = opts;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, w, h);

    for (const cell of voxelStore.entries()) {
      this.drawCell(ctx, cell, viewport);
    }

    if (showGrid) {
      this.drawGrid(ctx, viewport, w, h);
    }

    if (hoverCell) {
      const { x, y } = viewport.worldToScreen(
        hoverCell.cellX * TILE_SIZE,
        hoverCell.cellY * TILE_SIZE,
      );
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
    }

    for (const remote of remoteActors) {
      this.drawDot(ctx, remote.pose.worldX, remote.pose.worldY, viewport, remote.color, 6);
      this.drawPushArrows(ctx, remote.pose, viewport, remote.color);
    }

    if (localPose) {
      this.drawDot(ctx, localPose.worldX, localPose.worldY, viewport, '#ffffff', 8);
      this.drawPushArrows(ctx, localPose, viewport, '#ffffff');
    }
  }

  private drawCell(
    ctx: CanvasRenderingContext2D,
    cell: PaintedCell,
    viewport: Viewport,
  ): void {
    const wx = cell.cellX * TILE_SIZE;
    const wy = cell.cellY * TILE_SIZE;
    const { x, y } = viewport.worldToScreen(wx, wy);
    ctx.fillStyle = `rgba(${cell.r},${cell.g},${cell.b},${(cell.a ?? 255) / 255})`;
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
  }

  private drawGrid(ctx: CanvasRenderingContext2D, viewport: Viewport, w: number, h: number): void {
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    const startCellX = Math.floor(viewport.x / TILE_SIZE);
    const startCellY = Math.floor(viewport.y / TILE_SIZE);
    const endCellX = startCellX + Math.ceil(w / TILE_SIZE) + 1;
    const endCellY = startCellY + Math.ceil(h / TILE_SIZE) + 1;
    for (let cx = startCellX; cx <= endCellX; cx++) {
      const wx = cx * TILE_SIZE;
      const sx = wx - viewport.x;
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, h);
      ctx.stroke();
    }
    for (let cy = startCellY; cy <= endCellY; cy++) {
      const wy = cy * TILE_SIZE;
      const sy = wy - viewport.y;
      ctx.beginPath();
      ctx.moveTo(0, sy);
      ctx.lineTo(w, sy);
      ctx.stroke();
    }
  }

  private drawDot(
    ctx: CanvasRenderingContext2D,
    worldX: number,
    worldY: number,
    viewport: Viewport,
    color: string,
    radius: number,
  ): void {
    const { x, y } = viewport.worldToScreen(worldX, worldY);
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  private drawPushArrows(
    ctx: CanvasRenderingContext2D,
    pose: ActorPose,
    viewport: Viewport,
    color: string,
  ): void {
    if (!pose.pushFlags) return;
    const { x, y } = viewport.worldToScreen(pose.worldX, pose.worldY);
    ctx.fillStyle = color;
    ctx.font = '14px sans-serif';
    if (pose.pushFlags & 1) ctx.fillText('↑', x - 4, y - 12);
    if (pose.pushFlags & 2) ctx.fillText('↓', x - 4, y + 20);
    if (pose.pushFlags & 4) ctx.fillText('→', x + 10, y + 4);
    if (pose.pushFlags & 8) ctx.fillText('←', x - 18, y + 4);
  }
}
