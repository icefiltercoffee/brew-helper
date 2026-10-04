import { candidateExport } from '../worker/src/export.ts';
import { releaseBudget, traceMetrics } from '../worker/src/metrics.ts';

let pass = 0, total = 0;
function check(label, condition) { total++; if (condition) pass++; console.log(`${condition ? '✅' : '❌'} ${label}`); }

const metrics = traceMetrics([
  { latency_ms: 20, model_cost_microusd: 1000 },
  { latency_ms: 30, model_cost_microusd: 1000 },
  { latency_ms: 40, model_cost_microusd: 1000 },
  { latency_ms: 100, model_cost_microusd: 1000 },
]);
check('p95 uses the 95th-percentile trace', metrics.p95LatencyMs === 100);
check('cost is reported in dollars from microdollars', metrics.totalCostUsd === 0.004);
check('empty metrics are explicit', traceMetrics([]).p95LatencyMs === null);
check('release budget passes a fast, zero-cost browser engine', releaseBudget(metrics).passed === true);
check('release budget fails an over-budget p95', releaseBudget(traceMetrics([{ latency_ms: 1001, model_cost_microusd: 0 }])).passed === false);

const exported = candidateExport([{ id: 'CND-1', statement: 'Longer bloom helps fresh coffee.', mechanism: 'CO₂ slows saturation.', domain: 'bloom', source_ids_json: '["SRC-1","SRC-2"]', independent_count: 2, origin: 'research', reviewed_at: '2026-07-31T00:00:00.000Z' }], '2026-07-31T00:00:00.000Z');
check('promotion export retains human-review evidence', exported.markdown.includes('SRC-1, SRC-2'));
check('promotion export never marks a candidate active', !exported.markdown.includes('active'));

console.log(`\n${pass}/${total} M7 observability checks passed.`);
process.exit(pass === total ? 0 : 1);
