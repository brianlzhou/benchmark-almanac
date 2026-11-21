// MIREX reports word error rate on MUSDB-ALT songs. The results and system descriptions come from the competition wiki.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const feed = "https://futuremirex.com/mirex/wiki/2026:Lyrics_Transcription_Results#MUSDB-ALT";

const board: Leaderboard = {
  benchmark: "musdb-alt",
  url: "https://futuremirex.com/mirex/wiki/2026:Lyrics_Transcription_Results#MUSDB-ALT",
  feed,
  terms: "The MIREX wiki lists GNU Free Documentation License 1.2 unless otherwise noted. https://futuremirex.com/mirex/wiki/2026:Lyrics_Transcription_Results The wiki returns 404 for robots.txt.",
  async fetch() {
    const html = await fetchText(feed);
    const systems = tables(html)[0];
    const [header, ...rows] = tables(html.split('id="MUSDB-ALT"')[1] ?? '')[0] ?? [];
    const columns = ["Team", "CER", "WER", "WER'", "F-score (P)", "F-score (B)", "F-score (L)", "F-score (S)"];
    if (rows.length < 5 || columns.some((col, i) => header?.[i]?.text !== col)) throw new Error('Missing MUSDB-ALT results');
    return rows.map(c => {
      const model = c[0].text.replace(/\(\d+\)$/, '');
      const system = systems.find(r => r[0].text === model);
      const metrics: Record<string, number> = {};
      for (const [i, key] of columns.entries()) {
        if (!i || c[i]?.text === 'NA') continue;
        const value = num(c[i]?.text);
        if (value === undefined) throw new Error('Missing ' + key + ' for ' + model);
        metrics[key] = Math.round(value * 10000) / 100;
      }
      const factor = num(system?.[5]?.text);
      if (factor !== undefined) metrics.inferenceRealTimeFactor = factor;
      return { model, score: metrics.WER, metrics, params: num(system?.[3]?.text), link: system?.[1]?.html.match(/href="([^"]+)"/)?.[1] };
    });
  },
};

export default board;
