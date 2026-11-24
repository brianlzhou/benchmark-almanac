// EgoPER evaluates procedural error detection in first-person cooking videos across five
// recipes (Quesadilla, Oatmeal, Pinwheel, Coffee, and Tea). This importer reads Table 3 of
// the official CVPR 2024 paper from CVF Open Access, capturing overall error detection
// accuracy (EDA) in percent, per-recipe EDA parts, and overall plus per-recipe AUC stats
// while excluding the Random baseline.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://openaccess.thecvf.com/content/CVPR2024/papers/Lee_Error_Detection_in_Egocentric_Procedural_Task_Videos_CVPR_2024_paper.pdf';

const board: Leaderboard = {
  benchmark: 'egoper-error-detection',
  static: 'paper',
  url: 'https://openaccess.thecvf.com/content/CVPR2024/html/Lee_Error_Detection_in_Egocentric_Procedural_Task_Videos_CVPR_2024_paper.html',
  feed: FEED,
  terms: 'Open-access CVF CVPR 2024 paper PDF. Scores remain credited to Lee et al.',
  headline: 'Headline is overall Error Detection Accuracy (EDA) in percent across all five EgoPER cooking tasks from Table 3.',
  notModels: /^Random$/i,
  parts: {
    quesadillaEda: { name: 'Quesadilla', group: 'Task EDA', unit: '%', better: 'higher' },
    oatmealEda: { name: 'Oatmeal', group: 'Task EDA', unit: '%', better: 'higher' },
    pinwheelEda: { name: 'Pinwheel', group: 'Task EDA', unit: '%', better: 'higher' },
    coffeeEda: { name: 'Coffee', group: 'Task EDA', unit: '%', better: 'higher' },
    teaEda: { name: 'Tea', group: 'Task EDA', unit: '%', better: 'higher' },
  },
  stats: {
    allAuc: { name: 'Overall AUC', unit: '%', better: 'higher' },
    quesadillaAuc: { name: 'Quesadilla AUC', unit: '%', better: 'higher' },
    oatmealAuc: { name: 'Oatmeal AUC', unit: '%', better: 'higher' },
    pinwheelAuc: { name: 'Pinwheel AUC', unit: '%', better: 'higher' },
    coffeeAuc: { name: 'Coffee AUC', unit: '%', better: 'higher' },
    teaAuc: { name: 'Tea AUC', unit: '%', better: 'higher' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const text = await pdfText(FEED);
    const start = text.indexOf('Quesadilla');
    const end = text.indexOf('Table 3.', start);
    if (start < 0 || end < 0) throw new Error('EgoPER Table 3 missing in CVPR 2024 PDF');
    const block = text.slice(start, end);

    const num = '(\\d+\\.\\d+)';
    const re = new RegExp(
      `^\\s*([A-Za-z][A-Za-z0-9\\s+()-]*?)(?:\\s*\\[\\d+\\])?\\s+${num}\\s+${num}\\s+${num}\\s+${num}\\s+${num}\\s+${num}\\s+${num}\\s+${num}\\s+${num}\\s+${num}\\s+${num}\\s+${num}\\s*$`
    );

    const rows: LeaderboardRow[] = [];
    for (const line of block.split('\n')) {
      const m = line.match(re);
      if (!m) continue;
      const model = m[1].replace(/\s+-\s*/g, '-').replace(/\s+/g, ' ').trim();
      if (!model) continue;
      rows.push({
        model,
        score: Number(m[12]),
        metrics: {
          quesadillaEda: Number(m[2]),
          quesadillaAuc: Number(m[3]),
          oatmealEda: Number(m[4]),
          oatmealAuc: Number(m[5]),
          pinwheelEda: Number(m[6]),
          pinwheelAuc: Number(m[7]),
          coffeeEda: Number(m[8]),
          coffeeAuc: Number(m[9]),
          teaEda: Number(m[10]),
          teaAuc: Number(m[11]),
          allAuc: Number(m[13]),
        },
      });
    }

    return checked(rows, 4);
  },
};

export default board;
