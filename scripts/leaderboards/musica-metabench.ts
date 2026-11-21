// MusICA-MetaBench tests music understanding in multiple modalities. The fixed seed 52 results file gives the overall accuracy and each criterion breakdown.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const feed = "https://raw.githubusercontent.com/tomsouri/MusICA-MetaBench/main/aggregated/models_comparison/size_20/seed_52/normal/accuracy_only.tsv";

const board: Leaderboard = {
  benchmark: "musica-metabench",
  url: "https://github.com/tomsouri/MusICA-MetaBench/blob/main/aggregated/models_comparison/size_20/seed_52/normal/accuracy_only.tsv",
  feed,
  terms: "The authors provide outputs for reproducibility without a separate license. The two underlying music datasets have different licenses. https://github.com/tomsouri/MusICA-MetaBench#license The feed host returns no robots.txt.",
  harnesses: 'system',
  async fetch() {
    const [header, ...records] = (await fetchText(feed)).trim().split(/\r?\n/).map(line => line.split('\t'));
    if (header.slice(0, 3).join('|') !== 'Criterion_Type|Criterion_Value|Total_Items' || header.length < 12) throw new Error('Incomplete model columns');
    const overall = records.find(r => r[0] === 'OVERALL' && r[1] === 'ALL');
    if (!overall || Number(overall[2]) !== 300) throw new Error('Missing fixed test result');
    board.parts = {};
    return header.slice(3).map((model, i) => {
      const score = Number.parseFloat(overall[i + 3]);
      if (!Number.isFinite(score)) throw new Error('Missing overall accuracy');
      const metrics: Record<string, number> = {};
      for (const [group, name, , ...values] of records) {
        if (group === 'OVERALL') continue;
        const key = group + '/' + name;
        board.parts![key] = { name, group };
        const value = Number.parseFloat(values[i]);
        if (!Number.isFinite(value)) throw new Error('Missing criterion score');
        metrics[key] = value;
      }
      return { model, score, metrics, harness: model.startsWith('aggregate-') ? model : undefined };
    });
  },
};
export default board;
