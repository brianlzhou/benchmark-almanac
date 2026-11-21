// AD4Edu evaluates audio descriptions of university lectures on 516 held-out moments.
// Table 3 ranks checkpoints by compliance with the accessibility standard. The headline uses its first compliance column.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2610.17042';
const board: Leaderboard = {
  benchmark: 'ad4edu-bench', url: feed, feed, static: 'paper', terms: PAPER_TERMS,
  // The authors pin these backbones in github.com/psychias/ad_for_edu/tree/main/configs/training/backbones.
  aliases: { 'Qwen3-VL-8B':'qwen3-vl-8b-instruct','Qwen3-VL-4B':'qwen3-vl-4b-instruct',
    'Qwen3-VL-2B':'qwen3-vl-2b-instruct','SmolVLM2-2.2B':'smolvlm2-2-2b-instruct' },
  headline: 'The headline is mechanical AD4Edu-Eval compliance, the first score the paper uses to rank compliance with its accessibility standard.',
  parts: { mech:'AD4Edu-Eval mechanical', local:'AD4Edu-Eval local', chrF:'chrF', bert:'BERTScore', rawBert:'Raw BERTScore',
    clip:'CLIPScore', gptJudge:'LLM-AD-Eval (GPT-3.5)', llamaJudge:'LLM-AD-Eval (Llama-2)' },
  async fetch() {
    const t = flatPaperTables(await paperHtml(feed)).map(grid).find(t=>t[0].join('|') === 'VLM|Setting|chrF|BERTScore (raw)|CLIPScore|LLM-AD-Eval (GPT-3.5 / Llama-2)|AD4Edu-Eval mech †|AD4Edu-Eval local †');
    if (!t) throw new Error('Missing checkpoint compliance table');
    const rows: LeaderboardRow[] = [];
    let training = '';
    for (const [model,mode,chrF,bert,clip,judges,mech,local] of t.slice(1)) {
      const group = model.match(/(SFT|DPO) checkpoints$/);
      if (group) { training = group[1]; continue; }
      if (model === 'Slide-title readout') continue;
      const b = bert.match(/^([\d.]+)(?: \(([\d.]+)\))?$/);
      const j = judges.match(/^([\d.]+) \/ ([\d.]+)$/);
      if (!training || !b || !j) throw new Error('Invalid checkpoint row');
      const metrics: Record<string,number> = { mech:Number(mech), local:Number(local), chrF:Number(chrF), bert:Number(b[1]),
        clip:Number(clip),gptJudge:Number(j[1]),llamaJudge:Number(j[2]) };
      if (b[2]) metrics.rawBert = Number(b[2]);
      if (!Object.values(metrics).every(Number.isFinite)) throw new Error('Invalid checkpoint metric');
      rows.push({ model,setting: training+', '+mode, score:metrics.mech, trials:3, metrics });
    }
    return checked(rows,18);
  },
};
export default board;
