// MIRAGE-MMMT reports conversation accuracy under zero-shot and chain-of-thought prompting. The project page reads a JSON row per model.
import type { Leaderboard } from "./types.ts";
import { fetchText } from "../lib/util.ts";

const board: Leaderboard = {
  benchmark: "mirage-mmmt",
  url: "https://mirage-benchmark.github.io/#MIRAGE-MMMT",
  feed: "https://mirage-benchmark.github.io/leaderboards/MMMT.json",
  terms: "The site credits its website template under CC BY-SA 4.0. It does not state reuse terms for the leaderboard data. https://mirage-benchmark.github.io/ The project host has no robots.txt.",
  aliases: {"Qwen2.5-VL 72B Inst":"qwen2-5-vl-72b","LLaMA 4 Scout 17B":"llama-4-scout"},
  parts: { clarify:"Clarify",respond:"Respond" },
  async fetch() {
    const models = JSON.parse(await fetchText(this.feed)) as ({model:string,group:string} & Record<string,unknown>)[];
    if (models.length < 6) throw new Error('Incomplete MIRAGE-MMMT board');
    return models.flatMap(r => ['zero_shot','cot'].map(mode => {
      const [score,clarify,respond] = ['acc','clarify','respond'].map(k => r[mode+'_'+k]);
      if (!r.model || typeof score !== 'number' || typeof clarify !== 'number' || typeof respond !== 'number') throw new Error('Missing MIRAGE score');
      return {model:r.model,open:r.group==='open',score,setting:mode==='cot'?'Chain-of-Thought':'Zero-Shot',metrics:{clarify,respond}};
    }));
  },
};
export default board;
