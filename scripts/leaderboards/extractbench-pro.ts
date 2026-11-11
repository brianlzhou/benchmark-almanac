// ExtractBench Pro ranks by percent perfect documents across all challenges.
// Challenge scores remain metrics, with pipeline, reasoning effort and USD per page preserved.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://raw.githubusercontent.com/run-llama/ExtractBench/main/leaderboard-pro.csv";
const board: Leaderboard = {
  benchmark: "extractbench-pro", url: "https://github.com/run-llama/ExtractBench", feed: FEED,
  terms: "Public official results, subject to the source repository license and host terms.",
  aliases: { 'Gemini CLI (Gemini 4 Argon Medium)': 'gemini-4-argon' },
  async fetch() {
    const source = await fetchText(FEED);
    const all = tables(source.replace(/<!--[\s\S]*?-->/g, "")).map(t => t.map(r => r.map(c => c.text)));
    const rows: LeaderboardRow[] = [];
    for(const r of parseCsv(source)){if(r.include_in_rankings!=="true")continue;const score=num(r.Perfect_Documents);if(score===undefined)continue;let model=r.Provider,harness=r.Pipeline;model=model.replace(/^Claude Code /,"Claude ").replace(/^Codex /,"").replace(/ (Low|Medium|High)$/i,"");const metrics:Record<string,number>={};for(const k of ["Value_F1","Word_Grounding","Page_Grounding","Perfect_Documents_No_Time_Limit","Value_F1_No_Time_Limit","Word_Grounding_No_Time_Limit","Page_Grounding_No_Time_Limit","Cost_Per_Page","Documents"]){const n=num(r[k]);if(n!==undefined)metrics[k]=n;}rows.push({model,score,harness,setting:[r.Challenge,r.Reasoning].filter(Boolean).join("; "),metrics});}
    if (!rows.length) throw new Error("No extractbench-pro score rows");
    return rows.filter(r=>/^all(?:;|$)/.test(r.setting??'')).map(r=>({...r,
      setting:r.setting!.replace(/^all(?:; )?/, '')||undefined,
      metrics:{...r.metrics,...Object.fromEntries(rows.filter(x=>x.model===r.model&&x.harness===r.harness&&x.setting?.split('; ').slice(1).join('; ')===r.setting?.split('; ').slice(1).join('; ')&&!/^all(?:;|$)/.test(x.setting??'')).map(x=>[x.setting!.split('; ')[0],x.score]))}}));
  },
};
// Undated family names do not identify a release. Keep these as unlisted source entries.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows()).map(r => ({...r,
  model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?3\.5(?:[- ]turbo)?|gemini[- ]?(?:1\.5[- ](?:pro|flash)|2\.5[- ](?:pro|flash)|2\.0[- ]flash)|claude[- ]?3\.5[- ]?sonnet|deepseek[- ]v3)$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model,
}));
export default board;

