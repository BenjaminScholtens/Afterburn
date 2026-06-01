export interface CellCoord {
  cellX: number;
  cellY: number;
}

export interface VoxelCoord {
  chunkX: number;
  chunkY: number;
  chunkZ: number;
  voxelX: number;
  voxelY: number;
  voxelZ: number;
}

export interface ChunkKey {
  chunkX: number;
  chunkY: number;
  chunkZ: number;
}

import { CHUNK_VOXEL_SIZE, TILE_SIZE } from '@/config';

/** Positive modulo for negative cell indices. */
export function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

export function worldToCell(worldX: number, worldY: number): CellCoord {
  return {
    cellX: Math.floor(worldX / TILE_SIZE),
    cellY: Math.floor(worldY / TILE_SIZE),
  };
}

export function cellToWorld(cellX: number, cellY: number): { x: number; y: number } {
  return {
    x: cellX * TILE_SIZE,
    y: cellY * TILE_SIZE,
  };
}

export function cellToVoxel(cellX: number, cellY: number, chunkZ = 0, voxelZ = 0): VoxelCoord {
  const chunkX = Math.floor(cellX / CHUNK_VOXEL_SIZE);
  const chunkY = Math.floor(cellY / CHUNK_VOXEL_SIZE);
  const voxelX = mod(cellX, CHUNK_VOXEL_SIZE);
  const voxelY = mod(cellY, CHUNK_VOXEL_SIZE);
  return { chunkX, chunkY, chunkZ, voxelX, voxelY, voxelZ };
}

export function voxelToCell(v: Pick<VoxelCoord, 'chunkX' | 'chunkY' | 'voxelX' | 'voxelY'>): CellCoord {
  return {
    cellX: v.chunkX * CHUNK_VOXEL_SIZE + v.voxelX,
    cellY: v.chunkY * CHUNK_VOXEL_SIZE + v.voxelY,
  };
}

export function chunkKey(v: ChunkKey): string {
  return `${v.chunkX},${v.chunkY},${v.chunkZ}`;
}

export function cellKey(cellX: number, cellY: number): string {
  return `${cellX},${cellY}`;
}

export function worldToChunkInput(worldX: number, worldY: number): {
  chunk: { x: string; y: string; z: string };
  voxel: VoxelCoord;
} {
  const { cellX, cellY } = worldToCell(worldX, worldY);
  const v = cellToVoxel(cellX, cellY);
  return {
    chunk: { x: String(v.chunkX), y: String(v.chunkY), z: String(v.chunkZ) },
    voxel: v,
  };
}
