// CliniCARE-Bench ranks agents by four-class verdict accuracy across 750 cases. Tables 3 and 15
// of the official report supply the primary leaderboard and accuracy for each clinical scenario.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
const feed = "https://static.remotasks.com/uploads/6a74bd9cebda5487911dfbc2/scale-clinicare-bench.pdf";
const board: Leaderboard = {
  benchmark: 'clinicare-bench', static: 'paper',
  url: "https://labs.scale.com/papers/clinicare-bench",
  feed,
  terms: "Scale allows the public paper page in robots.txt and restricts use through its terms. Results are credited to the paper authors.",
  stats: {
    macF1: { name: 'Macro F1', unit: 'score', better: 'higher', note: 'Reported from 0 to 1.' },
    defectFree: { name: 'Defect-free accuracy', unit: '%', better: 'higher' },
    gap: { name: 'Accuracy gap', unit: '%', better: 'lower', note: 'Difference in percentage points between accuracy and defect-free accuracy.' },
    process: { name: 'Process adherence', unit: '%', better: 'higher' },
    overCommit: { name: 'Over-commitment rate', unit: '%', better: 'lower' },
    overAbstain: { name: 'Over-abstention rate', unit: '%', better: 'lower' },
    ece: { name: 'Expected calibration error', unit: 'score', better: 'lower', note: 'Reported from 0 to 1.' },
    turns: { name: 'Turns', unit: 'count', better: 'lower' },
    tools: { name: 'Tools used', unit: 'count', better: 'lower' },
  },
  async fetch() {
    const report = await pdfText(feed);
    const table = report.split('System               Acc Mac-F1')[1]?.split('No system exceeds')[0];
    if (!table) throw new Error('Missing CliniCARE primary leaderboard');
    const rows: LeaderboardRow[] = [];
    let harness = '';
    for (const line of table.split('\n').map(s => s.trim())) {
      if (['Claude Code', 'Codex', 'Gemini CLI'].includes(line) || line.startsWith('opencode (')) { harness = line.split(' (')[0]; continue; }
      const match = line.match(/^(.+?)\s+(\d+\.\d+)\s+([\d.]+\s+.*)$/);
      if (!match) continue;
      const fields = match[3].split(/\s+/);
      if (fields.length !== 11 || !harness) throw new Error('Unexpected CliniCARE columns');
      const [macF1, defectFree, gap, process, overCommit, overAbstain, ece, turns, tools] = fields.slice(0, 9).map(Number);
      const [tokensLow, tokensHigh] = fields[9].replace('k', '').split('–').map(n => Number(n) * 1000);
      const [costLow, costHigh] = fields[10].split('–').map(Number);
      rows.push({ model: match[1], harness, score: Number(match[2]), trials: 1, cost: costHigh === undefined ? costLow : undefined,
        metrics: { macF1, defectFree, gap, process, overCommit, overAbstain, ece, turns, tools, workTokensLow: tokensLow,
          ...(tokensHigh !== undefined ? { workTokensHigh: tokensHigh } : {}), ...(costHigh !== undefined ? { costLow, costHigh } : {}) } });
    }
    const header = 'O5 S5 Sol Luna 5.5 5.4 5.4m G3.6 G3.5 G3.1 D4P D4F GLM Qwn MM3 K2.7 Mean';
    const lines = report.split(header)[1]?.trim().split(/\n\s*\n/)[0].split('\n');
    if (rows.length !== 16 || lines?.length !== 25) throw new Error('Incomplete CliniCARE tables');
    for (const line of lines) {
      const [scenario, ...values] = line.trim().split(/\s+/);
      if (values.length !== 17 || values.some(v => !Number.isFinite(Number(v)))) throw new Error('Invalid scenario scores');
      (board.parts ??= {})[scenario] = scenario;
      rows.forEach((row, i) => { row.metrics![scenario] = Number(values[i]); });
    }
    return rows;
  },
};
export default board;
