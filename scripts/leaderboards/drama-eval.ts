// DRAMA-Eval tests bilingual, multi-speaker speech generation. Chinese character error rate is the first measure.
// The leaderboard combines its original JSON with two extension arrays. English word error rate, speaker
// similarity and six judgment scores remain separate because they measure different properties.
import type { Leaderboard, BoardPart } from './types.ts';
import { fetchText, fetchJson } from '../lib/util.ts';
import { jsLiteral } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://aslp-lab.github.io/DRAMA-Eval-Demo/';
const feed = url + 'data/metrics.json';
const labels = { A1: 'WER/CER', A2: 'Spk-Sim', B1: 'Instruction', B2: 'Prosody',
  B3: 'Expressiveness', C1: 'Interaction', C2: 'Global Flow', C3: 'Immersion' };
type Row = { Model: string } & Record<keyof typeof labels, number | null>;
const parts: Record<string, BoardPart> = {};
for (const [lang, group] of [['zh', 'Chinese'], ['en', 'English']]) {
  for (const [key, label] of Object.entries(labels)) {
    parts[lang + key] = { name: key === 'A1' ? (lang === 'zh' ? 'CER' : 'WER') : label,
      group, unit: key === 'A1' ? '%' : 'score', better: key === 'A1' ? 'lower' : 'higher' };
  }
}
const board: Leaderboard = {
  benchmark: 'drama-eval', url, feed, parts,
  terms: 'ASLP-lab publishes the leaderboard on GitHub Pages. https://github.com/ASLP-lab/DRAMA-Eval-Demo',
  async fetch() {
    const data = await fetchJson<Record<string, Row[]>>(feed);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const script = await fetchText(url + 'js/main.js');
    const models = new Map<string, Record<string, number>>();
    for (const [lang, variable] of [['zh', 'newModelsZh'], ['en', 'newModelsEn']]) {
      const block = script.match(new RegExp('const ' + variable + ' = (\\[[\\s\\S]*?\\]);'))?.[1];
      if (!block) throw new Error('Missing DRAMA-Eval extension');
      const extra = jsLiteral<Row[]>(block.replace(/'([^'\\]*)'/g, (_, value: string) => JSON.stringify(value)), 0);
      for (const row of data[lang].concat(extra)) {
        const metrics = models.get(row.Model) ?? {};
        if (lang + 'A1' in metrics) throw new Error('Duplicate language score');
        for (const key of Object.keys(labels) as (keyof typeof labels)[]) {
          const value = row[key];
          if (value === null && key === 'B1') continue;
          if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error('Missing score: ' + lang + key);
          metrics[lang + key] = value;
        }
        models.set(row.Model, metrics);
      }
    }
    return checked([...models].map(([model, metrics]) => ({ model, metrics, score: metrics.zhA1 })), 17);
  },
};
export default board;
