// The source reports no overall score. The headline is the plain mean of the 6 parts, computed by this importer.
// AudioSep separates a sound identified by a text query. Table III of the original project paper
// reports SI-SDR and SDR improvement in decibels for the six released separation sets.
// Voicebank-DEMAND evaluates speech enhancement separately.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://audio-agi.github.io/Separate-Anything-You-Describe/AudioSep_arXiv.pdf';
const sets = ['AudioSet', 'VGGSound', 'AudioCaps', 'Clotho', 'MUSIC', 'ESC-50'];
const parts: NonNullable<Leaderboard['parts']> = {};
for (const dataset of sets) {
  for (const metric of ['SI-SDR', 'SDRi']) {
    const name = dataset + ' ' + metric;
    parts[name] = { name, unit: 'score', note: 'Decibels' };
  }
}
const board: Leaderboard = {
  benchmark: 'audiosep-eval-benchmark', url: feed, feed, static: 'paper',
  terms: 'Results credited to Xubo Liu and colleagues. ' + feed,
  headline: 'The paper gives no overall score, so the headline averages SI-SDR in decibels across the six released separation sets.',
  parts,
  async fetch() {
    const paper = await pdfText(feed);
    const section = paper.match(/AudioSet\s+VGGSound\s+AudioCaps\s+Clotho\s+MUSIC\s+ESC-50\s+VoicebankDemand\s*\n([^\n]+)\n([\s\S]+?)\n\s*\n/);
    if (!section || section[1].trim().split(/\s+/).join(' ') !== [...sets.flatMap(() => ['SI-SDR', 'SDRi']), 'PESQ', 'SSNR'].join(' ')) throw new Error('Missing Table III columns');
    const rows = [];
    for (const line of section[2].trim().split('\n')) {
      const cells = line.trim().split(/\s+/);
      const numbers = cells.splice(-14);
      const model = cells.join(' ').replace(/\s*\[\d+\]$/, '');
      if (!model || numbers.length !== 14 || numbers.some(v => !/^(?:-|[-+]?\d+(?:\.\d+)?)$/.test(v))) throw new Error('Invalid Table III row: ' + line);
      if (numbers.slice(0,12).includes('-')) continue;
      const metrics = Object.fromEntries(Object.keys(parts).map((k,i) => [k, Number(numbers[i])]));
      const score = sets.reduce((sum,dataset) => sum + metrics[dataset + ' SI-SDR'], 0) / sets.length;
      rows.push({ model, score, metrics });
    }
    return checked(rows, 4);
  },
};
export default board;
