// MTOP tests semantic parsing across six languages with flat and compositional output representations.
// Tables 2 and 3 average exact match over the five non-English target languages. Table 5 adds intent accuracy and slot F1.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';

const url = 'https://aclanthology.org/2021.eacl-main.257/';
const feed = 'https://aclanthology.org/2021.eacl-main.257.pdf';
const languages = ['en', 'es', 'fr', 'de', 'hi', 'th'];
const names = new Intl.DisplayNames('en', { type: 'language' });
const board: Leaderboard = {
  benchmark: 'mtop', static: 'paper', url, feed,
  terms: 'ACL Anthology copyright policy: https://aclanthology.org/faq/copyright/.',
  headline: 'The paper averages exact match across the five non-English target languages.',
  parts: Object.fromEntries(languages.map(k => [k, {name: names.of(k)!, group: 'Language'}])),
  async fetch() {
    const pdf = await pdfText(feed);
    const rows = new Map<string, LeaderboardRow>();
    for (const [num, caption, representation] of [
      [2, 'Results on flat representation', 'Flat'], [3, 'Results on compositional decoupled representation', 'Compositional'],
      [5, 'Intent Accuracy / Slot F1 for models', 'Flat'],
    ] as const) {
      const end = pdf.indexOf('Table ' + num + ': ' + caption);
      const table = pdf.slice(pdf.lastIndexOf('\f', end), end);
      const header = table.trimStart().split('\n')[0].trim().split(/\s+/).join(' ');
      if (end < 0 || header !== languages.join(' ') + (num === 5 ? '' : ' Avg(5 langs)')) throw new Error('Missing Table ' + num);
      let training = '';
      let count = 0;
      for (const raw of table.split('\n')) {
        const line = raw.trim();
        const group = line.match(/^(In-language|Multilingual|Zero-shot target language) models/);
        if (group) training = group[1];
        const cells = line.split(/\s{2,}/);
        if (!training || !/^(XLU biLSTM|XLM-R|mBART|CRISS|MARGE)\b/.test(cells[0])) continue;
        const [, model, variant] = cells.shift()!.match(/^(XLU biLSTM|XLM-R|mBART|CRISS|MARGE)(.*)$/)!;
        const setting = [representation, training, variant.replace(/(?: in)?\s*§[\d.]+/, '').trim()].filter(Boolean).join(', ');
        const key = JSON.stringify([model, setting]);
        const values = cells.join(' ').split(/\s+/);
        if (values.length !== (num === 5 ? 6 : 7)) throw new Error('Missing MTOP values: ' + line);
        if (num === 5) {
          const row = rows.get(key);
          if (!row) throw new Error('Missing flat representation row');
          languages.forEach((k, i) => {
            if (values[i] === 'N/A') return;
            const pair = values[i].split('/').map(numberCell);
            if (pair.length !== 2) throw new Error('Missing intent accuracy or slot F1');
            row.metrics![k + 'IntentAccuracy'] = pair[0];
            row.metrics![k + 'SlotF1'] = pair[1];
          });
        } else {
          if (rows.has(key)) throw new Error('Duplicate MTOP row');
          rows.set(key, {model, setting, score: numberCell(values[6]),
            metrics: Object.fromEntries(languages.flatMap((k,i) => values[i] === 'N/A' ? [] : [[k, numberCell(values[i])]]))});
        }
        count++;
      }
      if (count !== (num === 3 ? 13 : 8)) throw new Error('Incomplete Table ' + num);
    }
    return checked([...rows.values()], 21);
  },
};
export default board;
