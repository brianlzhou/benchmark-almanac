// The Washington Post orders the models by left-only minus right-only responses. Its public chart uses separate files for reporter annotations and five judge-scored runs.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = "https://raw.githubusercontent.com/washingtonpost/political-bias-llm-eval/main/data/clean/modelslant-responses.json";
const board: Leaderboard = {
  benchmark: "washington-post-political-lean",
  url: "https://www.washingtonpost.com/technology/interactive/2026/06/24/are-ai-chatbots-like-chatgpt-politically-biased-we-tested-them/",
  feed,
  terms: "The repository uses CC BY-NC-SA 4.0. The article host restricts some crawlers and paths. The raw feed host returns 404 for robots.txt.",
  parts: { left:'Left only', right:'Right only', both:'Both sides' },
  async fetch() {
    type Answer = {model:string; prompt:string; created:string; lean:'left'|'right'|'both'};
    const manual = await fetchJson<Answer[]>(feed);
    const groups = Map.groupBy(manual,r => r.model);
    const short = (id:string) => id.split('/').at(-1)!;
    if (groups.size < 6) throw new Error('Missing annotated models');
    const rows = [...groups].map(([id,answers]) => {
      const counts = {left:0,right:0,both:0};
      if (answers.length < 30 || new Set(answers.map(a => a.prompt)).size !== answers.length) throw new Error('Incomplete annotated answers');
      for (const a of answers) {
        if (!Object.hasOwn(counts,a.lean)) throw new Error('Unknown lean label');
        counts[a.lean]++;
      }
      const pct = 100 / answers.length;
      const dates = new Set(answers.map(a => a.created.slice(0,10)));
      return { model:short(id), setting:'Reporter annotations', score:pct*(counts.left-counts.right), date:dates.size === 1 ? [...dates][0] : undefined,
        metrics:{ left:pct*counts.left, right:pct*counts.right, both:pct*counts.both } };
    });
    await new Promise(r => setTimeout(r,1000));
    type Trial = {model:string; run:number; left:number; right:number; both:number};
    const repeats = Map.groupBy(await fetchJson<Trial[]>(feed.replace('responses.json','variance.json')),r => r.model);
    for (const id of groups.keys()) {
      const runs = repeats.get(id);
      if (!runs || runs.length !== 5 || new Set(runs.map(r => r.run)).size !== 5) throw new Error('Missing repeat runs');
      for (const r of runs) {
        if (![r.left,r.right,r.both].every(Number.isFinite)) throw new Error('Missing repeated-run shares');
        rows.push({ model:short(id), setting:'gpt-oss-20b judge, run '+r.run, score:100*(r.left-r.right), date:undefined,
          metrics:{ left:100*r.left,right:100*r.right,both:100*r.both } });
      }
    }
    return rows;
  },
};
export default board;
