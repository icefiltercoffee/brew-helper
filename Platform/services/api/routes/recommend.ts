/**
 * Brew Helper — API route: POST /v1/recommend (M0 stub)
 * Thin transport only — no reasoning here. Calls the engine, returns the envelope.
 */
import type { Observation, Recommendation } from '../../../packages/contracts';
// import { recommend } from '../../../packages/engine/orchestrator';

export interface RecommendResponse {
  data: Recommendation;
  meta: {
    latencyMs: number;
    researchFired: boolean;
    principlesUsed: { id: string; version: number }[];
    scienceFlags: number;
    state: string;             // Recommendation State (replaces confidence)
  };
}

export async function POST(_body: Observation): Promise<RecommendResponse> {
  // TODO M1: build EngineDeps, call recommend(_body, deps), time it, fill meta.
  throw new Error('not implemented until M1');
}
