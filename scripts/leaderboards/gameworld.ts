// GameWorld. gameworld-project.github.io is a static page whose Results section has three panels written in
// the HTML (article.leaderboard): Generalist Multimodal Agents, Computer-Use Agents and Human Baselines. Each
// entry gives a model and its Overall PG, the mean progress (percent) over 170 tasks in 34 browser games, which
// the page ranks by. This file reads the two agent panels and records the interface as the harness, since
// one model can appear in both; the human baselines are skipped.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { mdTables } from './big-bench-extra-hard.ts';
import { num, text } from '../lib/html.ts';

const PAGE = 'https://gameworld-project.github.io/';

const board: Leaderboard = {
  benchmark: 'gameworld',
  url: PAGE,
  feed: `${PAGE} (original Overall PG panels and main README fine-control PG)`,
  terms: 'Static project page on GitHub Pages (no robots.txt); the page invites new results and states no terms.',
  aliases: {
    'OpenAI-Computer-Use': 'computer-use-preview-2025-03-11',
  },
  async fetch() {
    const html = await fetchText(PAGE);
    const rows: LeaderboardRow[] = [];
    for (const panel of html.matchAll(/<article class="leaderboard panel">([\s\S]*?)<\/article>/g)) {
      const title = text(panel[1].match(/<h3>([\s\S]*?)<\/h3>/)?.[1] ?? '');
      const harness = /^generalist/i.test(title) ? 'Generalist interface' : /^computer-use/i.test(title) ? 'Computer-use interface' : undefined;
      if (!harness) continue;
      for (const e of panel[1].matchAll(/class="leaderboard-model-name"[^>]*>([^<]+)<[\s\S]*?class="entry-pg">([^<]+)</g)) {
        const score = num(e[2]);
        if (score !== undefined) rows.push({ model: text(e[1]), score, harness });
      }
    }
    if (rows.length < 10) throw new Error(`only ${rows.length} GameWorld rows`);
    const readme = await fetchText('https://raw.githubusercontent.com/gameworld-project/gameworld/main/README.md');
    const t=mdTables(readme).find(t=>t.head.includes('CUA PG'));
    if(!t)throw new Error('Missing fine-control table');
    for(const r of t.rows) {
      const model=r[0].split(/\s*\[/)[0].trim();
      for(const [sr,pg,harness] of [[2,3,'Computer-use interface'],[4,5,'Generalist interface']] as const){
        const score=num(r[pg]);if(score===undefined)continue;
        const metrics:Record<string,number>={};const success=num(r[sr]),runs=num(r[1]);
        if(success!==undefined)metrics['success rate (%)']=success;if(runs!==undefined)metrics['runs per task']=runs;
        rows.push({model,score,harness,setting:'Fine-Control Protocol; 400-step limit',metrics});
      }
    }
    return rows;
  },
};
export default board;
