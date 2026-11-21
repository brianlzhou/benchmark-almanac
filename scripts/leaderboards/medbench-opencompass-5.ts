// MedBench 5.0 tests clinical performance and medical agent skills and audits the reasoning process.
// Table 2 starts with CCR-LLM macro-average. Tables 2 and 3 give additional performance and skill scores.
// The paper treats its process audit as a separate diagnostic with metrics of different directions.
import type { Leaderboard } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2606.24155';
const board: Leaderboard = {
  benchmark: 'medbench-opencompass-5', url: 'https://medbench.opencompass.org.cn/home', feed,
  terms: PAPER_TERMS + ' https://arxiv.org/abs/2606.24155',
  parts: { llm: 'CCR-LLM', multimodal: 'CCR-Multimodal', agent: 'CCR-Agent', mas: 'MAS Avg.',
    dataAgent: 'DataAgent', ragAgent: 'RAGAgent', deepResearch: 'DeepResearch', safetyAgent: 'SafetyAgent' },
  async fetch() {
    const all = paperTables(await paperHtml(feed)).map(grid);
    const ccr = all.find(t => t[0].join('|') === 'Model|CCR-LLM|CCR-Multimodal|CCR-Agent');
    const mas = all.find(t => t[0].join('|') === 'Model|DataAgent|RAGAgent|DeepResearch|SafetyAgent|MAS Avg.');
    if (!ccr || !mas) throw new Error('Missing MedBench performance tables');
    const rows = ccr.slice(1).filter(r => r[1] !== '–').map(([model, llm, multimodal, agent]) => {
      const metrics: Record<string, number> = { llm: Number(llm) };
      if (multimodal !== '–') metrics.multimodal = Number(multimodal);
      if (agent !== '–') metrics.agent = Number(agent);
      const skills = mas.find(r => r[0] === model);
      if (skills) ['dataAgent', 'ragAgent', 'deepResearch', 'safetyAgent', 'mas'].forEach((k, i) => { metrics[k] = Number(skills[i + 1]); });
      if (!Object.values(metrics).every(Number.isFinite)) throw new Error('Invalid MedBench score');
      return { model, score: metrics.llm, metrics };
    });
    return checked(rows, 10);
  },
};
export default board;
