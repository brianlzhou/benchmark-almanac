// OpenCompass ranks multimodal models by Avg Score. The Space configuration contains the displayed six-benchmark comparison.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { text } from '../lib/html.ts';

const feed = "https://opencompass-openlmm-subjective-leaderboard.hf.space/config";

const board: Leaderboard = {
  benchmark: "openlmm-subjective-leaderboard",
  url: "https://huggingface.co/spaces/opencompass/openlmm_subjective_leaderboard",
  feed,
  terms: "The Space publishes its loader at https://huggingface.co/spaces/opencompass/openlmm_subjective_leaderboard/tree/main. Results licensing requires separate verification. Hugging Face robots.txt permits the public Space.",
  parts: { creationReward: 'Creation_MMBench reward', creationVfs: 'Creation_MMBench VFS', 'MIA-Bench': 'MIA-Bench', 'MM-IFEval': 'MM-IFEval', MMAlignBench: 'MMAlignBench', MMVet: 'MMVet', WildVision: 'WildVision' },
  aliases: {
    "GPT-4o (1120, detail-high)": "gpt-4o-nov-2024",
    "GPT-4o (0806, detail-high)": "gpt-4o-aug-2024",
    "GPT-4o-mini (0718, detail-high)": "gpt-4o-mini",
  },
  async fetch() {
    type Table = {headers?: string[], data?: (string | number | null)[][]};
    const cfg = await fetchJson<{components: {props: {value?: Table}}[]}>(feed);
    const t = cfg.components.map(c => c.props.value).find(t => t?.headers?.includes('Avg Score'));
    const cols = ['Rank','Method','Param (B)','Language Model','Vision Model','Eval Date','Avg Score','Avg Rank','Creation_MMBench','MIA-Bench','MM-IFEval','MMAlignBench','MMVet','WildVision'];
    if (!t?.data || t.data.length < 29 || t.headers?.join('|') !== cols.join('|')) throw new Error('Missing subjective leaderboard');
    return t.data.map(r => {
      const score = r[6];
      if (typeof score !== 'number') throw new Error('Missing Avg Score');
      const metrics: Record<string, number> = {};
      for (const [i,k] of cols.entries()) if (i >= 7 && typeof r[i] === 'number') metrics[k] = Number(r[i]);
      const [reward, vfs] = String(r[8]).split('/').map(Number);
      if (Number.isFinite(reward)) metrics.creationReward = reward;
      if (Number.isFinite(vfs)) metrics.creationVfs = vfs;
      return { model: text(String(r[1])), score, metrics, link: String(r[1]).match(/href="([^"]+)"/)?.[1], params: typeof r[2] === 'number' ? r[2] : undefined, date: String(r[5]).replaceAll('/', '-') };
    });
  },
};

export default board;
