// CFDCodeBench measures how often generated solvers run, agree with the reference and converge. The results site's embedded JSON preserves the six original paper scores.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';

const FEED = "https://raw.githubusercontent.com/nithinsomu/cfdllmbench_v2/main/index.html";

interface PaperModel { name: string; cfdquery: number; cfdcodebench: number }
interface CurrentModel { name: string; cfdquery: number; cfdquery_correct: number }
export async function cfdResults(url: string): Promise<{ paper_models: PaperModel[]; v2_models: CurrentModel[] }> {
  const page = await fetchText(url);
  const data = page.match(/<script[^>]*id="bench-data"[^>]*>([\s\S]*?)<\/script>/);
  if (!data) throw new Error('Missing CFDLLMBench results');
  return JSON.parse(data[1]);
}

const board: Leaderboard = {
  benchmark: "cfdcodebench",
  url: "https://nithinsomu.github.io/cfdllmbench_v2/#old-vs-new",
  feed: FEED,
  terms: "The benchmark repository uses BSD 3-Clause. The separate results site lists no score license. https://github.com/NLR-Theseus/cfdllmbench/blob/main/LICENSE The results site returns a 404 page for robots.txt.",
  aliases: { 'Haiku 3.5': 'claude-3-5-haiku' },
  async fetch() {
    const { paper_models } = await cfdResults(FEED);
    if (paper_models.length < 6) throw new Error('Expected six paper models');
    return paper_models.map(({ name, cfdcodebench }) => {
      if (!name || !Number.isFinite(cfdcodebench)) throw new Error('Missing CFDCodeBench success rate');
      return { model: name, score: cfdcodebench * 100 };
    });
  },
};
export default board;
