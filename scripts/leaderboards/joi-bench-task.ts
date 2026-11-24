// Joi-Bench-Task tests voice agents during tool calls, changed requests and interruptions.
// Table 4 starts with single-tool start latency in seconds. Tables 5 to 7 break down the other conditions.
import type { Leaderboard, BoardPart } from './types.ts';
import { PAPER_TERMS, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://arxiv.org/html/2611.12118';
const parts: Record<string, BoardPart> = {};
for (const [key, name] of Object.entries({
  startSingle: 'Tool start latency (single tool)', startMulti: 'Tool start latency (multiple tools)',
  announceSingle: 'Announcement latency (single tool)', announceMulti: 'Announcement latency (multiple tools)',
  interruptLatency: 'Interruption latency',
})) parts[key] = { name, unit: 'score', better: 'lower', note: 'Seconds.' };
for (const [key, name] of Object.entries({
  inquiry: 'Status inquiry response', change: 'Request change success', completion: 'Result completion', omission: 'Information omission',
  resume: 'Resumption', concurrency: 'Concurrency met', passSingle: 'Pass@1 (single tool)', passMulti: 'Pass@1 (multiple tools)',
  baseline: 'Result completion (baseline)', priority: 'Result completion (priority change)', withdraw: 'Result completion (task withdraw)',
  addition: 'Result completion (task addition)', changePriority: 'Request change success (priority change)',
  changeWithdraw: 'Request change success (task withdraw)', changeAddition: 'Request change success (task addition)',
  pauseResume: 'Resumption (pause)', inquiryResume: 'Resumption (inquiry)', pauseOmission: 'Information omission (pause)',
  inquiryOmission: 'Information omission (inquiry)',
})) parts[key] = { name, unit: '%', better: key.toLowerCase().includes('omission') ? 'lower' : 'higher' };

function value(cell: string) {
  if (!/^\d+(?:\.\d+)?\s*[%s]?$/.test(cell.trim())) throw new Error('Invalid metric ' + cell);
  return parseFloat(cell);
}
function pair(cell: string) {
  const values = cell.split('/').map(value);
  if (values.length !== 2) throw new Error('Expected paired results: ' + cell);
  return values;
}
const board: Leaderboard = {
  benchmark: 'joi-bench-task', static: 'paper', url, feed: url, terms: PAPER_TERMS, parts,
  headline: 'The paper lists single-tool start latency first. The score is in seconds, and lower is better.',
  aliases: { 'GPT Live 1.0': 'gpt-live-1', 'Realtime 1.5': 'gpt-realtime-1-5', 'Realtime 2': 'gpt-realtime-2', 'Grok Voice 3.0': 'grok-voice-3' },
  async fetch() {
    const tables = paperTables(await paperHtml(url)).map(grid);
    const [overall, tools, changes, interruptions] = tables.slice(3, 7);
    if (!overall?.flat().includes('Execution responsiveness') || !overall.flat().includes('Tool start') ||
        !tools?.[0].join(' ').includes('Concurrency met') || !changes?.[1].includes('Baseline') ||
        !interruptions?.[0].join(' ').includes('Resumption rate')) throw new Error('Missing Joi-Bench-Task results');
    return checked(tools.slice(1).map(([model, conc, pass]) => {
      const main = overall.find(row => row[0] === model);
      const changed = changes.find(row => row[0] === model);
      const interrupted = interruptions.find(row => row[0] === model);
      if (main?.length !== 9 || changed?.length !== 8 || interrupted?.length !== 3) throw new Error('Incomplete results for ' + model);
      const [startSingle, startMulti] = pair(main[1]);
      const [announceSingle, announceMulti] = pair(main[2]);
      const [inquiry, change, completion, omission, resume, interruptLatency] = main.slice(3).map(value);
      const [passSingle, passMulti] = pair(pass);
      const [baseline, priority, withdraw, addition, changePriority, changeWithdraw, changeAddition] = changed.slice(1).map(value);
      const [pauseResume, inquiryResume] = pair(interrupted[1]);
      const [pauseOmission, inquiryOmission] = pair(interrupted[2]);
      return { model, score: startSingle, metrics: { startSingle, startMulti, announceSingle, announceMulti, inquiry,
        change, completion, omission, resume, interruptLatency, concurrency: value(conc), passSingle, passMulti,
        baseline, priority, withdraw, addition, changePriority, changeWithdraw, changeAddition,
        pauseResume, inquiryResume, pauseOmission, inquiryOmission } };
    }), 5);
  },
};
export default board;
