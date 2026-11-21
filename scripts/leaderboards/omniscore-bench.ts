// OmniScore-Bench tests music score reading. Table 2 gives strict group-macro percentages,
// and Table 5 gives corpus normalized edit distance times 100, where lower is better.
// The first column of Table 2 is localization F1 for noteheads and rests.
import type { Leaderboard } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://arxiv.org/html/2611.17870';
const names = [
  ['Noteheads and rests', 'Clefs and accidentals', 'Rhythmic marks', 'Expression symbols'],
  ['Systems and staves', 'Measure regions', 'Structural membership', 'Continuation'],
  ['Tie and slur endpoints', 'Chord and beam groups', 'Cross-voice timing', 'Additional typed connections'],
  ['Monophonic excerpts', 'Single-staff polyphony', 'Single-page transcription', 'Multipage transcription'],
  ['Meter and timing', 'Written and sounding pitch', 'Sounding events', 'Repeat traversal'],
  ['Visible fact extraction', 'Counting and conditional retrieval', 'Conditional musical analysis', 'Fragment transformation'],
];
const labels = names.flatMap((group, i) => group.map((name, j) => ({ id: (i+1)+'.'+(j+1), name, transcription: i === 3 })));
const board: Leaderboard = {
  benchmark: 'omniscore-bench', static: 'paper', url, feed: url,
  terms: 'The authors publish their results on arXiv under the terms at https://arxiv.org/abs/2611.17870.',
  headline: 'The paper gives no overall score, so the headline is its first measure, localization F1 for noteheads and rests, in percent.',
  parts: Object.fromEntries(labels.map(l => ['T'+l.id, { name: 'T'+l.id+': '+l.name, unit: l.transcription ? 'score' : '%', better: l.transcription ? 'lower' : 'higher' }])),
  async fetch() {
    const tables = flatPaperTables(await paperHtml(url)).map(grid);
    const profile = tables.find(t => t[1]?.join('|') === ['Model', ...labels.filter(l => !l.transcription).map(l => l.id)].join('|'));
    const transcription = tables.find(t => t[0].join('|') === 'Model|T4.1|T4.2|T4.3|T4.4');
    if (!profile || !transcription) throw new Error('Missing OmniScore-Bench results');
    return checked(profile.slice(2).map(([model, ...values]) => {
      const errors = transcription.slice(1).find(r => r[0] === model)?.slice(1);
      if (values.length !== 20 || errors?.length !== 4) throw new Error('Incomplete results for '+model);
      const metrics = Object.fromEntries([...values.slice(0,12), ...errors, ...values.slice(12)].map((v,i) => ['T'+labels[i].id, numberCell(v)]));
      return { model, score: metrics['T1.1'], metrics };
    }), 12);
  },
};
export default board;
