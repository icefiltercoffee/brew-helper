import { candidateExport } from './export';
import { releaseBudget, traceMetrics } from './metrics';

interface D1Statement { bind(...values: unknown[]): D1Statement; run(): Promise<unknown>; all<T>(): Promise<{ results: T[] }>; }
interface D1Database { prepare(query: string): D1Statement; }
interface Env { DB: D1Database; ADMIN_TOKEN: string; }

const ORIGIN = 'https://brew-helper.pages.dev';
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json', 'access-control-allow-origin': ORIGIN, 'vary': 'origin' },
});
const id = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

function allowed(request: Request) { return request.headers.get('origin') === null || request.headers.get('origin') === ORIGIN; }
function admin(request: Request, env: Env) { return request.headers.get('authorization') === `Bearer ${env.ADMIN_TOKEN}`; }
function profileId(request: Request) { return request.headers.get('x-brew-profile'); }

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (!allowed(request)) return json({ error: 'origin not allowed' }, 403);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { 'access-control-allow-origin': ORIGIN, 'access-control-allow-headers': 'content-type, authorization, x-brew-profile', 'access-control-allow-methods': 'GET, POST, OPTIONS', 'vary': 'origin' } });
    const url = new URL(request.url);
    if (request.method === 'POST' && url.pathname === '/v1/feedback') return feedback(request, env);
    if (request.method === 'POST' && url.pathname === '/v1/traces') return trace(request, env);
    if (request.method === 'POST' && url.pathname === '/v1/ingestion/candidates') return candidate(request, env);
    if (request.method === 'GET' && url.pathname === '/v1/ingestion/candidates') return queue(request, env);
    if (request.method === 'POST' && /^\/v1\/ingestion\/candidates\/[^/]+\/review$/.test(url.pathname)) return review(request, env, url.pathname.split('/')[4]);
    if (request.method === 'GET' && url.pathname === '/v1/ingestion/export') return exportPromoted(request, env);
    if (request.method === 'GET' && url.pathname === '/v1/metrics') return metrics(request, env);
    return json({ error: 'not found' }, 404);
  },
};

async function feedback(request: Request, env: Env) {
  const user = profileId(request);
  if (!user || user.length > 128) return json({ error: 'missing browser profile' }, 400);
  const body = await request.json() as any;
  if (!body?.fingerprint || !body?.observed) return json({ error: 'fingerprint and observed cup are required' }, 400);
  const now = new Date().toISOString();
  await env.DB.prepare('INSERT INTO brew_outcomes (id, user_id, coffee_fingerprint, brewer, grinder, observed_json, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(id('BRW'), user, String(body.fingerprint).slice(0, 256), String(body.brewer ?? '').slice(0, 128), String(body.grinder ?? '').slice(0, 128), JSON.stringify({ radar: body.observed, execution: body.execution ?? null }), null, now).run();
  if (body.grinder && (body.grindBias === 'finer' || body.grindBias === 'coarser')) {
    await env.DB.prepare('INSERT INTO equipment_calibrations (user_id, equipment_key, grind_bias, evidence_count, updated_at) VALUES (?, ?, ?, 1, ?) ON CONFLICT(user_id, equipment_key) DO UPDATE SET grind_bias = excluded.grind_bias, evidence_count = equipment_calibrations.evidence_count + 1, updated_at = excluded.updated_at')
      .bind(user, String(body.grinder).slice(0, 128), body.grindBias, now).run();
  }
  return json({ saved: true });
}

async function trace(request: Request, env: Env) {
  const user = profileId(request);
  if (!user || user.length > 128) return json({ error: 'missing browser profile' }, 400);
  const body = await request.json() as any;
  if (!body?.fingerprint || !body?.state) return json({ error: 'fingerprint and state are required' }, 400);
  const principles = Array.isArray(body.principles) ? body.principles.filter((x: unknown) => typeof x === 'string').slice(0, 20) : [];
  await env.DB.prepare('INSERT INTO recommendation_traces (id, user_id, coffee_fingerprint, state, principles_json, science_flags, latency_ms, model_cost_microusd, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(id('TRC'), user, String(body.fingerprint).slice(0, 256), String(body.state).slice(0, 64), JSON.stringify(principles), Number(body.scienceFlags) || 0, Math.max(0, Number(body.latencyMs) || 0), Math.max(0, Math.round(Number(body.modelCostMicrousd) || 0)), new Date().toISOString()).run();
  return json({ saved: true });
}

async function candidate(request: Request, env: Env) {
  if (!admin(request, env)) return json({ error: 'admin authorization required' }, 401);
  const body = await request.json() as any;
  const sources = [...new Set(Array.isArray(body?.sourceIds) ? body.sourceIds.filter((x: unknown) => typeof x === 'string' && x) : [])];
  const threshold = body?.origin === 'brew-history' ? 3 : 2;
  if (!body?.statement || !body?.mechanism || !body?.domain || !['research', 'brew-history'].includes(body?.origin) || Number(body?.independentCount) < threshold || sources.length < threshold) return json({ error: 'candidate lacks convergent evidence' }, 400);
  const now = new Date().toISOString();
  const candidateId = id('CND');
  await env.DB.prepare('INSERT INTO principle_candidates (id, statement, mechanism, domain, source_ids_json, independent_count, origin, coffee_fingerprint, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(candidateId, String(body.statement).slice(0, 1000), String(body.mechanism).slice(0, 2000), String(body.domain).slice(0, 32), JSON.stringify(sources), Number(body.independentCount), body.origin, body.coffeeFingerprint ? String(body.coffeeFingerprint).slice(0, 256) : null, 'needs_review', now).run();
  return json({ id: candidateId, status: 'needs_review' }, 201);
}

async function queue(request: Request, env: Env) {
  if (!admin(request, env)) return json({ error: 'admin authorization required' }, 401);
  const result = await env.DB.prepare('SELECT id, statement, mechanism, domain, source_ids_json, independent_count, origin, coffee_fingerprint, status, created_at FROM principle_candidates WHERE status = ? ORDER BY created_at DESC LIMIT 100').bind('needs_review').all<Record<string, unknown>>();
  return json({ candidates: result.results });
}

async function review(request: Request, env: Env, candidateId: string) {
  if (!admin(request, env)) return json({ error: 'admin authorization required' }, 401);
  const body = await request.json() as any;
  if (!['promoted', 'rejected'].includes(body?.status)) return json({ error: 'status must be promoted or rejected' }, 400);
  const result = await env.DB.prepare('UPDATE principle_candidates SET status = ?, reviewed_at = ?, review_note = ? WHERE id = ? AND status = ?')
    .bind(body.status, new Date().toISOString(), String(body.note ?? '').slice(0, 1000), candidateId, 'needs_review').run() as { meta?: { changes?: number } };
  if (!result.meta?.changes) return json({ error: 'candidate not available for review' }, 404);
  return json({ id: candidateId, status: body.status, reindex: body.status === 'promoted' ? 'ready_for_export' : 'not_needed' });
}

async function exportPromoted(request: Request, env: Env) {
  if (!admin(request, env)) return json({ error: 'admin authorization required' }, 401);
  const result = await env.DB.prepare('SELECT id, statement, mechanism, domain, source_ids_json, independent_count, origin, coffee_fingerprint, reviewed_at, review_note FROM principle_candidates WHERE status = ? ORDER BY reviewed_at ASC LIMIT 100').bind('promoted').all<Parameters<typeof candidateExport>[0][number]>();
  return json(candidateExport(result.results));
}

async function metrics(request: Request, env: Env) {
  if (!admin(request, env)) return json({ error: 'admin authorization required' }, 401);
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [outcomes, traces, candidates] = await Promise.all([
    env.DB.prepare('SELECT COUNT(*) AS count FROM brew_outcomes').all<{ count: number }>(),
    env.DB.prepare('SELECT latency_ms, model_cost_microusd FROM recommendation_traces WHERE created_at >= ? ORDER BY created_at DESC LIMIT 10000').bind(since).all<{ latency_ms: number; model_cost_microusd: number }>(),
    env.DB.prepare("SELECT status, COUNT(*) AS count FROM principle_candidates GROUP BY status").all<{ status: string; count: number }>(),
  ]);
  const traceWindow = { since, ...traceMetrics(traces.results) };
  return json({ brewOutcomes: outcomes.results[0]?.count ?? 0, traceWindow, releaseBudget: releaseBudget(traceWindow), candidates: candidates.results });
}
