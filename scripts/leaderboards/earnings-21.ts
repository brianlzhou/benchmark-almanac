// Earnings-21 measures word error rate on recorded earnings calls. The authors'
// transcript README reports full-corpus WER and breaks it down by subset, entity,
// sector and sampling rate. Lower WER is better.
import type { Leaderboard, BoardPart } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';

const url = 'https://github.com/revdotcom/speech-datasets/tree/main/earnings21/transcripts';
const feed = 'https://raw.githubusercontent.com/revdotcom/speech-datasets/main/earnings21/transcripts/README.md';
export default {
  benchmark: 'earnings-21', url, feed, terms: 'CC BY-SA 4.0. https://creativecommons.org/licenses/by-sa/4.0/',
  parts: {} as Record<string,BoardPart>,
  async fetch() {
    const sections = (await fetchText(feed)).split(/^## /m).slice(1);
    let models: string[] = [];
    const values = new Map<string,number[]>();
    for (const section of sections) {
      const lines = section.split('\n').filter(line => line.startsWith('|'));
      if (!lines.length) continue;
      const cells = (line: string) => line.slice(1,-1).split('|').map(c => c.replace(/<br\s*\/?>/gi,' ').replace(/^_|_$/g,'').trim());
      const header = cells(lines[0]).slice(1);
      if (models.length && models.join('|') !== header.join('|')) throw new Error('Inconsistent ASR columns');
      models = header;
      for (const line of lines.slice(2)) {
        const [name,...scores] = cells(line);
        if (scores.length !== models.length || values.has(name)) throw new Error('Invalid WER row: ' + line);
        values.set(name,scores.map(numberCell));
      }
    }
    const full = values.get('Earnings21');
    if (!full || !values.has('Eval-10') || !values.has('Mean Sector') || !values.has('Mean Entity') || !values.has('Mean Sample Rate')) throw new Error('Missing WER sections');
    values.delete('Earnings21');
    const rows = models.map((model,i) => {
      const metrics: Record<string,number> = {};
      for (const [name,valuesByModel] of values) {
        const key = 'wer' + name.replace(/[^a-z0-9]/gi,'');
        if (this.parts) this.parts[key] = {name: /^\d+$/.test(name) ? name + ' Hz' : name, unit: '%', better: 'lower'};
        const value = valuesByModel[i];
        if (value !== undefined) metrics[key] = value;
      }
      return {model, score: full[i], metrics};
    });
    return checked(rows,7);
  },
} satisfies Leaderboard;
