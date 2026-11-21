// FiVE-Bench ranks video editors by FiVE-Acc. The Space reads one evaluation file per editor and publishes the original videos as a baseline.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = "https://huggingface.co/api/spaces/LIMinghan/FiVE-Bench-leaderboard/tree/main/eval-results";

const board: Leaderboard = {
  benchmark: "five-bench-video-editing",
  url: "https://huggingface.co/spaces/LIMinghan/FiVE-Bench-leaderboard",
  feed,
  terms: "The authors label the leaderboard Space MIT. https://huggingface.co/spaces/LIMinghan/FiVE-Bench-leaderboard/blob/main/README.md Hugging Face allows these files in robots.txt.",
  stats: {
    structure_dist: { name: 'Structure distance', unit: 'score', better: 'lower' }, background_psnr: { name: 'Background PSNR', unit: 'score', better: 'higher' },
    background_lpips: { name: 'Background LPIPS', unit: 'score', better: 'lower' }, background_mse: { name: 'Background MSE', unit: 'score', better: 'lower' },
    background_ssim: { name: 'Background SSIM', unit: 'score', better: 'higher' }, text_alignment_clips: { name: 'Text alignment CLIP score', unit: 'score', better: 'higher' },
    text_alignment_clips_edit: { name: 'Edited text alignment CLIP score', unit: 'score', better: 'higher' }, iqa_niqe: { name: 'Image quality NIQE', unit: 'score', better: 'lower' },
    motion_mfs: { name: 'Motion feature similarity', unit: 'score', better: 'higher' }, time_per_frame: { name: 'Time per frame', unit: 'seconds', better: 'lower' },
    vlm_accuracy_five_yn: { name: 'Vision-language model yes-no accuracy', unit: '%', better: 'higher' }, vlm_accuracy_five_mc: { name: 'Vision-language model multiple-choice accuracy', unit: '%', better: 'higher' },
    vlm_accuracy_five_u: { name: 'Vision-language model unconstrained accuracy', unit: '%', better: 'higher' }, vlm_accuracy_five_intersect: { name: 'Vision-language model intersection accuracy', unit: '%', better: 'higher' }, vlm_accuracy_five_acc: { name: 'FiVE accuracy', unit: '%', better: 'higher' },
  },
  async fetch() {
    const files = await fetchJson<{ path: string; type: string }[]>(feed);
    const rows: LeaderboardRow[] = [];
    for (const file of files.filter(f => f.type === 'file' && f.path.endsWith('.json') && !f.path.includes('/Source_videos_'))) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const link = 'https://huggingface.co/spaces/LIMinghan/FiVE-Bench-leaderboard/raw/main/' + file.path;
      const { config, results } = await fetchJson<{ config: { model: string }; results: Record<string, Record<string, number>> }>(link);
      const score = results.vlm_accuracy?.five_acc;
      if (!config.model || !Number.isFinite(score)) throw new Error('Invalid FiVE evaluation: ' + file.path);
      const metrics: Record<string, number> = {};
      for (const [group, values] of Object.entries(results)) {
        for (const [key, value] of Object.entries(values)) if (Number.isFinite(value)) metrics[group + '_' + key] = value;
      }
      rows.push({ model: config.model, score, link, metrics });
    }
    if (rows.length < 7) throw new Error('Missing FiVE editors');
    return rows;
  },
};

export default board;
