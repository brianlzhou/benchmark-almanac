// BABE paper Table 2 publishes Average Score across the full benchmark. The HTML encodes its table with spans, which this reader converts to table tags. These static paper rows will not refresh. Strong and weak correlation groups remain metrics. Source model labels remain intact when snapshots are ambiguous.
// Azure Claude mode suffixes become settings. Explicit GPT date codes map to their matching snapshots.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';

const FEED = "https://arxiv.org/html/2602.05857";
const board: Leaderboard = {
  benchmark: "babe",
  url: "https://arxiv.org/html/2602.05857",
  feed: FEED,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  aliases: {"gpt4.1-0414": "gpt-4-1", "GPT4o-1120": "gpt-4o-nov-2024"},
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = await (async (): Promise<LeaderboardRow[]> => {

const s=(await fetchText(FEED)).replace(/<annotation\b[\s\S]*?<\/annotation>/g,'');const stack:string[]=[];
const html=s.replace(/<(\/?)span\b([^>]*)>/g,(whole,close,attrs)=>{if(close)return `</${stack.pop()||'span'}>`;const tag=/\bltx_tabular\b/.test(attrs)?'table':/\bltx_tr\b/.test(attrs)?'tr':/\bltx_td\b/.test(attrs)?'td':'span';stack.push(tag);return `<${tag}${attrs}>`;});
const t=tables(html).find(t=>t[0]?.[0]?.text==='Model Name'&&t[0]?.[1]?.text==='Average Score');if(!t)throw new Error('BABE comparison table missing');
return t.slice(1).filter(r=>r.length===4).map(r=>({model:r[0].text.replace(/^OpenAI-/,'').replace(/^(Claude-.*)-(?:nothinking|thinking)-azure$/,'$1').replace(/^Gemini-2\.5-Pro$/,'Gemini-2.5-Pro (snapshot unspecified)'),setting:/Claude-.*-thinking-azure$/.test(r[0].text)?'thinking':/Claude-.*-nothinking-azure$/.test(r[0].text)?'non-thinking':undefined,score:num(r[1].text)!,metrics:{strongCorrelation:num(r[2].text)!,weakCorrelation:num(r[3].text)!}}));

    })();
    if (!rows.length) throw new Error('No whole-benchmark scores found');
    const seen = new Set<string>();
    for (const r of rows) {
      if (!r.model || !Number.isFinite(r.score)) throw new Error('Invalid model or score');
      if (r.score < 0 || r.score > 100) throw new Error('Score outside percent range');
      if (/^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|gemini[- ]?2[.](?:0|5)[- ]?flash(?:[- ]?lite)?|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model)) r.model += ' (snapshot unspecified)';
      const key = JSON.stringify([r.model, r.setting, r.harness]);
      if (seen.has(key)) throw new Error('Duplicate model configuration: ' + key);
      seen.add(key);
    }
    return rows;
  },
};
export default board;
