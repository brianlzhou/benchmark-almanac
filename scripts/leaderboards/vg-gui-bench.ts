// VG-GUI-Bench (Tsinghua University, ECCV 2026): video-guided mobile GUI agent benchmark comparing seven frontier
// multimodal models under both No Video and 10 Uniform Frames settings. The project page publishes the results as a
// static HTML table reporting step Accuracy (%), Type Accuracy (%), Episode Completion (%) and Performance
// Improvement Rate (PIR, relative accuracy gain from adding the tutorial video).
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const URL = 'https://vg-gui-tasker.github.io/';

const board: Leaderboard = {
  benchmark: 'vg-gui-bench',
  url: URL,
  feed: URL,
  terms: 'The authors publish the VG-GUI-Bench leaderboard on GitHub Pages with no robots.txt restrictions.',
  static: 'paper',
  stats: {
    typeAccuracy: { name: 'Type accuracy', unit: '%', better: 'higher', note: 'Share of steps predicting the correct action type.' },
    completion: { name: 'Episode completion', unit: '%', better: 'higher', note: 'Proportion of correctly executed steps per episode, averaged across episodes.' },
    pir: { name: 'Performance improvement rate', unit: 'score', better: 'higher', note: 'Relative step accuracy gain from adding the tutorial video compared with No Video.' },
  },
  async fetch() {
    const html = await fetchText(URL);
    const head = ['#', 'Model', 'Setting', 'Acc. (%)', 'Type Acc. (%)', 'Comp. (%)', 'PIR'];
    const table = tables(html).find((t) => head.every((h, i) => t[0]?.[i]?.text === h));
    if (!table) throw new Error('VG-GUI-Bench leaderboard table missing');
    const out: LeaderboardRow[] = table.slice(1).map((row) => {
      const model = row[1]?.text;
      const setting = row[2]?.text;
      const score = num(row[3]?.text);
      const typeAccuracy = num(row[4]?.text);
      const completion = num(row[5]?.text);
      const pir = num(row[6]?.text);
      if (!model || !setting || score === undefined || typeAccuracy === undefined || completion === undefined) {
        throw new Error(`VG-GUI-Bench row changed: ${row.map((c) => c.text).join(' | ')}`);
      }
      const metrics: Record<string, number> = { typeAccuracy, completion };
      if (pir !== undefined) metrics.pir = pir;
      return {
        model,
        setting,
        score,
        metrics,
      };
    });
    if (out.length < 14) throw new Error(`VG-GUI-Bench table changed: only ${out.length} rows`);
    return out;
  },
};

export default board;
