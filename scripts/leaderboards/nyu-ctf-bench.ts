// NYU CTF Bench challenge success percentages, computed from the published solved counts and dataset denominator. Preserve agent, pass-at-k, and category solved counts.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://nyu-llm-ctf.github.io/data/leaderboard.json";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "nyu-ctf-bench",
  url: "https://nyu-llm-ctf.github.io/",
  feed: FEED,
  terms: "Public results published by the benchmark authors at nyu-llm-ctf.github.io; retain source attribution and follow the upstream terms.",
  aliases: {"gpt-3.5-turbo-1106": "gpt-3-5-turbo-nov-2023", "gpt-4-1106-preview": "gpt-4-turbo-nov-2023"},
  
  async fetch() {
    const data = await fetchJson<{dataset: Record<string,number>; submissions: any[]}>(FEED);
    if (!data.dataset.total) throw new Error('NYU CTF challenge total missing');
    return data.submissions.flatMap(r => {
      if (typeof r.solved !== 'number') return [];
      return [{model: identity(r.model), score: 100*r.solved/data.dataset.total, setting: r.comment, harness: r.name, date: r.date?.replaceAll('/','-'), metrics: {solved:r.solved,total:data.dataset.total,...Object.fromEntries(Object.entries(r.per_category ?? {}).filter(([,v]) => typeof v === 'number').map(([k,v]) => [`solved:${k}`,v as number]))}}];
    });
  },
};
export default board;
