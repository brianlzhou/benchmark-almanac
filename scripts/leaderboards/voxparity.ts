// VoxParity measures the benefit of audible cues in tool selection. The Space ranks contestants by gain and reports separate comparison groups for models without transcript twins.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://huggingface.co/spaces/bhavikmangla/voxparity-leaderboard/resolve/main/leaderboard.json";
interface Estimate { mean: number; lo: number; hi: number; items: number; n: number }
interface Entry {
  transcript_path: boolean; role: string; mode: string; name: string; metric: string; gain: Estimate; cue_credit: Estimate;
  both_right: number | null; probe: Estimate | null; p_holm: number | null;
}

const board: Leaderboard = {
  benchmark: "voxparity",
  url: "https://huggingface.co/spaces/bhavikmangla/voxparity-leaderboard",
  feed: FEED,
  terms: "The Space declares CC BY 4.0 in https://huggingface.co/spaces/bhavikmangla/voxparity-leaderboard/blob/main/README.md.",
  stats: { cueCredit: {name: 'Cue credit', unit: 'score', better: 'higher'}, items: {name: 'Items', unit: 'count'}, observations: {name: 'Observations', unit: 'count'}, bothRight: {name: 'Both right rate', unit: 'score', better: 'higher'}, holmP: {name: 'Holm p-value', unit: 'score', better: 'lower'}, probe: {name: 'Probe score', unit: 'score', better: 'higher'}, probeAnswers: {name: 'Probe answers', unit: 'count'} },
  aliases: {"Qwen2.5-Omni-7B (local)":"qwen2-5-omni-7b","Phi-4-multimodal (local, MLX bf16)":"phi-4-multimodal","Nemotron-3-Nano-Omni":"nemotron-3-nano-omni-30b-a3b"},
  async fetch() {
    const data = await fetchJson<{ rows: Entry[]; counts: { contestants: number; twin_bearing: number } }>(FEED);
    const entries = data.rows.filter(r => r.role === 'contestant');
    if (entries.length < 28 || entries.length !== data.counts.contestants) throw new Error('Incomplete VoxParity leaderboard');
    // Audio-only systems appear in a separate table with a different score.
    const ranked = entries.filter(r => r.transcript_path);
    if (ranked.length < 23 || ranked.length !== data.counts.twin_bearing) throw new Error('Missing transcript comparisons');
    return ranked.map(r => {
      if (!r.name || ![r.gain.mean, r.gain.lo, r.gain.hi, r.cue_credit.mean].every(Number.isFinite))
        throw new Error('Missing VoxParity gain or cue credit');
      const metrics: Record<string, number> = { cueCredit: r.cue_credit.mean, cueCreditLow: r.cue_credit.lo,
        cueCreditHigh: r.cue_credit.hi, items: r.gain.items, observations: r.gain.n };
      if (r.both_right != null) metrics.bothRight = r.both_right;
      if (r.p_holm != null) metrics.holmP = r.p_holm;
      if (r.probe) Object.assign(metrics, { probe: r.probe.mean, probeLow: r.probe.lo, probeHigh: r.probe.hi, probeAnswers: r.probe.n });
      return { model: r.name, setting: r.mode, score: r.gain.mean, low: r.gain.lo, high: r.gain.hi, metrics };
    });
  },
};
export default board;
