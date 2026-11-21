// DroidTask tests Android task completion across 158 tasks. Figure 7a gives completion rates for three language models.
// The PDF text layer contains the bar labels. Table 2 supplies action accuracies and Table 3 adds Vicuna training ablations.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://www.microsoft.com/en-us/research/wp-content/uploads/2024/07/mobicom24-autodroid.pdf';
const board: Leaderboard = {
  benchmark: 'droidtask', feed, url: 'https://autodroid-sys.github.io/', static: 'paper', harnesses: 'system',
  terms: 'The authors publish the ACM paper through Microsoft Research at https://doi.org/10.1145/3636534.3649379.',
  parts: { Click: 'Click action accuracy', Input: 'Input action accuracy', Scroll: 'Scroll action accuracy', Complete: 'Completion decision accuracy' },
  async fetch() {
    const paper = await pdfText(feed);
    const fig = paper.match(/Completion Rate \(%\)\s*\n\s*80\s+LLM-framework[\s\S]*?\(a\) Different models/);
    if (!fig || !fig[0].includes('Vi') || !fig[0].includes('3.5')) throw new Error('Missing Figure 7a');
    // The six labels in the left panel follow the three model groups, with the LLM-framework bar on the left of each pair.
    const bars = fig[0].split('\n').flatMap(l => [...l.slice(0, 60).matchAll(/(\d+\.\d+)%/g)]
      .map(m => ({ x: m.index!, score: Number(m[1]) }))).sort((a, b) => a.x - b.x);
    if (bars.length !== 6) throw new Error('Expected six completion-rate labels');
    const rows: LeaderboardRow[] = bars.map((b, i) => ({ model: ['Vicuna-7B', 'GPT-3.5', 'GPT-4'][Math.floor(i / 2)],
      harness: i % 2 ? 'AutoDroid' : 'LLM-framework', score: b.score, metrics: {} }));
    const actions = paper.match(/Action\s+Rand\s+Sim\s+MG\s+LLM-F\s+AutoDroid[^\n]*\n([\s\S]*?Overall[^\n]*)/);
    if (!actions) throw new Error('Missing Table 2');
    for (const line of actions[1].trim().split('\n')) {
      const [key, ...cells] = line.trim().split(/\s+/);
      if (cells.length !== 9) throw new Error('Invalid Table 2 row');
      cells.slice(3).forEach((cell, i) => {
        if (cell === 'N/A') return;
        if (!/^\d+(?:\.\d+)?%?$/.test(cell)) throw new Error('Invalid action accuracy');
        rows[i].metrics![key === 'Overall' ? 'actionAccuracy' : key] = parseFloat(cell);
      });
    }
    const ablations = paper.match(/Metric\s+Original\s+AutoDroid\s+No Mo\s+No CoT\s+No Mo&CoT\s*\n[^\n]*?\bAction\s+([\d.%\s]+)\n[^\n]*?\bCompletion\s+([\d.% ]+)/);
    if (!ablations) throw new Error('Missing Table 3');
    const [action, completion] = ablations.slice(1).map(line => line.trim().split(/\s+/).map(parseFloat));
    if (action.length !== 5 || completion.length !== 5) throw new Error('Invalid ablation columns');
    ['No Mo', 'No CoT', 'No Mo&CoT'].forEach((setting, i) => rows.push({ model: 'Vicuna-7B',
      harness: 'AutoDroid', setting, score: completion[i + 2], metrics: { actionAccuracy: action[i + 2] } }));
    return checked(rows, 9);
  },
};
export default board;
