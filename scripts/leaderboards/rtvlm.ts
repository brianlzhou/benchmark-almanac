// RTVLM scores responses to visual red-teaming prompts. The paper averages ten component scores on a ten-point scale.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';

const FEED = 'https://arxiv.org/html/2401.12915';
function number(value: string): number {
  const clean = value?.trim().replace(/%$/, '');
  if (!/^-?\d+(?:\.\d+)?$/.test(clean)) throw new Error(`Invalid paper score: ${value}`);
  return Number(clean);
}

const board: Leaderboard = {
  benchmark: 'rtvlm', static: 'paper',
  url: 'https://arxiv.org/abs/2401.12915',
  feed: FEED,
  terms: PAPER_TERMS,
  aliases: {"GPT4V": "gpt-4v", "Qwen-VL-Chat-7B": "qwen-vl-chat", "LLaVA-v1.5-ShareGPT4V-7B": "sharegpt4v-7b"},
  async fetch() {
    const tables = inlinePaperTables(await paperHtml(FEED));
    const table = tables.find(t => t[0]?.[0] === "Model" && t[0]?.[1] === "Faithfulness" && t[0]?.[5] === "Privacy" && t[0]?.[6] === "Safety" && t[0]?.[10] === "Fairness" && t[0]?.[11] === "Avg.");
    if (!table) throw new Error("Missing rtvlm results table");
    const rows: LeaderboardRow[] = [];
    board.parts = {"misleadText": "Misleading Text", "misleadImage": "Misleading Image", "orderTF": "Order ✓-✗", "orderFT": "Order ✗-✓", "celebrity": "Celebrity", "politics": "Politics", "racial": "Racial", "captcha": "Captcha", "jailbreak": "Jailbreak", "face": "Face"};
    for (const cells of table.slice(3)) {
      const model = cells[0];
      const score = number(cells[11]);
      rows.push({ model, score, metrics: { misleadText: number(cells[1]), misleadImage: number(cells[2]), orderTF: number(cells[3]), orderFT: number(cells[4]), celebrity: number(cells[5]), politics: number(cells[6]), racial: number(cells[7]), captcha: number(cells[8]), jailbreak: number(cells[9]), face: number(cells[10]) } });
    }
    if (rows.length < 10) throw new Error("Incomplete rtvlm comparison");
    return rows;
  },
};
export default board;
