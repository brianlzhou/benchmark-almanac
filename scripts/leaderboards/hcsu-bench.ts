// HCSU ranks models by average Chinese calligraphy style recognition accuracy.
// The benchmark README separates ink manuscripts and stone rubbings and also scores written critiques.
import type { Leaderboard } from './types.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { fetchText } from '../lib/util.ts';

const feed = "https://raw.githubusercontent.com/209-Tongji/HCSU/HEAD/Benchmark/README.md";


const board: Leaderboard = {
  benchmark: "hcsu-bench",
  url: "https://github.com/209-Tongji/HCSU/blob/main/Benchmark/README.md",
  feed,
  terms: "The authors license repository documentation under Apache 2.0 and benchmark data under CC BY-NC 4.0. https://github.com/209-Tongji/HCSU/blob/main/Benchmark/README.md The raw file host has no robots.txt rules.",
  parts: { bei: 'Bei (Stone Rubbing) Acc', tie: 'Tie (Ink Manuscript) Acc' },
  stats: {
    beiTerminology: { name: 'Bei terminology score', unit: 'score', better: 'higher' },
    beiRichness: { name: 'Bei richness score', unit: 'score', better: 'higher' },
    tieTerminology: { name: 'Tie terminology score', unit: 'score', better: 'higher' },
    tieRichness: { name: 'Tie richness score', unit: 'score', better: 'higher' },
  },
  async fetch() {
    const ts = markdownTables(await fetchText(feed));
    const styles = ts.find(t => t[0].includes('Avg. Acc'));
    const critiques = ts.find(t => t[0].includes('Bei (Stone Rubbing) Term. / Rich.'));
    if (!styles || !critiques || styles[0][1] !== 'Model Name' || styles[0][2] !== 'Bei (Stone Rubbing) Acc' || styles[0][3] !== 'Tie (Ink Manuscript) Acc') throw new Error('Missing HCSU columns');
    const name = (s: string) => s.replace('👑','').trim();
    let category = '';
    const rows = styles.slice(1).map(([group, label, a, b, avg]) => {
      category = group || category;
      const model = name(label);
      const c = critiques.find(row => name(row[1]) === model);
      if (!c) throw new Error('Missing critique scores for ' + model);
      const [bt,br,tt,tr] = c.slice(2).flatMap(cell => cell.split('/').map(s => parseFloat(s)));
      const metrics = { bei: parseFloat(a), tie: parseFloat(b), beiTerminology: bt, beiRichness: br, tieTerminology: tt, tieRichness: tr };
      const score = parseFloat(avg);
      if (![score,...Object.values(metrics)].every(Number.isFinite)) throw new Error('Invalid HCSU score: ' + model);
      return { model, score, open: category === 'Open-Weight', metrics };
    });
    if (rows.length < 9) throw new Error('Expected nine HCSU models');
    return rows;
  },
};
export default board;
