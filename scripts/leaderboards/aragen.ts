// AraGen: overall 3C3H score from the official results, multiplied by 100.
// Precision is a whole-benchmark configuration. The six dimensions remain metrics.
// The dated Gemini 2.5 Pro preview maps explicitly to the May 2025 snapshot.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://huggingface.co/spaces/inception42/Leaderboards/resolve/main/assets/results/aragen_v3_results.json";
const board: Leaderboard = {
  benchmark: "aragen",
  url: "https://huggingface.co/spaces/inception42/Leaderboards/resolve/main/assets/results/aragen_v3_results.json",
  feed: FEED,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  aliases: {"Mistral-Small-24B-Instruct-2501":"mistral-small-3", "Ministral-8B-Instruct-2410":"ministral-8b", "Mistral-Large-Instruct-2411":"mistral-large-2-nov-2024", "Magistral-Small-2509":"magistral-small-1-2", "Mistral-Small-4-119B-2603":"mistral-small-4", "gemini-2.5-pro-preview-05-06": "gemini-2-5-pro-may-2025", "Llama-3.1-8B-Instruct": "llama-3-1-8b", "Llama-3.1-70B-Instruct": "llama-3-1-70b", "Meta-Llama-3-70B-Instruct": "llama-3-70b", "Meta-Llama-3-8B-Instruct": "llama-3-8b", "Llama-3.2-1B-Instruct": "llama-3-2-1b", "Llama-3.2-3B-Instruct": "llama-3-2-3b"},
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = await (async (): Promise<LeaderboardRow[]> => {
      const d=await fetchJson<any[]>(FEED);
      return d.filter(r=>r.Meta&&r['claude-sonnet-4-20250514 Scores']?.['3C3H Scores']?.['3C3H Score']).map(r=>{const s=r['claude-sonnet-4-20250514 Scores']['3C3H Scores'];return {model:r.Meta['Model Name'].replace(/^[^/]+\//,''),score:s['3C3H Score'].value*100,setting:r.Meta.Precision,metrics:Object.fromEntries(Object.entries(s).filter(([k])=>k!=='3C3H Score').map(([k,v]:[string,any])=>[k.toLowerCase(),v.value*100]))};});
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
