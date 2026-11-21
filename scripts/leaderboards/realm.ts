// The source reports no overall score. The headline is the plain mean of the 16 parts, computed by this importer.
// REALM measures robot manipulation success across ten tasks. The reproducibility wiki gives each condition equal trials.
// Its three overlapping category averages are additional metrics. GR00T N1.5 used the authors' custom fine-tuned checkpoint.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { fetchText } from '../lib/util.ts';

const url = 'https://github.com/martin-sedlacek/REALM/wiki/Reproducibility';
const feed = 'https://raw.githubusercontent.com/wiki/martin-sedlacek/REALM/Reproducibility.md';
const conditions = ['Default', 'V-AUG', 'V-VIEW', 'V-SC', 'V-LIGHT', 'S-PROP', 'S-LANG', 'S-MO',
  'S-AFF', 'S-INT', 'B-HOBJ', 'SB-NOUN', 'SB-VRB', 'VB-POSE', 'VB-MOBJ', 'VSB-NOBJ'];
const labels = [...conditions, 'V-Avg.', 'S-Avg.', 'B-Avg.'];
const board: Leaderboard = {
  benchmark: 'realm', url, feed, static: 'paper',
  aliases: { 'π0': 'pi0' },
  terms: 'REALM publishes these paper results on its public wiki under GitHub’s terms. https://docs.github.com/en/site-policy/github-terms/github-terms-of-service',
  headline: 'The authors report no overall score, so this is the plain mean success rate across all 16 conditions.',
  parts: Object.fromEntries(labels.map(label => [label, label])),
  async fetch() {
    const text = await fetchText(feed);
    const table = text.split('## Paper results')[1]?.split('\n').filter(line => line.startsWith('|'))
      .map(line => line.split('|').slice(1, -1).map(cell => cell.trim().replaceAll('**', '')));
    if (!table || table[0].join('|') !== 'Perturbation|$\\pi_0$|$\\pi_0$-FAST|GR00T N1.5'
      || table.slice(2).map(row => row[0]).join('|') !== labels.join('|')) throw Error('REALM results table changed');
    const models = ['π0', 'π0-FAST', 'GR00T N1.5 (REALM custom fine-tuned checkpoint)'];
    return checked(models.map((model, i) => {
      const metrics: Record<string, number> = {};
      for (const [label, ...cells] of table.slice(2)) {
        const match = cells[i]?.match(/^(0(?:\.\d+)?|1(?:\.0+)?)(?:\s|$)/);
        if (!match) throw Error('Missing REALM success rate for ' + label);
        metrics[label] = Number((Number(match[1]) * 100).toFixed(6));
      }
      return { model, score: conditions.reduce((sum, label) => sum + metrics[label], 0) / conditions.length,
        metrics, trials: 4000 };
    }), 3);
  }
};
export default board;
