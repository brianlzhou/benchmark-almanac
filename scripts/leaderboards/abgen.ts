// AbGen tests ablation study design. Table 2 ranks models by the average human rating across 100 sampled testmini examples. The automated judge scores the full test split.
import type { Leaderboard } from './types.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
const url = "https://arxiv.org/html/2507.13300";
const columns = ["judgeImportance","judgeFaithfulness","judgeSoundness","judgeOverall","humanImportance","humanFaithfulness","humanSoundness","humanAverage"];
const header = ["System","Import.","Faith.","Sound.","Overall","Import.","Faith.","Sound.","Avg."];
const board: Leaderboard = {
  benchmark: "abgen", static: 'paper', url, feed: url, terms: PAPER_TERMS,
  aliases: {"GPT-4o (snapshot unspecified)":"gpt-4o-aug-2024","Gemini-2.5-Flash":"gemini-2-5-flash-may-2025","Gemini-2.5-Flash (snapshot unspecified)":"gemini-2-5-flash-may-2025","DeepSeek-V3 (snapshot unspecified)":"deepseek-v3","Llama-4-Scout-17B":"llama-4-scout","Llama-4-Maverick-17B":"llama-4-maverick","Gemma-3-27b-it":"gemma-3-27b","Llama-3.3-70B":"llama-3-3-70b-instruct","DeepSeek-R1-0528":"deepseek-r1-may-2025","Mistral-Small-3.1-24B":"mistral-small-3-1"},
  parts: {"judgeImportance":{"name":"LLM importance"},"judgeFaithfulness":{"name":"LLM faithfulness"},"judgeSoundness":{"name":"LLM soundness"},"judgeOverall":{"name":"LLM overall"},"humanImportance":{"name":"Human importance"},"humanFaithfulness":{"name":"Human faithfulness"},"humanSoundness":{"name":"Human soundness"},"humanAverage":{"name":"Human average"}},
  async fetch() {
    const table = paperTables(await paperHtml(url)).map(grid).find(t => t[1]?.join("|") === header.join("|"));
    if (!table) throw new Error('Missing reviewed result columns');
    const rows = table.slice(2).filter(c => !["Reference (orig)","Human Expert"].includes(c[0])).map(c => {
      const cells = c.slice(1);
      if (cells.length !== columns.length || cells.some(v => !/^-?\d+(?:\.\d+)?%?$/.test(v.trim()))) throw new Error("Invalid result for " + c[0]);
      const metrics = Object.fromEntries(columns.map((k,i) => [k,parseFloat(cells[i]) * 1]));
      return { model:c[0], score:metrics["humanAverage"], metrics };
    });
    return checked(rows,18);
  },
};
export default board;
