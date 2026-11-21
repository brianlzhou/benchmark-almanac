// MBench sorts motion-generation systems by Motion Generalizability. Read the same per-method JSON files as the Hugging Face Space.
import type { Leaderboard } from "./types.ts";
import { fetchText } from "../lib/util.ts";

const board: Leaderboard = {
  benchmark: "mbench-motion",
  url: "https://huggingface.co/spaces/wruisi/MBench_leaderboard",
  feed: "https://huggingface.co/api/spaces/wruisi/MBench_leaderboard/tree/main/eval_results",
  terms: "The Space card lists cc without a specific Creative Commons license. https://huggingface.co/spaces/wruisi/MBench_leaderboard/blob/main/README.md The public Hub files are readable. Hugging Face allows the feed in robots.txt.",
  stats: {
    motion_condition_consistency: { name: 'Motion condition consistency', unit: 'score', better: 'higher', note: 'Score from 0 to 1.' }, jitter_degree: { name: 'Jitter degree', unit: 'score', better: 'lower' }, dynamic_degree: { name: 'Dynamic degree', unit: 'score', better: 'higher' }, foot_floating: { name: 'Foot floating', unit: 'score', better: 'lower' }, foot_sliding: { name: 'Foot sliding', unit: 'score', better: 'lower' }, body_penetration: { name: 'Body penetration', unit: 'score', better: 'lower' }, pose_quality: { name: 'Pose quality', unit: 'score', better: 'higher' }, ground_penetration: { name: 'Ground penetration', unit: 'score', better: 'lower' },
  },
  async fetch() {
    const files: {path:string,type:string}[] = JSON.parse(await fetchText(this.feed));
    const rows = [];
    for (const file of files.filter(f => f.type === 'file' && /^eval_results\/[^/]+\.json$/.test(f.path))) {
      await new Promise(resolve => setTimeout(resolve,1050));
      const r = JSON.parse(await fetchText(this.url+'/raw/main/'+file.path));
      const metrics:Record<string,number> = {};
      for (const key of ['motion_condition_consistency','jitter_degree','dynamic_degree','foot_floating','foot_sliding','body_penetration','pose_quality','ground_penetration']) {
        if (!Number.isFinite(r[key])) throw new Error('Missing MBench metric '+key);
        metrics[key]=r[key];
      }
      if (!r.method || !Number.isFinite(r.motion_generalizability)) throw new Error('Missing MBench result');
      rows.push({model:r.method,score:r.motion_generalizability,link:r.link,metrics});
    }
    if (rows.length < 9) throw new Error('Missing MBench models');
    return rows;
  },
};
export default board;
