// BuseyBench ranks generated portraits by the displayed weighted score, breaking ties with pairwise judgments.
// The public standings and runs APIs provide the scores and run metadata. The ranking cards give four rubric scores.
import type { Leaderboard } from './types.ts';
import { fetchJson, fetchText } from '../lib/util.ts';

interface Standing {
  model: string; rank: number; representativeRunId: string; displayedScore: number; score: number;
  scoreDispersion: number; pairwiseRating: number; completedRuns: number; executionRoute: string; toolPolicy: string;
  pairwise: { wins: number; losses: number; draws: number; uncertainty: number };
}
interface Run { id: string; url: string; completedAt: string; metrics: { costUsd: number | null; totalTokens: number | null; latencyMs: number | null } }
const pause = () => new Promise(resolve => setTimeout(resolve, 1000));

const feed = "https://www.buseybench.com/api/v1/leaderboard?suite=svg";
const board: Leaderboard = {
  benchmark: 'buseybench-svg',
  url: "https://www.buseybench.com/leaderboard?suite=svg",
  feed,
  terms: "The site allows the leaderboard and public API in robots.txt. The site makes artifacts and model metadata public. Its privacy and governance pages give no reuse license. https://www.buseybench.com/privacy",
  stats: {
    likeness: { name: 'Busey likeness', unit: 'score', better: 'higher' },
    faceCoherence: { name: 'Face coherence', unit: 'score', better: 'higher' },
    aesthetics: { name: 'Aesthetics', unit: 'score', better: 'higher' },
    promptAdherence: { name: 'Prompt adherence', unit: 'score', better: 'higher' },
    unroundedScore: { name: 'Unrounded score', unit: 'score', better: 'higher' },
    judgeSpread: { name: 'Judge score spread', unit: 'score', better: 'lower' },
    pairwiseRating: { name: 'Pairwise rating', unit: 'rating', better: 'higher' },
    wins: { name: 'Pairwise wins', unit: 'count' },
    losses: { name: 'Pairwise losses', unit: 'count' },
    draws: { name: 'Pairwise draws', unit: 'count' },
    games: { name: 'Pairwise games', unit: 'count' },
    uncertainty: { name: 'Pairwise rating uncertainty', unit: 'rating', better: 'lower' },
    totalTokens: { name: 'Total tokens', unit: 'tokens' },
    latencySeconds: { name: 'Latency', unit: 'seconds', better: 'lower' },
  },
  aliases: {
    "GPT-4o (2024-05-13)": "gpt-4o-may-2024",
    "GPT-4o (2024-08-06)": "gpt-4o-aug-2024",
    "GPT-4o (2024-11-20)": "gpt-4o-nov-2024",
    "Kimi K2 0711": "kimi-k2-jul-2025",
    "Mistral Large 3 2512": "mistral-large-3",
    "Cogito v2.1 671B": "cogito-v2-1",
    "R1 Distill Llama 70B": "deepseek-r1-distill-llama-70b",
    "R1": "deepseek-r1",
    "R1 0528": "deepseek-r1-may-2025",
    "GPT-3.5 Turbo (older v0613)": "gpt-3-5-turbo-jun-2023",
    "Mistral Large 2407": "mistral-large-2-jul-2024",
    "Devstral 2 2512": "devstral-2",
    "Jamba Large 1.7": "jamba-1-7-large",
    "Command A": "cohere-command-a",
    "Nemotron 3 Super (free)": "nemotron-3-super",
    "Nemotron 3 Nano Omni (free)": "nemotron-3-nano-omni-30b-a3b",
    "Nemotron Nano 12B 2 VL (free)": "nemotron-nano-12b-v2-vl",
    "Mistral Small 3.2 24B": "mistral-small-3-2",
    "Hy3 (free)": "tencent-hy3",
    "Nova Lite 1.0": "amazon-nova-lite",
    "Nova Micro 1.0": "amazon-nova-micro",
    "Nova Pro 1.0": "amazon-nova-pro",
    "Nova Premier 1.0": "amazon-nova-premier"
  },
  async fetch() {
    const { rows, suite } = await fetchJson<{ rows: Standing[]; suite: string }>(feed);
    if (suite !== 'svg' || rows.length < 330) throw new Error('Incomplete SVG standings');
    const runs = new Map<string, Run>();
    const seen = new Set<string>();
    let cursor = '';
    do {
      await pause();
      const page = await fetchJson<{ runs: Run[]; nextCursor: string | null }>(
        'https://www.buseybench.com/api/v1/runs?suite=svg&limit=100' + (cursor ? '&cursor=' + encodeURIComponent(cursor) : ''));
      for (const run of page.runs) runs.set(run.id, run);
      cursor = page.nextCursor ?? '';
      if (seen.has(cursor)) throw new Error('Repeated SVG run cursor');
      seen.add(cursor);
    } while (cursor);
    const rubric = new Map<string, Record<string, number>>();
    const keys: Record<string, string> = { 'Busey likeness': 'likeness', 'Face coherence': 'faceCoherence', Aesthetics: 'aesthetics', 'Prompt adherence': 'promptAdherence' };
    for (let page = 1; page <= Math.ceil(rows.length / 25); page++) {
      await pause();
      const html = await fetchText(board.url + '&page=' + page);
      for (const card of html.matchAll(/<div class="leaderboard-copy">([\s\S]*?)<\/article>/g)) {
        const id = card[1].match(/href="\/runs\/([^"]+)"/)?.[1];
        const fields = Object.fromEntries([...card[1].matchAll(/class="score-bar-label">([^<]+)<[\s\S]*?class="score-bar-value">([\d.]+)</g)]
          .map(m => [keys[m[1]], Number(m[2])]));
        if (!id || Object.values(keys).some(k => !Number.isFinite(fields[k]))) throw new Error('Incomplete SVG rubric');
        rubric.set(id, fields);
      }
    }
    return rows.map(s => {
      const run = runs.get(s.representativeRunId), fields = rubric.get(s.representativeRunId);
      if (!run || !fields || !s.model || ![s.displayedScore, s.score, s.rank, s.completedRuns, s.scoreDispersion,
        s.pairwiseRating, ...Object.values(s.pairwise)].every(Number.isFinite)) throw new Error('Incomplete SVG standing for ' + s.model);
      const { costUsd, totalTokens, latencyMs } = run.metrics;
      return { model: s.model, score: s.displayedScore, setting: s.toolPolicy, harness: s.executionRoute,
        trials: s.completedRuns, link: run.url, date: run.completedAt?.slice(0, 10), cost: costUsd ?? undefined,
        metrics: { ...fields, unroundedScore: s.score, judgeSpread: s.scoreDispersion,
          pairwiseRating: s.pairwiseRating, ...s.pairwise, ...(totalTokens == null ? {} : { totalTokens }),
          ...(latencyMs == null ? {} : { latencySeconds: latencyMs / 1000 }) } };
    });
  },
};
export default board;
