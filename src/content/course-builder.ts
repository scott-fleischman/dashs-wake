import type { LevelEntity } from "../core/run-simulation";
import type { FlightChannel } from "./terrain";
import { SPAWN_SURFACE_Y } from "./terrain";

export type PatternTag =
  | "rest"
  | "spike"
  | "jump"
  | "gap"
  | "vertical"
  | "pad"
  | "orb"
  | "ship"
  | "portal-challenge"
  | "lighting-dark"
  | "lighting-bright";

export interface CourseBuilderOptions {
  idPrefix: string;
  startX?: number;
}

/**
 * Stateful left-to-right course assembler. Patterns mutate it in place.
 */
export class CourseBuilder {
  x: number;
  surfaceY = SPAWN_SURFACE_Y;
  readonly idPrefix: string;
  readonly entities: LevelEntity[] = [];
  readonly channels: FlightChannel[] = [];
  readonly requiredTriggerIds: string[] = [];
  readonly tags: PatternTag[] = [];
  private idSeq = 0;

  constructor(options: CourseBuilderOptions) {
    this.idPrefix = options.idPrefix;
    this.x = options.startX ?? 0;
  }

  nextId(kind: string): string {
    this.idSeq += 1;
    return `${this.idPrefix}-${kind}-${this.idSeq}`;
  }

  add(...entities: LevelEntity[]): void {
    this.entities.push(...entities);
  }

  channel(channel: FlightChannel): void {
    this.channels.push(channel);
  }

  require(id: string): void {
    this.requiredTriggerIds.push(id);
  }

  tag(...tags: PatternTag[]): void {
    for (const tag of tags) {
      if (!this.tags.includes(tag)) {
        this.tags.push(tag);
      }
    }
  }

  advance(px: number): void {
    this.x += px;
  }

  /** Rightmost edge of any authored entity (for bounds-safe finish lines). */
  maxEntityRight(): number {
    let right = this.x;
    for (const entity of this.entities) {
      right = Math.max(right, entity.x + entity.width);
    }
    return right;
  }

  /** A finish X past the cursor and every authored entity (incl. lighting). */
  finishX(tail = 64): number {
    return Math.ceil(Math.max(this.x, this.maxEntityRight()) + tail);
  }
}
