// TalentCLEF ranks job title matching runs by average MAP across English, Spanish and German. The official TSV also gives optional language-pair scores.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';

const FEED = "https://talentclef.github.io/talentclef/results_task_a/results_a.tsv";
const board: Leaderboard = {
  benchmark: "talentclef-2025-job-title-matching",
  url: "https://talentclef.github.io/talentclef/docs/talentclef-2025/results/task_a_results/",
  feed: FEED,
  terms: "The organizers license the results pages under CC BY 4.0. https://talentclef.github.io/talentclef/docs/talentclef-2025/results/task_a_results/ The host has no published robots directives at /robots.txt.",
  harnesses: 'system',
  parts: Object.fromEntries(['en-en','es-es','de-de','zh-zh','en-es','en-de','en-zh'].map(pair => ['MAP(' + pair + ')', { name: 'MAP(' + pair + ')', unit: 'score' }])),
  async fetch() {
    const [head,...lines] = (await fetchText(FEED)).trimEnd().split(/\r?\n/);
    const headers = head.split('\t');
    if (!['Base model','Team','run_ID','Method','Avg.MAP (en,es,de)',...Object.keys(board.parts!)].every(k => headers.includes(k)) || lines.length < 33) throw new Error('Missing TalentCLEF rows or columns');
    return lines.map(line => {
      const cells = line.split('\t').map(v => v.trim());
      const cell = (key: string) => cells[headers.indexOf(key)];
      const label = cell('Base model'), value = cell('Avg.MAP (en,es,de)');
      const models = label.split(/,\s*| with /);
      const metrics = Object.fromEntries(Object.keys(board.parts!).filter(k => cell(k)).map(k => [k,Number(cell(k))]));
      if (!label || !value || !Number.isFinite(Number(value)) || !Object.values(metrics).every(Number.isFinite)) throw new Error('Invalid TalentCLEF score');
      const size = cell('Model size')?.match(/^([\d.]+)([MB])$/);
      return { model: models[0], models: models.length > 1 ? models : undefined, score: Number(value), submitter: cell('Team'),
        harness: cell('Team'), setting: [cell('run_ID'), cell('Method'),cell('Type'),cell('Loss')].filter(v => v && v !== 'n/a').join(', '),
        params: size ? Number(size[1]) / (size[2] === 'M' ? 1000 : 1) : undefined, metrics };
    });
  },
};
export default board;
