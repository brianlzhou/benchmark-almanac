// BRIDGE: the published Average Performance across the clinical task suite.
// Zero-shot, few-shot and chain-of-thought are whole-suite prompting settings.
// Read each clinical task score from the columns following Average Performance.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { num } from '../lib/html.ts';

const FEED = "https://huggingface.co/spaces/YLab-Open/BRIDGE-Medical-Leaderboard/raw/main/leaderboards/Zero-Shot_leaderboard.json";
const board: Leaderboard = {
  benchmark: "bridge-clinical-text",
  url: "https://huggingface.co/spaces/YLab-Open/BRIDGE-Medical-Leaderboard/raw/main/leaderboards/Zero-Shot_leaderboard.json",
  feed: FEED,
  terms: "Public maker-published results. Robots rules checked on 2026-11-08. Scores remain credited to the source.",
  
  async fetch() {
    const out: LeaderboardRow[] = [];
    const parts: Record<string, string> = {};
    for(const mode of ['Zero-Shot','Few-Shot','CoT']){
      if(out.length)await new Promise(r=>setTimeout(r,2100));
      const data=await fetchJson<Record<string,Record<string,any>>>(FEED.replace('Zero-Shot',mode));
      const columns = Object.keys(data);
      const tasks = columns.slice(columns.indexOf('Average Performance') + 1);
      for(const key of Object.keys(data.Model)){
        const score=num(String(data['Average Performance'][key]));
        const metrics: Record<string, number> = {};
        for (const task of tasks) {
          const value = data[task][key];
          if (typeof value === 'number' && Number.isFinite(value)) {
            metrics[task] = value;
            parts[task] = task;
          }
        }
        if(typeof score==='number')out.push({metrics,model:data.Model[key],score,license:typeof data['Model: License']?.[key]==='string'?data['Model: License'][key]:undefined,open:data['Model: Accessibility']?.[key]==='Open Source'?true:data['Model: Accessibility']?.[key]==='Proprietary'?false:undefined,params:Number(data['Size (B)']?.[key])>0?Number(data['Size (B)'][key]):undefined,setting:[mode, /Non-Thinking$/i.test(data.Model[key])?'non-thinking':/Thinking$/i.test(data.Model[key])?'thinking':''].filter(Boolean).join(', ')});
      }
    }
    board.parts = parts;
    return out;
  },
};

// The shared resolver otherwise guesses the newest snapshot for an undated family name.
// Preserve these board labels as unlisted entries until the source identifies a snapshot.
const readRows = board.fetch;
board.fetch = async () => (await readRows()).map(r => {
  const name = r.model.replace(/^[\w.-]+\//, '').replace(/[ _]/g, '-');
  const ambiguous = /^(?:gpt-4o|gpt-4|gpt-4-turbo|gpt-3[.-]5-turbo|claude-3[.-]5-sonnet|claude-sonnet-3[.-]5|deepseek-v3|deepseek-r1|gemini-(?:1[.-]5|2[.-]0|2[.-]5)-(?:pro|flash)(?:-preview|-exp|-thinking|-thinking-exp)?)$/i.test(name);
  return ambiguous ? {...r, model: `${r.model} (snapshot unspecified)`} : r;
});

export default board;
