// QwenSVG: official Qwen article table, preserving its published headline unit.
// QwenSVG and QwenSVGBench remain separate because the source does not establish an identical evaluation version.
// The Qwen3.7-Max and Qwen3.7-Plus articles reproduce identical shared baseline scores. Both model releases are retained. Conflicting shared scores fail the reader.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://qwen.ai/api/v2/article/?language=en-US&path=qwen3.7-plus&type=qwen_ai";
const board: Leaderboard = {
  benchmark: "qwensvg",
  url: "https://qwen.ai/api/v2/article/?language=en-US&path=qwen3.7-plus&type=qwen_ai",
  feed: FEED,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = await (async (): Promise<LeaderboardRow[]> => {
      const all:LeaderboardRow[]=[];for(const url of [FEED.replace('path=qwen3.7-plus','path=qwen3.7'),FEED]){if(all.length)await new Promise(r=>setTimeout(r,1100));const d=await fetchJson<any>(url);const t=tables(d.data.content).find(t=>t.some(r=>r[0]?.text==="QwenSVG"));if(!t)throw new Error('Qwen benchmark table missing');const r=t.find(r=>r[0]?.text==="QwenSVG")!;
      all.push(...r.slice(1).flatMap((c,i)=>{const score=num(c.text);if(score===undefined)return [];let name=t[0][i+1].text;const effort=name.match(/(?:\s|\()(xhigh|max|thinking)\)?$/i)?.[1];name=name.replace(/(?:\s|\()(xhigh|max|thinking)\)?$/i,'').replace(/^Opus[- ]?/,'Claude Opus ').replace(/^Fable[- ]?/,'Claude Fable ').replace(/^K2[.]6$/,'Kimi K2.6').replace(/^DS[- ]/,'DeepSeek-');return [{model:name,setting:effort?.toLowerCase(),score}];}));} const unique=new Map<string,LeaderboardRow>();for(const row of all){const key=JSON.stringify([row.model,row.setting]);if(unique.has(key)&&unique.get(key)!.score!==row.score)throw new Error('Qwen source versions disagree');unique.set(key,row);}return [...unique.values()];
    })();
    if (!rows.length) throw new Error('No whole-benchmark scores found');
    const seen = new Set<string>();
    for (const r of rows) {
      if (!r.model || !Number.isFinite(r.score)) throw new Error('Invalid model or score');
      if (/^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model)) r.model += ' (snapshot unspecified)';
      const key = JSON.stringify([r.model, r.setting, r.harness]);
      if (seen.has(key)) throw new Error('Duplicate model configuration: ' + key);
      seen.add(key);
    }
    return rows;
  },
};
export default board;
