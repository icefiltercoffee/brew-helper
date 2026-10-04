/**
 * Brew Helper — Static Memory Manager (isomorphic / browser-safe)
 * Same contract as the Node MemoryManager, but principles are injected as data
 * instead of read from disk. Lets the engine run in the browser (M1 live page) and
 * in tests, with zero Node dependencies.
 */
import type { MemoryManager, Observation, Principle, BrewOutcome, LearningUpdate } from '../contracts';

export function createStaticMemoryManager(principles: Principle[]): MemoryManager {
  return {
    async retrieve(_o: Observation) {
      const history: BrewOutcome[] = [];
      const familiarity = Math.min(1, principles.reduce((s, p) => s + p.confidence, 0) / 4);
      return { principles, history, familiarity };
    },
    async learn(_u: LearningUpdate) { /* no-op in static mode */ },
  };
}
