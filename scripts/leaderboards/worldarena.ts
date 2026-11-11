// WorldArena: use the first/default EWMScore_P leaderboard for video quality.
// Policy Evaluator and Data Engine are separate utility tasks, not alternative whole-benchmark settings.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson } from '../lib/util.ts';
import { num, tables, text } from '../lib/html.ts';

const FEED = "https://worldarena-worldarena.hf.space/config";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "worldarena",
  url: "https://huggingface.co/spaces/WorldArena/WorldArena",
  feed: FEED,
  terms: "Public results published by the benchmark authors at worldarena-worldarena.hf.space; retain source attribution and follow the upstream terms.",
  aliases: {},
  
  async fetch() {
    const config = await fetchJson<any>(FEED);
    const origin = new URL(FEED).origin, api = `${origin}${config.api_prefix}/call/`;
    const props = new Map(config.components.map((c: any) => [c.id, c.props]));
    const rows = new Map<string, LeaderboardRow>();
    for (const dep of config.dependencies.filter((d: any) => d.api_name === 'update_leaderboard_wrapper')) {
      const inputs = dep.inputs.map((id: number) => props.get(id) as any);
      const metric = inputs[0].value, limit = inputs[1].maximum;
      for (const sort of ['Descending (high → low)', 'Ascending (low → high)']) {
        await new Promise(resolve => setTimeout(resolve, 1100));
        const data = [metric, limit, '', 'All', 'All', sort, inputs[6].value ?? []];
        const event = await fetchJson<{event_id: string}>(api + dep.api_name, {method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({data})});
        await new Promise(resolve => setTimeout(resolve, 1100));
        const stream = await fetchText(`${api}${dep.api_name}/${event.event_id}`);
        const complete = stream.match(/event: complete\s*\ndata: ([^\n]+)/)?.[1];
        if (!complete) throw new Error(`WorldArena ${dep.api_name} returned no complete event`);
        const values = JSON.parse(complete);
        for (const value of values) if (typeof value === 'string') for (const t of tables(value)) {
          const head = t[0].map(c => c.text);
          if (head[0] !== 'Model') continue;
          for (const r of t.slice(1)) {
            const score = num(r[1]?.text); if (score === undefined) continue;
            const metrics: Record<string, number> = {};
            for (let i = 3; i < head.length; i++) { const v = num(r[i]?.text); if (v !== undefined) metrics[head[i]] = v; }
            rows.set(`${dep.api_name}|${r[0].text.toLowerCase()}`, {model: identity(r[0].text), score, metrics});
          }
        }
      }
    }
    if (!rows.size) throw new Error('WorldArena score tables missing');
    return [...rows.values()];
  },
};
export default board;
