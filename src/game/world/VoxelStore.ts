import { cellKey } from './coordinates';

export interface PaintedCell {
  cellX: number;
  cellY: number;
  r: number;
  g: number;
  b: number;
  a: number;
  voxelType: number;
}

export function rgbaToVoxelState(r: number, g: number, b: number, a: number): string {
  const bytes = new Uint8Array([r, g, b, a]);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

export function voxelStateToRgba(voxelState: string | null | undefined): {
  r: number;
  g: number;
  b: number;
  a: number;
} | null {
  if (!voxelState) return null;
  try {
    const binary = atob(voxelState);
    if (binary.length < 4) return null;
    return {
      r: binary.charCodeAt(0),
      g: binary.charCodeAt(1),
      b: binary.charCodeAt(2),
      a: binary.charCodeAt(3),
    };
  } catch {
    return null;
  }
}

export class VoxelStore {
  private cells = new Map<string, PaintedCell>();

  set(cellX: number, cellY: number, color: Omit<PaintedCell, 'cellX' | 'cellY'>): void {
    this.cells.set(cellKey(cellX, cellY), { cellX, cellY, ...color });
  }

  get(cellX: number, cellY: number): PaintedCell | undefined {
    return this.cells.get(cellKey(cellX, cellY));
  }

  entries(): PaintedCell[] {
    return [...this.cells.values()];
  }

  clear(): void {
    this.cells.clear();
  }

  size(): number {
    return this.cells.size;
  }
}
