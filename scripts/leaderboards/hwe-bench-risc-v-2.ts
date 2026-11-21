// HWE Bench V2 ranks CPU designs by held-out iterations per second. The official table gives the geometric mean over six runs per agent.
import type { Leaderboard } from "./types.ts";
import { fetchText } from "../lib/util.ts";
import { num, tables } from "../lib/html.ts";
const board: Leaderboard = {
  benchmark: "hwe-bench-risc-v-2",
  url: "https://hwebench.com/v2.html",
  feed: "https://raw.githubusercontent.com/FeSens/auto-arch-tournament/v2/research/runs/EXP-2026-09-28-v2-main/analysis_final.json",
  terms: "The author repository uses Apache License 2.0. https://raw.githubusercontent.com/FeSens/auto-arch-tournament/main/LICENSE The project site has no robots.txt.",
  stats: {
    coreMark: { name: 'CoreMark score', unit: 'score', better: 'higher' },
    fmaxMHz: { name: 'Maximum frequency', unit: 'score', better: 'higher' },
    areaLUT4: { name: 'Four-input lookup table area', unit: 'count', better: 'lower' },
  },
  async fetch() {
    const table = tables(await fetchText(this.url)).find(t => t[0]?.[1]?.text === 'Held-out iter/s');
    const result = JSON.parse(await fetchText(this.feed));
    if (!table || result.ranking.length < 6 || table[0][5]?.text !== 'Area (LUT4)') throw new Error('Missing hardware ranking');
    const systems = table.slice(1).filter(r => /\((Claude Code|Codex CLI)\)/.test(r[0].text));
    if (systems.length !== result.ranking.length) throw new Error('Hardware table and analysis differ');
    return systems.map(r => {
      const [,model,harness] = r[0].text.match(/^(.+?) \(([^)]+)\)$/)!;
      const key = ({'Opus 5.5':'Opus','GPT-6.1 Sol':'Sol 6.1','GPT-6 Astra':'Astra','GPT-6 Luna':'Luna'} as Record<string,string>)[model] || model;
      const v = result.ranking.find((a:{system:string}) => a.system === key);
      if (!v || Math.round(v.geomean) !== num(r[1].text)) throw new Error('Missing hardware score for '+model);
      return {model,harness,score:v.geomean,trials:v.n,metrics:{rankLow:v.rank95[0],rankHigh:v.rank95[1],coreMark:num(r[3].text)!,fmaxMHz:num(r[4].text)!,areaLUT4:num(r[5].text)!}};
    });
  },
};
export default board;
