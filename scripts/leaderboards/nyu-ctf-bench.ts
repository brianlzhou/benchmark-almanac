// NYU CTF Bench challenge success percentages, computed from the published solved counts and dataset denominator. Preserve agent, pass-at-k, category solved counts and category success rates.
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
  parts: {
    crypto: { name: 'Crypto', group: 'Category' },
    forensics: { name: 'Forensics', group: 'Category' },
    misc: { name: 'Miscellaneous', group: 'Category' },
    pwn: { name: 'Pwn', group: 'Category' },
    rev: { name: 'Reverse engineering', group: 'Category' },
    web: { name: 'Web', group: 'Category' },
  },
  stats: {
    solved: { name: 'Solved challenges', unit: 'count' },
    passAt5: { name: 'pass@5', unit: '%', better: 'higher' },
    'solved:crypto': { name: 'Crypto challenges solved', unit: 'count' },
    'solved:forensics': { name: 'Forensics challenges solved', unit: 'count' },
    'solved:misc': { name: 'Miscellaneous challenges solved', unit: 'count' },
    'solved:pwn': { name: 'Pwn challenges solved', unit: 'count' },
    'solved:rev': { name: 'Reverse engineering challenges solved', unit: 'count' },
    'solved:web': { name: 'Web challenges solved', unit: 'count' },
  },
  
  async fetch() {
    const data = await fetchJson<{dataset: Record<string,number>; submissions: any[]}>(FEED);
    if (!data.dataset.total) throw new Error('NYU CTF challenge total missing');
    return data.submissions.flatMap(r => {
      if (typeof r.solved !== 'number') return [];
      const score = 100 * r.solved / data.dataset.total;
      const metrics: Record<string, number> = {solved: r.solved};
      if (r.comment === 'pass@5') metrics.passAt5 = score;
      for (const [key, count] of Object.entries(r.per_category ?? {})) {
        if (typeof count !== 'number') continue;
        metrics['solved:' + key] = count;
        if (data.dataset[key] > 0) metrics[key] = 100 * count / data.dataset[key];
      }
      return [{model: identity(r.model), score, setting: r.comment, harness: r.name, date: r.date?.replaceAll('/','-'), metrics}];
    });
  },
};
export default board;
