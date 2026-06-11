import { ACTOR_SYNC_INTERVAL_MS, BATTLE_ACTOR_REPLICATION_DISTANCE } from '@/config';
import { CrowdySession } from './CrowdySession';
import type { ActorPose } from '@/game/world/actorState';
import { encodeActorState } from '@/game/world/actorState';
import { worldToChunkInput } from '@/game/world/coordinates';

export interface PoseProvider {
  getPose(): ActorPose;
}

export class ActorSender {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private sequenceNumber = 0;
  private provider: PoseProvider | null = null;
  private stateEncoder: (pose: ActorPose) => string = encodeActorState;
  private actorUuid: string | null = null;
  private syncIntervalMs = ACTOR_SYNC_INTERVAL_MS;
  private chunkOverride: { x: string; y: string; z: string } | null = null;

  constructor(
    private readonly session: CrowdySession,
    syncIntervalMs = ACTOR_SYNC_INTERVAL_MS,
  ) {
    this.syncIntervalMs = syncIntervalMs;
  }

  setSyncIntervalMs(ms: number): void {
    this.syncIntervalMs = ms;
    if (this.intervalId) {
      this.stop();
      this.start();
    }
  }

  setActorUuid(uuid: string | null): void {
    this.actorUuid = uuid;
  }

  setStateEncoder(encoder: (pose: ActorPose) => string): void {
    this.stateEncoder = encoder;
  }

  setProvider(provider: PoseProvider | null): void {
    this.provider = provider;
  }

  /** Pin actor updates to one chunk (battle royale — position lives in state). */
  setChunkOverride(chunk: { x: string; y: string; z: string } | null): void {
    this.chunkOverride = chunk;
  }

  start(): void {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => {
      void this.sendOnce();
    }, this.syncIntervalMs);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async sendNow(): Promise<void> {
    await this.sendOnce();
  }

  private async sendOnce(): Promise<void> {
    if (!this.provider) return;
    const pose = this.provider.getPose();
    const chunk =
      this.chunkOverride ?? worldToChunkInput(pose.worldX, pose.worldY).chunk;
    const seq = this.nextSeq();
    await this.session.sendActorUpdate({
      chunk,
      state: this.stateEncoder(pose),
      sequenceNumber: seq,
      distance: this.chunkOverride ? BATTLE_ACTOR_REPLICATION_DISTANCE : 8,
      decayRate: 0,
      uuid: this.actorUuid ?? undefined,
    });
  }

  private nextSeq(): number {
    const s = this.sequenceNumber;
    this.sequenceNumber = (s + 1) % 256;
    return s;
  }
}
