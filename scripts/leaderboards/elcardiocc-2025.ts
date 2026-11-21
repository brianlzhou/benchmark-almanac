// The source reports no overall score. The headline is the plain mean of the 3 parts, computed by this importer.
// ELCardioCC tests clinical coding of Greek discharge letters. The board reports F1 on mention recognition,
// entity linking and document coding. The organizers specify that explainability (3b) is optional.
// The overview and Huang's Table 3 identify the models in each team's submission.
// https://ceur-ws.org/Vol-4038/paper_4.pdf and https://ceur-ws.org/Vol-4038/paper_21.pdf
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { tables } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://participants-area.bioasq.org/results/ElCardioCC/';
const board: Leaderboard = {
  benchmark: 'elcardiocc-2025', url: feed, feed, harnesses: 'system',
  terms: 'BioASQ publishes the shared task results. https://participants-area.bioasq.org/results/ElCardioCC/',
  parts: { ner: 'Named Entity Recognition', el: 'Entity Linking', mlc: 'Multi-Label Classification' },
  async fetch() {
    const t = tables(await fetchText(feed)).map(table => table.map(row => row.map(c => c.text)));
    const headings = ['Team Name', 'System', 'R', 'P', 'F1'];
    if (t.length !== 3 || !t.slice(0, 2).every(x => JSON.stringify(x[0]) === JSON.stringify(headings))
      || t[2][0][2] !== 'SubTask 3a (MLC-X)' || t[2][1].join() !== 'R,P,F1,R,P,F1') throw new Error('Changed ELCardioCC columns');
    const rows: LeaderboardRow[] = [];
    for (const [team, system] of t[0].slice(1)) {
      const matches = t.map(table => table.find(row => row[0] === team && row[1] === system));
      if (!matches.every(row => row !== undefined)) continue;
      const models = team === 'droidlyx' ? ['bert-base-greek-uncased-v1', 'SapBERT'] :
        team === 'bhuang' && /^[1-5]nm$/.test(system) ? ['Gemma-3', 'Phi-4', 'Gemini', 'MedCPT-Cross-Encoder'] : undefined;
      if (!models) throw new Error('Unreviewed complete system: ' + system);
      const metrics: Record<string, number> = {};
      ['ner', 'el', 'mlc'].forEach((key, i) => {
        const [r, p, f1] = matches[i]!.slice(2, 5);
        if (![r, p, f1].every(v => /^(0(?:\.\d+)?|1(?:\.0+)?)$/.test(v))) throw new Error('Invalid F1 table');
        metrics[key + 'Recall'] = Number(r);
        metrics[key + 'Precision'] = Number(p);
        metrics[key] = Number(f1);
      });
      rows.push({ model: models[0], models, submitter: team, harness: team + ' ' + system,
        metrics, score: (metrics.ner + metrics.el + metrics.mlc) / 3 });
    }
    return checked(rows, 6);
  },
};
export default board;
