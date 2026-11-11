// WorldArena 2.0 defaults to Track 1 Simulator Video Quality. The public Gradio reader returns the rendered table and its EWMScore-P headline. This importer reads that published aggregate without recomputing it. Other tracks remain separate.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';

const FEED = "https://worldarena-worldarena2-0.hf.space/gradio_api/call/reload_data";
const board: Leaderboard = {
  benchmark: "worldarena-2-0",
  url: "https://huggingface.co/spaces/WorldArena/WorldArena2.0",
  feed: FEED,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = await (async (): Promise<LeaderboardRow[]> => {

const event=await fetchJson<any>(FEED,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({data:[]})});if(!/^[a-f0-9]+$/.test(event.event_id))throw new Error('Missing Gradio event');
await new Promise(r=>setTimeout(r,1100));const s=await fetchText(`${FEED}/${event.event_id}`);const m=s.match(/event: complete\r?\ndata: (.+)/);if(!m)throw new Error('Gradio results incomplete');const data=JSON.parse(m[1]);const t=tables(data[3])[0]?.map(r=>r.map(c=>c.text));if(!t||!t[0][1].includes('EWMScore'))throw new Error('Track 1 headline changed');
return t.slice(1).map(r=>({model:r[0],score:num(r[1])!,metrics:Object.fromEntries(r.slice(3).map((v,i)=>[t[0][i+3],num(v)]).filter(([,v])=>v!==undefined))}));

    })();
    if (!rows.length) throw new Error('No whole-benchmark scores found');
    const seen = new Set<string>();
    for (const r of rows) {
      if (!r.model || !Number.isFinite(r.score)) throw new Error('Invalid model or score');
      if (r.score < 0 || r.score > 100) throw new Error('Score outside percent range');
      if (/^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model)) r.model += ' (snapshot unspecified)';
      const key = JSON.stringify([r.model, r.setting, r.harness]);
      if (seen.has(key)) throw new Error('Duplicate model configuration: ' + key);
      seen.add(key);
    }
    return rows;
  },
};
export default board;
