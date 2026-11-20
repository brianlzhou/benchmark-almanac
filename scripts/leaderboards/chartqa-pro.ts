// ChartQA Pro: the main table publishes Overall accuracy for Direct, Chain-of-Thought and Program-of-Thought prompts.
//  Each prompt runs the whole benchmark and becomes a setting. Table 4 adds seven splits where its weighted scores identify the prompt.
//  These are the paper's static results and will not refresh with new model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { num, text } from '../lib/html.ts';
const FEED = "https://arxiv.org/html/2504.05506";
import { paperTables, paperModel } from '../lib/boards/arxiv-nested-tables.ts';
// Across Table 4, a common paragraph mix reproduces these prompt totals within rounding.
// SmolVLM has no matching total. The paper gives no prompt for its breakdown.
const ablations: Record<string, [string, number]> = {
  'GPT4-o': ['GPT4-o', 1],
  'Gemini-Flash-2.0': ['Gemini-Flash-2.0', 1],
  'Gemini-Flash-1.5': ['Gemini-Flash-1.5', 1],
  'Claude Sonnet 3.5': ['Claude Sonnet 3.5', 1],
  'Qwen-VL2-2B': ['Qwen-VL2-2B', 0],
  'Phi 3.5-Vision-4B': ['Phi 3.5-Vision-4B', 0],
  'Qwen-VL2-7B': ['Qwen-VL2-7B', 0],
  'Intern-VL2.5-8B': ['InternVL2.5-8B', 0],
  'LLama 3.2-Vision-11B': ['LLama-3.2-Vision-11B', 1],
  'ChartGemma-3B': ['ChartGemma', 0],
  'ChartInstruct-LLama2-7B': ['ChartInstruct-LLama2', 0],
  'TinyChart-3B': ['TinyChart', 0],
};
const splits = ['chart', 'dashboard', 'infographic', 'normal', 'unanswerable', 'noParagraph', 'withParagraph'];
const board: Leaderboard = {
  benchmark: "chartqa-pro",
  parts: {
    chart: { name: 'Chart', group: 'Chart type' },
    dashboard: { name: 'Dashboard', group: 'Chart type' },
    infographic: { name: 'Infographic', group: 'Chart type' },
    normal: { name: 'Normal', group: 'Answer type' },
    unanswerable: { name: 'Unanswerable', group: 'Answer type' },
    noParagraph: { name: 'No Para', group: 'Paragraph presence' },
    withParagraph: { name: 'With Para', group: 'Paragraph presence' },
    factoid: { name: 'Factoid', group: 'Task type' },
    conversation: { name: 'Conversation', group: 'Task type' },
    factChecking: { name: 'Fact checking', group: 'Task type' },
    hypothetical: { name: 'Hypothetical', group: 'Task type' },
    mcq: { name: 'Multiple choice', group: 'Task type' },
  },
  url: "https://raw.githubusercontent.com/vis-nlp/ChartQAPro/main/README.md",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    const tables = await paperTables(FEED);
    const breakdown = tables.find(t => t[0]?.some(c => c.text === 'Paragraph Presence (C)'));
    const t = tables.find(t => t[0]?.some(c => c.text === 'Program-of-Thought (PoT)'));
    if (!t) throw new Error('ChartQA Pro main table missing');
    const out: LeaderboardRow[] = [];
    let open: boolean | undefined;
    for (const r of t) {
      if (r.length === 1) {
        open = r[0].text === 'Open-Source Models' ? true : r[0].text === 'Closed-Source Models' ? false : undefined;
      }
      if (r.length !== 19 || /^Human/.test(r[0].text) || num(r[6].text) === undefined) continue;
      ['Direct', 'Chain-of-Thought', 'Program-of-Thought'].forEach((setting, i) => {
        const score = num(r[6 + i * 6].text);
        if (score === undefined) throw new Error('ChartQA Pro overall missing');
        const metrics: Record<string, number> = {};
        ['factoid', 'mcq', 'conversation', 'factChecking', 'hypothetical'].forEach((k,j) => {metrics[k] = num(r[1+i*6+j].text)!;});
        const spec = ablations[r[0].text];
        if (spec && i === spec[1]) {
          const row = breakdown?.find(row => row[0]?.text === spec[0]);
          if (row) splits.forEach((key, j) => {
            const value = num(row[j + 1]?.text);
            if (value !== undefined) metrics[key] = value;
          });
        }
        const size = r[0].text.match(/(\d+(?:\.\d+)?)B$/);
        out.push({model: paperModel(r[0].text), score, setting, metrics, open, params: size ? Number(size[1]) : undefined});
      });
    }
    if (out.length !== 63) throw new Error(`ChartQA Pro expected 63 rows, found ${out.length}`);
    return out;
  },
};
export default board;
