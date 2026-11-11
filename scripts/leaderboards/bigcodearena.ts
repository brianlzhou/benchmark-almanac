// BigCodeArena's read-only Gradio load callback publishes the same Elo table as its UI.
// Call only update_ranking_display, never the vote or model-generation callbacks.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
const BASE = 'https://bigcode-arena.hf.space/gradio_api/call/update_ranking_display';
const board: Leaderboard = {
  benchmark: 'bigcodearena', url: 'https://huggingface.co/spaces/bigcode/arena', feed: BASE,
  terms: 'Public BigCodeArena leaderboard callback. Hugging Face and repository terms apply. The almanac credits and links the source.',
  aliases: {
    'qwen3-235b-a22b-thinking-2507': 'qwen3-235b-a22b-thinking-jul-2025',
    'qwen3-235b-a22b-instruct-2507': 'qwen3-235b-a22b-instruct-jul-2025',
    'qwen3-30b-a3b-instruct-2507': 'qwen3-30b-a3b-instruct-jul-2025',
    'qwen3-30b-a3b-thinking-2507': 'qwen3-30b-a3b-thinking-jul-2025',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const response = await fetch(BASE, {method:'POST', headers:{'content-type':'application/json',
      'user-agent':'benchmark-almanac (+https://github.com/brianlzhou/benchmark-almanac)'},
      body:JSON.stringify({data:[]}), signal:AbortSignal.timeout(45000)});
    if (!response.ok) throw new Error(`BigCodeArena callback ${response.status}`);
    const {event_id} = await response.json() as {event_id:string};
    if (!/^[a-f0-9]+$/.test(event_id)) throw new Error('BigCodeArena event id missing');
    await new Promise(r=>setTimeout(r,2100));
    const stream = await fetchText(`${BASE}/${event_id}`);
    const block = stream.split(/\r?\n\r?\n/).find(b=>b.startsWith('event: complete'));
    const payload = block?.split(/\r?\n/).find(l=>l.startsWith('data: '))?.slice(6);
    if (!payload) throw new Error('BigCodeArena table callback incomplete');
    const data = JSON.parse(payload)[0]?.value as {headers:string[];data:unknown[][]};
    const rows: LeaderboardRow[] = [];
    for (const row of data.data) {
      const at = (h:string)=>row[data.headers.indexOf(h)];
      const score=at('Score'), ci=at('95% CI (±)'), votes=at('Votes');
      if (typeof at('Model')!=='string' || typeof score!=='number' || !Number.isFinite(score)) continue;
      const metrics:Record<string,number>={};
      if(typeof ci==='number') Object.assign(metrics,{ciLow:score-ci,ciHigh:score+ci});
      if(typeof votes==='number') metrics.votes=votes;
      rows.push({model:at('Model') as string,score,metrics});
    }
    if(!rows.length) throw new Error('BigCodeArena returned no ratings');
    return rows;
  },
};
export default board;
