// The Far-Field ASR leaderboard ranks models by average word error rate. The public Space returns a downloadable results CSV when its leaderboard loads.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson, fetchText, parseCsv } from '../lib/util.ts';

const feed = "https://treble-technologies-ffasr.hf.space/config";

const board: Leaderboard = {
  benchmark: "ffasr-leaderboard",
  url: "https://huggingface.co/spaces/treble-technologies/ffasr",
  feed,
  terms: "See the publisher’s Space and each upstream dataset license at https://huggingface.co/spaces/treble-technologies/ffasr Hugging Face allows the public Space in robots.txt.",
  async fetch() {
    const origin = new URL(feed).origin;
    type Dependency = { id: number; inputs: number[]; targets: [number, string][] };
    const config = await fetchJson<{ api_prefix: string; dependencies: Dependency[] }>(feed);
    const load = config.dependencies.find(d => !d.inputs.length && d.targets.some(([, event]) => event === 'load'));
    if (!load) throw new Error('Missing FFASR page load event');
    const api = origin + config.api_prefix, session = crypto.randomUUID();
    const joined = await fetch(api + '/queue/join', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fn_index: load.id, data: [], session_hash: session, trigger_id: load.targets[0][0] }), signal: AbortSignal.timeout(30000) });
    if (!joined.ok) throw new Error('FFASR queue returned ' + joined.status);
    const eventId = (await joined.json()).event_id;
    const response = await fetch(api + '/queue/data?session_hash=' + session, { signal: AbortSignal.timeout(90000) });
    if (!response.ok) throw new Error('FFASR result returned ' + response.status);
    const events = (await response.text()).split('\n').filter(l => l.startsWith('data:')).map(l => JSON.parse(l.slice(5)));
    const output = events.find(e => e.msg === 'process_completed' && e.event_id === eventId)?.output?.data;
    const csv = output?.[1]?.value?.url;
    if (!csv || new URL(csv).origin !== origin) throw new Error('FFASR returned no leaderboard download');
    const entries = parseCsv(await fetchText(csv));
    const conditions = ['Near Field', 'Lab Meas.', 'Lab Sim.', 'High SNR', 'Mid SNR', 'Low SNR', 'Mov. High', 'Mov. Mid', 'Mov. Low'];
    if (entries.length < 61 || [...conditions, 'Avg WER (%)', 'FFAS', 'RTFx', 'Params (B)'].some(k => !(k in entries[0]))) throw new Error('Missing FFASR results or columns');
    board.parts = Object.fromEntries(conditions.map(k => [k, { name: k, unit: '%' as const, better: 'lower' as const }]));
    return entries.map(r => {
      const metrics: Record<string, number> = {};
      for (const k of [...conditions, 'RTFx', 'FFAS']) if (r[k] && Number.isFinite(Number(r[k]))) metrics[k] = Number(r[k]);
      if (!r.Model || !r['Avg WER (%)'] || !Number.isFinite(Number(r['Avg WER (%)']))) throw new Error('Invalid FFASR ranking');
      return { model: r.Model, score: Number(r['Avg WER (%)']), params: Number(r['Params (B)']) || undefined, metrics };
    });
  },
};

export default board;
