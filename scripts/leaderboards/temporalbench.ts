// TemporalBench: overall Multiple Binary Accuracy in percent is the primary QA score. Binary accuracy, short/long video splits, and captioning similarity remain separate metrics. Frame counts distinguish configurations, including zero-frame baselines; human and random references are excluded.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables, text } from '../lib/html.ts';

const FEED = "https://temporalbench.github.io/";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "temporalbench",
  url: "https://temporalbench.github.io/",
  feed: FEED,
  terms: "Public results published by the benchmark authors at temporalbench.github.io; retain source attribution and follow the upstream terms.",
  aliases: {},
  
  async fetch() {
    const t = tables(await fetchText(FEED)).find(t => t[0]?.some(c => c.text === 'Overall QA (%)'));
    if (!t) throw new Error('TemporalBench QA table missing');
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(2)) {
      const name = r[1]?.text, score = num(r[4]?.text);
      if (!name || /human|random/i.test(name) || score === undefined) continue;
      const metrics: Record<string, number> = {};
      ['overallBinary', 'shortMultipleBinary', 'shortBinary', 'longMultipleBinary', 'longBinary', 'captionSimilarity'].forEach((key, i) => { const n = num(r[i + 5]?.text); if (n !== undefined) metrics[key] = n; });
      rows.push({ model: identity(name), score, setting: `${r[2].text} frames`, date: /^\d{4}-\d{2}-\d{2}$/.test(r[3]?.text) ? r[3].text : undefined, metrics });
    }
    if (!rows.length) throw new Error('TemporalBench scores missing');
    return rows;
  },
};
export default board;
