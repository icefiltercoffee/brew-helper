export interface TraceSample { latency_ms: number; model_cost_microusd: number; }
export const RELEASE_BUDGET = { maxP95LatencyMs: 1000, maxSevenDayCostUsd: 1 };

export function traceMetrics(samples: TraceSample[]) {
  const latency = samples.map((sample) => Math.max(0, Number(sample.latency_ms) || 0)).sort((a, b) => a - b);
  const totalCostMicrousd = samples.reduce((sum, sample) => sum + Math.max(0, Number(sample.model_cost_microusd) || 0), 0);
  const p95Index = latency.length ? Math.ceil(latency.length * 0.95) - 1 : 0;
  return {
    count: latency.length,
    averageLatencyMs: latency.length ? Math.round(latency.reduce((sum, value) => sum + value, 0) / latency.length) : null,
    p95LatencyMs: latency.length ? latency[p95Index] : null,
    totalCostUsd: Number((totalCostMicrousd / 1_000_000).toFixed(6)),
  };
}

export function releaseBudget(metrics: ReturnType<typeof traceMetrics>) {
  const p95LatencyMs = metrics.p95LatencyMs;
  const withinLatencyBudget = p95LatencyMs === null || p95LatencyMs <= RELEASE_BUDGET.maxP95LatencyMs;
  const withinCostBudget = metrics.totalCostUsd <= RELEASE_BUDGET.maxSevenDayCostUsd;
  return {
    ...RELEASE_BUDGET,
    withinLatencyBudget,
    withinCostBudget,
    passed: withinLatencyBudget && withinCostBudget,
  };
}
