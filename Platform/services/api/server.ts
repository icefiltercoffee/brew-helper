/**
 * Brew Helper — HTTP API server (M1). The production "real TS service".
 * Thin transport over the engine (Node/fs-backed memory). Run: npm run serve
 *   POST /v1/recommend  { coffee, intent }  → { data, meta }
 */
import { createServer } from 'node:http';
import { composeEngine } from '../../packages/engine/compose';
import { recommend } from '../../packages/engine/orchestrator';
import type { Observation, RadarPriorities } from '../../packages/contracts';

const deps = composeEngine({ googleApiKey: process.env.GOOGLE_CSE_API_KEY, googleEngineId: process.env.GOOGLE_CSE_ID });
const PORT = Number(process.env.PORT ?? 8787);

function obsFrom(body: { coffee: Observation['coffee']; intent: RadarPriorities }): Observation {
  return {
    coffee: body.coffee ?? {}, setup: {}, intent: body.intent,
    unknowns: [],
    fingerprint: `${body.coffee?.origin ?? ''}-${body.coffee?.process ?? ''}-${body.coffee?.roastLevel ?? ''}`.toLowerCase(),
  };
}

createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  if (req.method === 'OPTIONS') { res.writeHead(204).end(); return; }
  if (req.method === 'POST' && req.url === '/v1/recommend') {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', async () => {
      try {
        const t0 = Date.now();
        const rec = await recommend(obsFrom(JSON.parse(raw || '{}')), deps);
        const body = { data: rec, meta: { ...rec.meta, latencyMs: Date.now() - t0 } };
        res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(body));
      } catch (e: any) {
        res.writeHead(500, { 'content-type': 'application/json' }).end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }
  res.writeHead(404).end('not found');
}).listen(PORT, () => console.log(`Brew Helper engine API on http://localhost:${PORT}  (POST /v1/recommend)`));
