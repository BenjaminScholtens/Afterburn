import { describe, expect, it } from 'vitest';
import { cellToVoxel, mod, worldToCell } from '@/game/world/coordinates';

describe('coordinates', () => {
  it('maps world pixels to cells', () => {
    expect(worldToCell(0, 0)).toEqual({ cellX: 0, cellY: 0 });
    expect(worldToCell(15, 15)).toEqual({ cellX: 1, cellY: 1 });
  });

  it('handles negative cells', () => {
    expect(mod(-1, 16)).toBe(15);
  });

  it('maps cells to chunk voxels', () => {
    expect(cellToVoxel(16, 16)).toEqual({
      chunkX: 1,
      chunkY: 1,
      chunkZ: 0,
      voxelX: 0,
      voxelY: 0,
      voxelZ: 0,
    });
  });
});
