// FaithJudge (University of Waterloo and Vectara). The leaderboard is the markdown table between the
// TABLE START and TABLE END markers in the vectara/FaithJudge README: per model the Overall Hallucination
// Rate (0 to 100, lower is better, the ranking) and per-task rates. The overall rate is the score, as the
// board shows it. Model names are API ids: a reasoning effort or "thinking" inside the name becomes the
// setting, and a trailing date stamp is passed on for snapshot matching.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, text } from '../lib/html.ts';

const FEED = 'https://raw.githubusercontent.com/vectara/FaithJudge/main/README.md';

const board: Leaderboard = {
  benchmark: 'faithjudge',
  url: 'https://github.com/vectara/FaithJudge#leaderboard',
  feed: `${FEED} (leaderboard table, Overall Hallucination Rate)`,
  terms: 'README table in the vectara/FaithJudge repository, which has no license file; scores are cited to the FaithJudge authors.',
  aliases: {
    'r1-0528': 'deepseek-r1-may-2025',
    'gemini-2.5-pro-exp-03-25': 'gemini-2-5-pro-mar-2025',
    // the GA model (the board lists the March experimental separately)
    'gemini-2.5-flash': 'gemini-2-5-flash-jun-2025',
    'gemini-2.0-flash-001': 'gemini-2-0-flash-feb-2025',
    'gpt-3.5-turbo-0125': 'gpt-3-5-turbo-jan-2024',
    // instruct releases of models the registry lists once
    'Mistral-Small-24B-Instruct-2501': 'mistral-small-3',
    'Ministral-8B-Instruct-2410': 'ministral-8b',
    'Llama-3.1-8B-Instruct': 'llama-3-1-8b',
    'Llama-3.2-3B-Instruct': 'llama-3-2-3b',
    'Llama-3.2-1B-Instruct': 'llama-3-2-1b',
    'Qwen2.5-32B-Instruct': 'qwen2-5-32b',
    'Qwen2.5-14B-Instruct': 'qwen2-5-14b',
    'Qwen2.5-7B-Instruct': 'qwen2-5-7b',
    'Qwen2.5-3B-Instruct': 'qwen2-5-3b',
    'Qwen2.5-1.5B-Instruct': 'qwen2-5-1-5b',
    'Qwen2.5-0.5B-Instruct': 'qwen2-5-0-5b',
    'Phi-4-mini-instruct': 'phi-4-mini',
  },
  async fetch() {
    const md = await fetchText(FEED);
    const table = md.slice(md.indexOf('<!-- TABLE START -->'), md.indexOf('<!-- TABLE END -->') > 0 ? md.indexOf('<!-- TABLE END -->') : undefined);
    const lines = table.split('\n').filter((l) => l.startsWith('|'));
    const head = lines[0]?.split('|').slice(1, -1).map((c) => c.trim());
    const [mi, si] = [head?.indexOf('Model') ?? -1, head?.indexOf('Overall Hallucination Rate') ?? -1];
    if (mi < 0 || si < 0) throw new Error(`unexpected FaithJudge header: ${head?.join(' | ')}`);
    const rows: LeaderboardRow[] = [];
    for (const line of lines.slice(2)) {
      const cells = line.split('|').slice(1, -1).map((c) => c.trim());
      const score = num(cells[si]);
      // "[gpt-4.1-2025-04-14](https://...)": the link text is the model id
      let model = text(cells[mi]?.replace(/^\[([^\]]+)\]\([^)]*\)$/, '$1') ?? '');
      if (!model || score === undefined) continue;
      const stamp = model.match(/-(20\d\d)-?(\d\d)-?(\d\d)$/);
      if (stamp) model = model.slice(0, stamp.index);
      const settings: string[] = [];
      // "o3-mini-medium", "claude-opus-4-thinking": effort and thinking inside the id
      const effort = model.match(/^(o\d(?:-mini)?)-(low|medium|high)$/);
      if (effort) {
        model = effort[1];
        settings.push(effort[2]);
      }
      if (/-thinking$/.test(model)) {
        model = model.replace(/-thinking$/, '');
        settings.push('thinking');
      }
      rows.push({ model, score, setting: settings.join(', ') || undefined, date: stamp ? `${stamp[1]}-${stamp[2]}-${stamp[3]}` : undefined });
    }
    return rows;
  },
};
export default board;
