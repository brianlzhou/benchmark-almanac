// CivBench (Vox Deorum, Civilization V with Vox Populi). The front page of the latest release is static HTML
// whose "Who plays best?" chart is a server-rendered SVG: each `lb-row` link holds the rank, the model name,
// the setup (deciding "every turn", "every 5 turns" or "agentic") and the rating, a pairwise skill rating
// against the built-in AI (about 1500). The rating is the score and the setup becomes the harness, since
// most models are tested in several setups. Rows for the built-in AI and the do-nothing baseline are skipped.
// Each link's tooltip (data-tip) adds the cost "per player per game" (one game is one task, kept as the cost),
// the rating's ± range (`ciLow`, `ciHigh`) and the share of head-to-head games won against the built-in AI
// (`winRate`, percent). The linked usage CSV adds output tokens per player per game.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
import { num, text } from '../lib/html.ts';

const PAGE = 'https://vox-deorum.github.io/civ-bench-latest/';

const board: Leaderboard = {
  benchmark: 'civbench',
  url: PAGE,
  feed: `${PAGE} (server-rendered SVG chart "Who plays best?", rating)`,
  terms: 'Static GitHub Pages site of the Vox Deorum project (no robots.txt, so nothing is disallowed); it publishes no terms.',
  chart:{title:"Cost versus skill",x:{key:"cost",label:"Cost per player per game",unit:"$",better:"lower",log:true},y:{key:"score",label:"Skill rating",unit:"rating",better:"higher"}},
  aliases: {
    'Opus-5.5': 'claude-opus-5-5',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await fetchText(PAGE);
    const usage=parseCsv(await fetchText(PAGE+"assets/perf_usage_efficiency/usage_vs_rating.csv"));
    const rows: LeaderboardRow[] = [];
    for (const m of html.matchAll(/<a class="lb-row[^"]*"[\s\S]*?<\/a>/g)) {
      const a = m[0];
      const model = text(a.match(/<text class="name"[^>]*>([\s\S]*?)<\/text>/)?.[1] ?? '');
      const mode = text(a.match(/<g class="mode[^"]*"[\s\S]*?<text[^>]*>([\s\S]*?)<\/text>/)?.[1] ?? '');
      const score = num(text(a.match(/<text class="val"[^>]*>([\s\S]*?)<\/text>/)?.[1] ?? ''));
      if (!model || score === undefined || /built-in|vox populi|vpai|do-nothing/i.test(model)) continue;
      const tip = text(a.match(/data-tip="([^"]*)"/)?.[1] ?? '');
      const metrics: Record<string, number> = {};
      const pm = num(tip.match(/Rating:\s*\**\d+\**\s*\(±\s*([\d.]+)/)?.[1]);
      if (pm !== undefined) Object.assign(metrics, { ciLow: score - pm, ciHigh: score + pm });
      const win = num(tip.match(/Beats the built-in AI\s*\**([\d.]+)%/)?.[1]);
      if (win !== undefined) metrics.winRate = win;
      const cost = num(tip.match(/Costs about\s*\**\$([\d.,]+)\**\s*per player per game/)?.[1]);
      const link=new URL(text(a.match(/href="([^"]+)"/)?.[1]??''),PAGE);
      const identity=link.searchParams.get('strategist'),condition=link.searchParams.get('condition');
      const detail=usage.find(r=>r.base_identity===identity&&(r.condition==='base'?'Every-turn':r.condition.replace(/^-/,'') )===condition);
      const tokens=detail?num(detail.avg_output):undefined;
      if(detail){for(const key of ['avg_input','avg_cached_input','token_complete_player_games','player_games']){const n=num(detail[key]);if(n!==undefined)metrics[key]=n;}}
      if(cost!==undefined)metrics.cost=cost;
      rows.push({ model, score, harness: mode || undefined, cost, tokens, metrics });
    }
    if (!rows.length) throw new Error('no CivBench rows');
    return rows;
  },
};
export default board;
