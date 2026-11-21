// MME-VideoOCR tests text understanding in video. Table 3 reports total accuracy and ten category accuracies in percent.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';

const FEED = 'https://arxiv.org/html/2505.21333';
function number(value: string): number {
  const clean = value?.trim().replace(/%$/, '');
  if (!/^-?\d+(?:\.\d+)?$/.test(clean)) throw new Error(`Invalid paper score: ${value}`);
  return Number(clean);
}

const board: Leaderboard = {
  benchmark: 'mme-videoocr', static: 'paper',
  url: 'https://arxiv.org/abs/2505.21333',
  feed: FEED,
  terms: PAPER_TERMS,
  aliases: {"VITA-1.5 7B": "vita-1-5", "LLaVA-Video 7B": "llava-video-7b-qwen2", "LLaVA-OneVision 7B": "llava-onevision-7b"},
  async fetch() {
    const tables = inlinePaperTables(await paperHtml(FEED));
    const table = tables.find(t => t[0]?.[0] === "Model" && t[0]?.[1] === "Size" && t[0]?.[2] === "TR" && t[0]?.[3] === "VTQA" && t[0]?.[4] === "TG" && t[0]?.[5] === "AR" && t[0]?.[6] === "CDT" && t[0]?.[7] === "STP" && t[0]?.[8] === "CFTU" && t[0]?.[9] === "TBR" && t[0]?.[10] === "TBVU" && t[0]?.[11] === "RVT" && t[0]?.[12] === "Total");
    if (!table) throw new Error("Missing mme-videoocr results table");
    const rows: LeaderboardRow[] = [];
    board.parts = {"tr": "TR", "vtqa": "VTQA", "tg": "TG", "ar": "AR", "cdt": "CDT", "stp": "STP", "cftu": "CFTU", "tbr": "TBR", "tbvu": "TBVU", "rvt": "RVT"};
    for (const cells of table.slice(1)) {
      if (cells[0] === cells[1]) continue;
      const model = cells[1] === '-' ? cells[0] : cells[0] + ' ' + cells[1];
      const score = number(cells[12]);
      rows.push({ model, score, metrics: { tr: number(cells[2]), vtqa: number(cells[3]), tg: number(cells[4]), ar: number(cells[5]), cdt: number(cells[6]), stp: number(cells[7]), cftu: number(cells[8]), tbr: number(cells[9]), tbvu: number(cells[10]), rvt: number(cells[11]) } });
    }
    if (rows.length < 18) throw new Error("Incomplete mme-videoocr comparison");
    return rows;
  },
};
export default board;
