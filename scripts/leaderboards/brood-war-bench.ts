// Brood War Bench (Ben Swerdlow). The report page bw.swerdlow.dev/report is static HTML with a leaderboard
// table: Rank | System | Wins | Losses | APM | Cost / game | Win rate, from a round robin of agent and
// model pairs. Win rate is the score and Cost / game the cost. APM (game actions per minute) is kept in
// metrics as "apm". Systems are written "Codex Astra / xhigh":
// a leading "Codex" is the harness and the part after the slash the effort. "Claude Fable", "Claude
// Sonnet" and "Claude Haiku" name no version, so they are left for the resolver to reject rather than
// guessed.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const PAGE = 'https://bw.swerdlow.dev/report';

const board: Leaderboard = {
  benchmark: 'brood-war-bench',
  url: PAGE,
  feed: `${PAGE} (static HTML table, Win rate)`,
  terms: 'Static report page; bw.swerdlow.dev robots.txt allows /report, and the site publishes no terms.',
  aliases: {
    // "Codex Astra" is GPT-6 Astra in Codex; "Codex 5.6 Sol" is GPT-5.6 Sol
    Astra: 'gpt-6-astra',
    '5.6 Sol': 'gpt-5-6-sol',
    '5.6 Luna': 'gpt-5-6-luna',
    '5.6 Terra': 'gpt-5-6-terra',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const t = tables(await fetchText(PAGE)).find((rows) => rows[0]?.some((c) => c.text === 'Win rate'));
    if (!t) throw new Error('Brood War Bench table not found');
    const head = t[0].map((c) => c.text);
    const [iSys, iWin, iCost, iApm] = [head.indexOf('System'), head.indexOf('Win rate'), head.indexOf('Cost / game'), head.indexOf('APM')];
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      const [name, effort] = (r[iSys]?.text ?? '').split(/\s*\/\s*/);
      const score = num(r[iWin]?.text);
      if (!name || score === undefined) continue;
      const codex = name.match(/^Codex\s+(.+)$/);
      const metrics:Record<string,number>={};
      for(const [label,key] of [['APM','apm'],['Wins','wins'],['Losses','losses']]){
        const value=num(r[head.indexOf(label)]?.text);
        if(value!==undefined)metrics[key]=value;
      }
      rows.push({
        model: codex ? codex[1] : name,
        score,
        setting: effort?.toLowerCase() || undefined,
        harness: codex ? 'Codex' : undefined,
        cost: num(r[iCost]?.text),
        metrics,
      });
    }
    return rows;
  },
};
export default board;
