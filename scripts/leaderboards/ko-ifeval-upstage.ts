// Ko-IFEval averages strict prompt and instruction accuracy for each model, precision and shot count.
// Read the latest result for each configuration, including loose accuracy, standard errors and run settings.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://huggingface.co/api/datasets/open-ko-llm-leaderboard/results";
const board: Leaderboard = {
  benchmark: "ko-ifeval-upstage",
  url: "https://huggingface.co/spaces/upstage/open-ko-llm-leaderboard",
  feed: FEED,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  parts: {
    promptStrict: "Prompt-level strict accuracy",
    instructionStrict: "Instruction-level strict accuracy",
  },
  stats: {
    promptLoose: { name: 'Prompt-level loose accuracy', unit: '%', better: 'higher' },
    instructionLoose: { name: 'Instruction-level loose accuracy', unit: '%', better: 'higher' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const manifest = await fetchJson<any>(FEED);
    if (!Array.isArray(manifest.siblings)) throw new Error("Missing results manifest");
    const files = manifest.siblings.map((entry: { rfilename: string }) => entry.rfilename)
      .filter((file: string) => file.endsWith(".json")).sort();
    const selected = new Map<string, { row: LeaderboardRow; stamp: string }>();
    let last = Date.now();
    for (const file of files) {
      await new Promise(resolve => setTimeout(resolve, Math.max(0, 2100 - (Date.now() - last))));
      last = Date.now();
      const encoded = file.split("/").map(encodeURIComponent).join("/");
      const base = "https://huggingface.co/datasets/open-ko-llm-leaderboard/results";
      const result = await fetchJson<any>(base + "/raw/main/" + encoded);
      const scores = result.results?.ko_ifeval;
      if (!scores) continue;
      const config = result.config_general || result.config;
      if (!config?.model_name) throw new Error("Missing model identity in " + file);
      const strict = scores["prompt_level_strict_acc,none"];
      const instruction = scores["inst_level_strict_acc,none"];
      if (!Number.isFinite(strict) || !Number.isFinite(instruction)) throw new Error("Missing strict scores in " + file);
      const metrics: Record<string, number> = {};
      for (const [level, label] of [["prompt_level", "prompt"], ["inst_level", "instruction"]]) {
        for (const [mode, suffix] of [["strict", "Strict"], ["loose", "Loose"]]) {
          const key = level + "_" + mode + "_acc";
          const score = scores[key + ",none"];
          const error = scores[key + "_stderr,none"];
          if (Number.isFinite(score)) metrics[label + suffix] = 100 * score;
          if (Number.isFinite(error)) metrics[label + suffix + "Stderr"] = 100 * error;
        }
      }
      const shots = config.num_few_shot_default;
      const setting = [config.model_dtype, shots == null ? null : shots + "-shot"].filter(Boolean).join(", ");
      const stamp = file.split("/").at(-1)!;
      const date = stamp.match(/\d{4}-\d{2}-\d{2}/)?.[0];
      const key = JSON.stringify([config.model_name, setting]);
      const prior = selected.get(key);
      if (!prior || stamp > prior.stamp) {
        const link = base + "/blob/" + (manifest.sha || "main") + "/" + encoded;
        selected.set(key, { stamp, row: { model: config.model_name, score: 50 * (strict + instruction), setting, date, link, metrics } });
      }
    }
    const rows = [...selected.values()].map(entry => entry.row);
    if (!rows.length) throw new Error('No whole-benchmark scores found');
    const seen = new Set<string>();
    for (const r of rows) {
      if (!r.model || !Number.isFinite(r.score)) throw new Error('Invalid model or score');
      if (r.score < 0 || r.score > 100) throw new Error('Score outside percent range');
      if (/^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model)) r.model += ' (snapshot unspecified)';
      const key = JSON.stringify([r.model, r.setting, r.harness]);
      if (seen.has(key)) throw new Error('Duplicate model configuration: ' + key);
      seen.add(key);
    }
    return rows;
  },
};
export default board;
