// AfriHate tests hate and abusive language classification. The headline is the paper's average macro F1 in percent.
// Tables 8 and 11 report fine-tuned and few-shot models across 15 languages. Table 12 adds accuracy for the few-shot settings.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2501.08284v1';
const languages = 'amh ary arq hau ibo kin oro pcm som swa tir twi xho yor zul'.split(' ');
const board: Leaderboard = {
  benchmark: 'afrihate', url: feed, feed, static: 'paper',
  terms: 'CC BY 4.0. https://arxiv.org/abs/2501.08284v1',
  parts: Object.fromEntries(languages.map(lang => [lang, { name: lang, group: 'Language' }])),
  stats: {
    accuracy: { name: 'Accuracy', unit: '%', better: 'higher' },
    amhAccuracy: { name: 'Amharic accuracy', unit: '%', better: 'higher' },
    aryAccuracy: { name: 'Moroccan Arabic accuracy', unit: '%', better: 'higher' },
    arqAccuracy: { name: 'Algerian Arabic accuracy', unit: '%', better: 'higher' },
    hauAccuracy: { name: 'Hausa accuracy', unit: '%', better: 'higher' },
    iboAccuracy: { name: 'Igbo accuracy', unit: '%', better: 'higher' },
    kinAccuracy: { name: 'Kinyarwanda accuracy', unit: '%', better: 'higher' },
    oroAccuracy: { name: 'Oromo accuracy', unit: '%', better: 'higher' },
    pcmAccuracy: { name: 'Nigerian Pidgin accuracy', unit: '%', better: 'higher' },
    somAccuracy: { name: 'Somali accuracy', unit: '%', better: 'higher' },
    swaAccuracy: { name: 'Swahili accuracy', unit: '%', better: 'higher' },
    tirAccuracy: { name: 'Tigrinya accuracy', unit: '%', better: 'higher' },
    twiAccuracy: { name: 'Twi accuracy', unit: '%', better: 'higher' },
    xhoAccuracy: { name: 'Xhosa accuracy', unit: '%', better: 'higher' },
    yorAccuracy: { name: 'Yoruba accuracy', unit: '%', better: 'higher' },
    zulAccuracy: { name: 'Zulu accuracy', unit: '%', better: 'higher' },
  },
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const samples = (t: string[][], offset: number) => t[0].slice(offset, -1).join() === languages.join() && t[0].at(-1)?.toLowerCase() === 'avg.';
    const fine = tables.find(t => samples(t, 1));
    const few = tables.find(t => samples(t, 2) && t[0][0] === 'Model' && t.some(r => r[0] === 'InkubaLM-0.4B'));
    const accuracy = tables.find(t => samples(t, 2) && t[0][0] === 'model');
    if (!fine || !few || !accuracy) throw new Error('Missing full AfriHate result tables');
    function numbers(v: string[]) {
      if (v.length !== languages.length + 1 || v.some(s => !/^\d+(\.\d+)?$/.test(s))) throw new Error('Invalid language scores');
      return v.map(Number);
    }
    const parts = (v: number[]) => Object.fromEntries(languages.map((l, i) => [l, v[i]]));
    const rows: LeaderboardRow[] = [];
    let setting = '';
    for (const [model, ...cells] of fine.slice(1)) {
      if (model === 'Monolingual' || model === 'Multilingual') { setting = model + ' fine-tuning'; continue; }
      const v = numbers(cells);
      rows.push({ model, setting, trials: 5, score: v.at(-1)!, metrics: parts(v) });
    }
    function shotRows(table: string[][]) {
      const result = new Map<string, { model: string; shots: string; v: number[] }>();
      let model = '';
      for (const [label, shots, ...cells] of table.slice(1)) {
        if (label === 'Lang. avg.') continue;
        if (label) model = label;
        if (!model || !/^\d+$/.test(shots)) throw new Error('Invalid shot count or model');
        result.set(model + '/' + shots, { model, shots, v: numbers(cells) });
      }
      return result;
    }
    const acc = shotRows(accuracy);
    for (const [id, { model, shots, v }] of shotRows(few)) {
      const a = acc.get(id);
      if (!a) throw new Error('Missing accuracy for ' + id);
      const metrics = parts(v);
      metrics.accuracy = a.v.at(-1)!;
      languages.forEach((l, i) => { metrics[l + 'Accuracy'] = a.v[i]; });
      rows.push({ model: model === 'SetFit' ? 'LaBSE' : model, harness: model === 'SetFit' ? 'SetFit' : undefined,
        setting: shots + '-shot', metrics, score: v.at(-1)! });
    }
    return checked(rows, 49);
  },
};
export default board;
