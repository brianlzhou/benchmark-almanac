// IndicIPR-QA tests extraction of answers from Indian intellectual property statutes.
// The authors report token F1 out of 100 on the 344-question test set.
// The encoder evaluation file gives results by act. The dataset card adds lexical and prompted results.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';
import { fetchJson, fetchText } from '../lib/util.ts';

const feed = 'https://raw.githubusercontent.com/niloycste/Indic-IPR-Dataset-/HEAD/results/evaluation/qa_eval_report.json';
const url = 'https://huggingface.co/datasets/niloycste68/IndicIPRExtractiveQA';
const parts = {
  copyright_act: 'Copyright', design_act: 'Designs', gi_act: 'Geographical Indications',
  patent_act: 'Patents', plant_varieties_farmers_rights_act: 'Plant Varieties',
  semiconductor_layout_design_act: 'Semiconductor', trademark_act: 'Trade Marks',
};
type Scores = { em: number; f1: number; char_f1: number };
type Encoder = Scores & { label: string; per_act: Record<string, Scores & {count: number}> };

const board: Leaderboard = {
  benchmark: 'indicipr-qa', url, feed, parts,
  terms: 'The authors describe research and educational use at ' + url + '#indicipr-qa.',
  stats: { exactMatch:{name:'Exact match',unit:'%',better:'higher'}, charF1:{name:'Character F1',unit:'%',better:'higher'}, questions:{name:'Questions',unit:'count'}, ...Object.fromEntries(Object.entries(parts).flatMap(([key,name])=>[[key+'ExactMatch',{name:name+' exact match',unit:'%',better:'higher'}],[key+'CharF1',{name:name+' character F1',unit:'%',better:'higher'}],[key+'Count',{name:name+' questions',unit:'count'}]])) },
  async fetch() {
    const [report, card] = await Promise.all([
      fetchJson<{test_records: number; results_summary: Encoder[]}>(feed), fetchText(url + '/raw/main/README.md'),
    ]);
    const rows: LeaderboardRow[] = report.results_summary.map(result => {
      const model = result.label.match(/^[A-Z] *: *(.+) direct$/)?.[1];
      if (!model) throw new Error('Unknown encoder label ' + result.label);
      const metrics: Record<string, number> = { exactMatch: result.em, charF1: result.char_f1, questions: report.test_records };
      for (const key of Object.keys(parts)) {
        const act = result.per_act[key];
        metrics[key] = act.f1;
        metrics[key + 'ExactMatch'] = act.em;
        metrics[key + 'CharF1'] = act.char_f1;
        metrics[key + 'Count'] = act.count;
      }
      if (!Object.values(metrics).every(Number.isFinite)) throw new Error('Incomplete encoder scores for ' + model);
      return { model, setting: 'Fine-tuned', score: result.f1, metrics };
    });
    for (const header of ['System | EM | F1 | Char-F1', 'Model | Setting | EM | F1 | Char-F1']) {
      const block = card.split('| ' + header + ' |')[1]?.trim().split(/\n\s*\n/)[0];
      if (!block) throw new Error('Missing dataset card table ' + header);
      for (const line of block.split('\n').slice(1)) {
        const cells = line.split('|').slice(1, -1).map(v => v.replaceAll('**', '').trim());
        const model = cells.shift()!;
        if (model.includes('Oracle')) continue;
        const setting = header.includes('Setting') ? cells.shift() : undefined;
        if (cells.length !== 3) throw new Error('Missing dataset card metrics');
        const [exactMatch, score, charF1] = cells.map(v => numberCell(v));
        rows.push({ model, setting, score, metrics: { exactMatch, charF1, questions: report.test_records } });
      }
    }
    return checked(rows, 11);
  },
};
export default board;
