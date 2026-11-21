// EduVideoBench evaluates educational video generation across knowledge, skills and attitude.
// The authors' leaderboard CSV publishes the aggregate KSA score and its categories for both judging settings.
import type { Leaderboard } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';

const url = 'https://anonymous.4open.science/r/EduVideoBench-anonymous-D5F2/';
const feed = 'https://anonymous.4open.science/api/repo/EduVideoBench-anonymous-D5F2/file/results/human_eval/leaderboard_ksa.csv';
const parts = {K_CK:'K-CK', K_PK:'K-PK', K_total:'Knowledge', S_PF:'S-PF', S_UC:'S-UC', S_VIU:'S-VIU',
  S_total:'Skills', A_ES:'A-ES', A_IS:'A-IS', A_NE:'A-NE', A_DD:'A-DD', A_total:'Attitude'};
const board: Leaderboard = {
  benchmark:'eduvideobench', url, feed, parts,
  stats: { blockRate: { name: 'Block rate', unit: 'score', better: 'lower', note: 'Fraction of generations blocked by the safety gate, from 0 to 1.' } },
  terms: 'The authors plan to release scores under CC BY 4.0. https://anonymous.4open.science/r/EduVideoBench-anonymous-D5F2/README.md',
  async fetch() {
    const rows = parseCsv(await fetchText(feed)).map(row => {
      if (!row.model || !['Human-Center','VLM-Center'].includes(row.signal) || !['PASS','FAIL'].includes(row.safety_gate))
        throw new Error('Invalid EduVideoBench leaderboard row');
      const metrics = Object.fromEntries(Object.keys(parts).map(key => [key, numberCell(row[key])]));
      return {model:row.model, setting:row.signal, score:numberCell(row.KSA),
        metrics:{...metrics, blockRate:numberCell(row.block_rate), safetyGate:Number(row.safety_gate === 'PASS')}};
    });
    return checked(rows,10);
  },
};
export default board;
