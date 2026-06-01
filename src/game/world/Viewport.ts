import {
  VIEWPORT_EDGE_MARGIN,
  VIEWPORT_HEIGHT,
  VIEWPORT_SCROLL_SPEED,
  VIEWPORT_WIDTH,
} from '@/config';

export class Viewport {
  x = 0;
  y = 0;
  readonly width = VIEWPORT_WIDTH;
  readonly height = VIEWPORT_HEIGHT;
  readonly edgeMargin = VIEWPORT_EDGE_MARGIN;

  worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    return { x: worldX - this.x, y: worldY - this.y };
  }

  screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return { x: screenX + this.x, y: screenY + this.y };
  }

  /** Single-player: keep dot inside viewport by scrolling when at edge. */
  followActor(worldX: number, worldY: number): void {
    const local = this.worldToScreen(worldX, worldY);
    if (local.x < this.edgeMargin) {
      this.x = worldX - this.edgeMargin;
    } else if (local.x > this.width - this.edgeMargin) {
      this.x = worldX - (this.width - this.edgeMargin);
    }
    if (local.y < this.edgeMargin) {
      this.y = worldY - this.edgeMargin;
    } else if (local.y > this.height - this.edgeMargin) {
      this.y = worldY - (this.height - this.edgeMargin);
    }
  }

  applyNetPush(netX: number, netY: number, speed: number): void {
    if (netX === 0 && netY === 0) return;
    this.x += netX * speed;
    this.y += netY * speed;
  }

  applyEdgeScrollFromActor(worldX: number, worldY: number): void {
    const local = this.worldToScreen(worldX, worldY);
    if (local.x < this.edgeMargin) this.x -= VIEWPORT_SCROLL_SPEED;
    if (local.x > this.width - this.edgeMargin) this.x += VIEWPORT_SCROLL_SPEED;
    if (local.y < this.edgeMargin) this.y -= VIEWPORT_SCROLL_SPEED;
    if (local.y > this.height - this.edgeMargin) this.y += VIEWPORT_SCROLL_SPEED;
  }
}
