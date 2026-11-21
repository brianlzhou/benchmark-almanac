// EHRSHOT measures clinical prediction from patient records. The board ranks the mean AUROC across all 28 tasks.
// Its "Few-shot" view first averages each task's available shot counts. Individual shot settings retain their task-level standard deviations.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://som-shahlab.github.io/ehrshot-website/data/leaderboard.json';
type Result = { all: number | null; allStd?: number; k: Record<string, { mean: number; std: number }> };
type Tasks = Record<string, Record<string, Result>>;
interface Data {
  models: string[]; kValues: number[]; taskGroups: Record<string, string[]>; modelMeta: Record<string, { runDate: string }>;
  individual: { auroc: Tasks; auprc: Tasks };
}
function value(cell: Result | undefined, setting: string) {
  if (!cell) return;
  if (setting === 'All labels') return { mean: cell.all, std: cell.allStd };
  if (setting !== 'Few-shot average') return cell.k[setting];
  const values = Object.values(cell.k).map(v => v.mean).filter(Number.isFinite);
  if (values.length) return { mean: values.reduce((a, b) => a + b) / values.length, std: undefined };
}
const board: Leaderboard = {
  benchmark: 'ehrshot', url: 'https://ehrshot.stanford.edu/', feed,
  terms: 'The EHRSHOT team publishes its leaderboard and terms at https://som-shahlab.github.io/ehrshot-website/.',
  parts: Object.fromEntries('ICU Admission|Long LOS|30-day Readmission|Anemia|Hyponatremia|Thrombocytopenia|Hyperkalemia|Hypoglycemia|Acute MI|Lupus|Hyperlipidemia|Hypertension|Celiac|Pancreatic Cancer|Lung Opacity|Pleural Effusion|Consolidation|Pleural Other|Pneumothorax|Edema|Enlarged Cardiomediastinum|Cardiomegaly|Support Devices|Fracture|Pneumonia|Lung Lesion|Atelectasis|No Finding'.split('|').flatMap(name => [[name, { name }], [name + ' AUPRC', { name: name + ' AUPRC', unit: 'score', better: 'higher' }]])), stats: { auprc: { name: 'Mean area under the precision recall curve', unit: 'score', better: 'higher', note: 'Mean area under the precision recall curve across the clinical prediction tasks, from 0 to 1.' } }, headline: 'The board averages AUROC across all 28 clinical prediction tasks.',
  async fetch() {
    const data = await fetchJson<Data>(feed);
    const tasks = Object.values(data.taskGroups).flat();
    if (tasks.length !== 28 || !data.individual.auprc || !data.kValues.length) throw new Error('Missing EHRSHOT tasks or metrics');
    for (const [group, names] of Object.entries(data.taskGroups)) for (const name of names) { board.parts![name] = { name, group }; board.parts![name + ' AUPRC'] = { name: name + ' AUPRC', group, unit: 'score', better: 'higher' }; }
    const rows: LeaderboardRow[] = [];
    for (const model of data.models) {
      for (const setting of ['All labels', 'Few-shot average', ...data.kValues.map(String)]) {
        const metrics: Record<string, number> = {};
        for (const task of tasks) {
          for (const metric of ['auroc', 'auprc'] as const) {
            const cell = value(data.individual[metric][task]?.[model], setting);
            if (!cell || typeof cell.mean !== 'number' || !Number.isFinite(cell.mean)) continue;
            const key = metric === 'auroc' ? task : task + ' AUPRC';
            metrics[key] = cell.mean;
            if (typeof cell.std === 'number') metrics[key + ' std'] = cell.std;
          }
        }
        if (!tasks.every(task => task in metrics)) continue;
        const mean = (suffix: string) => tasks.reduce((sum, t) => sum + metrics[t + suffix], 0) / tasks.length;
        if (tasks.every(t => t + ' AUPRC' in metrics)) metrics.auprc = mean(' AUPRC');
        rows.push({ model, setting: /^\d+$/.test(setting) ? setting + '-shot' : setting, score: mean(''), metrics,
          date: data.modelMeta[model]?.runDate });
      }
    }
    return checked(rows, 52);
  },
};
export default board;
