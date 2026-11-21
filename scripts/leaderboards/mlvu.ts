// MLVU: use the full Test leaderboard M-Avg, the published multiple-choice percentage.
// Dev uses different questions and option counts, so exclude it. Frame sampling is a
// whole-benchmark configuration. Generative and task scores remain secondary metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';
import { mdTables } from './big-bench-extra-hard.ts';
const FEED = "https://raw.githubusercontent.com/JUNJIE99/MLVU/main/README.md";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "mlvu",
  parts: {
    TR: { name: 'Topic reasoning', group: 'Task type' },
    AR: { name: 'Anomaly recognition', group: 'Task type' },
    NQA: { name: 'Needle QA', group: 'Task type' },
    ER: { name: 'Ego reasoning', group: 'Task type' },
    PQA: { name: 'Plot QA', group: 'Task type' },
    SQA: { name: 'Sports QA', group: 'Task type' },
    AO: { name: 'Action order', group: 'Task type' },
    AC: { name: 'Action count', group: 'Task type' },
    TQA: { name: 'Tutorial QA', group: 'Task type' },
    SSC: { name: 'Spatial scene comprehension', group: 'Task' },
    VS: { name: 'Visual summary', group: 'Task' },
    'G-Avg': { name: 'General average', group: 'Task' },
  },
  url: "https://github.com/JUNJIE99/MLVU",
  feed: FEED,
  terms: "Public results published by the benchmark authors at raw.githubusercontent.com; retain source attribution and follow the upstream terms.",
  aliases: {},
  
  async fetch() {
    const out: LeaderboardRow[] = [];
    const md = await fetchText(FEED);
    const code = new Map([...md.matchAll(/\[([^\]]+)\]\((https:\/\/github\.com\/[^)]+)\)/g)].map(m => [m[1], m[2]]));
    for (const t of mdTables(md)) {
      const at = t.head.findIndex(h => h.toLowerCase() === 'm-avg');
      if (at < 0 || !/MLVU-Test/i.test(t.heading)) continue;
      for (const r of t.rows) {
        const score = num(r[at]);
        if (!r[0] || /full mark|human|random/i.test(r[0]) || score === undefined) continue;
        const size = r[2];
        // A trailing asterisk marks an authors' evaluation, not a model snapshot.
        // Remove it before the ambiguity guard so GPT-4o* cannot resolve to a later release.
        const sourceName = r[0].replace(/\*+$/, '').trim();
        const name = /\d+B/i.test(size) && !/\d+B/i.test(sourceName) ? `${sourceName} ${size}` : sourceName;
        const metrics: Record<string, number> = {};
        for (let i = 3; i < t.head.length; i++) { const v = num(r[i]); if (i !== at && v !== undefined) metrics[t.head[i]] = v; }
        out.push({ model: identity(name), score, setting: r[1], link: code.get(r[0]), params: /^\d+(?:\.\d+)?B$/i.test(size) ? parseFloat(size) : undefined, open: /\*$/.test(r[0]) ? false : undefined, metrics });
      }
    }
    if (!out.length) throw new Error('MLVU tables missing');
    return out;
  },
};
export default board;
