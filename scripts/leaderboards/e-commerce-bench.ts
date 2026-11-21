// E-Commerce Bench (Qwen). The leaderboard is Table 1 in the QwenLM/E-CommerceBench README, an HTML table
// of 21 models (five episodes each) grouped into tiers. The README names the asset multiplier, end-of-year
// assets over the ¥100,000 opening balance, as the primary score; the table gives mean final assets in
// thousands of yuan, so the score is that figure divided by 100 (1,431 ¥k is a multiplier of 14.31).
// The table's std ¥k (over the five episodes, divided by 100 like the score), Tool calls and Turns (per episode)
// are kept alongside the cash-flow, negotiation and bankruptcy measures.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const FEED = 'https://raw.githubusercontent.com/QwenLM/E-CommerceBench/main/README.md';

const board: Leaderboard = {
  benchmark: 'e-commerce-bench',
  url: 'https://github.com/QwenLM/E-CommerceBench#results',
  feed: `${FEED} (Table 1, mean final assets)`,
  terms: 'README table in the QwenLM/E-CommerceBench repository, licensed Apache-2.0.',
  aliases: {
    'Qwen3.5-Plus': 'qwen-3-5-plus-hosted-397b-a17b',
  },
  stats: {
    toolCalls: { name: 'Tool calls', unit: 'count', better: 'lower' }, steps: { name: 'Steps', unit: 'count', better: 'lower' }, turns: { name: 'Turns', unit: 'count', better: 'lower' }, csePlus: { name: 'Bargaining range share', unit: 'score', better: 'higher' }, badSpendPercent: { name: 'Bad spend', unit: '%', better: 'lower' }, drawdownOverPeak: { name: 'Drawdown over peak', unit: 'score', better: 'lower', note: 'Fraction of peak total assets lost, stored from 0 to 1.' }, yuanPerToolCall: { name: 'Yuan per tool call', unit: 'cny', better: 'lower' }, controllableReturnPp: { name: 'Controllable return', unit: 'score', better: 'lower' }, anchorRatio: { name: 'Anchor ratio', unit: 'score', better: 'lower' }, bankruptRuns: { name: 'Bankrupt runs', unit: 'count' },
  },
  async fetch() {
    const source = await fetchText(FEED);
    const trials = /five episodes each/i.test(source) ? 5 : undefined;
    const [t] = tables(source);
    const head = t?.[0]?.map((c) => c.text);
    if (head?.[0] !== 'Model' || !/^Final assets/.test(head?.[1] ?? '')) throw new Error(`unexpected E-Commerce Bench header: ${head?.join(' | ')}`);
    const col = (re: RegExp) => head.findIndex((h) => re.test(h));
    const [iSd, iCalls, iTurns] = [col(/^std\b/i), col(/^Tool calls$/i), col(/^Turns$/i)];
    const rows: LeaderboardRow[] = [];
    let open: boolean | undefined;
    for (const r of t.slice(1)) {
      if (r[0]?.text === 'Open-weight') open = true;
      else if (r[0]?.text === 'Proprietary') open = false;
      if (r.length < 3) continue; // tier label rows span the table
      const assets = num(r[1]?.text);
      if (!r[0]?.text || assets === undefined) continue;
      // "Qwen3.8-Max-Preview" ranks apart from the released Qwen3.8-Max, so the preview stays visible
      const preview = /-Preview$/i.test(r[0].text);
      const [sd, calls, turns] = [iSd, iCalls, iTurns].map((i) => (i >= 0 ? num(r[i]?.text) : undefined));
      const metrics:Record<string,number> = {
        ...(sd !== undefined ? { std: sd / 100 } : {}),
        ...(calls !== undefined ? { toolCalls: calls, steps: calls } : {}),
        ...(turns !== undefined ? { turns } : {}),
      };
      for (const [prefix,key] of [['CSE','csePlus'],['BadSpend','badSpendPercent'],['Drawdown','drawdownOverPeak'],
        ['¥ per tool call','yuanPerToolCall'],['Controllable return','controllableReturnPp'],['AnchorRatio','anchorRatio'],
        ['Bankrupt runs','bankruptRuns']]) {
        const v=num(r[head.findIndex(h=>h.startsWith(prefix))]?.text);
        if(v!==undefined) metrics[key]=v;
      }
      rows.push({
        model: r[0].text.replace(/-Preview$/i, ''),
        score: assets / 100, open, trials,
        setting: preview ? 'preview' : undefined,
        metrics: Object.keys(metrics).length ? metrics : undefined,
      });
    }
    return rows;
  },
};
export default board;
