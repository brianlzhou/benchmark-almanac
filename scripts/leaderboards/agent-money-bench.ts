// Agent Money Benchmark (BlockRunAI): evaluates frontier models on real-money spending tasks.
// Reads the live HTML tables on https://agentmoneybench.com, joining Table 0 (Wasted per $100,
// Scam incidence, Money errors) with Table 1 (Task success, Cost per task, Answer quality / 100).
import { fetchText } from '../lib/util.ts';
import type { Leaderboard, LeaderboardRow } from './types.ts';

const SITE = 'https://agentmoneybench.com';

const strip = (s: string) =>
  s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

const parseRows = (tableHtml: string): string[][] =>
  [...tableHtml.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map((m) =>
    [...m[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((c) => strip(c[1]))
  );

const num = (s: string | undefined): number | undefined => {
  if (!s) return undefined;
  const n = Number(s.replace(/[$,%]/g, '').trim());
  return Number.isFinite(n) ? n : undefined;
};

const board: Leaderboard = {
  benchmark: 'agent-money-bench',
  url: SITE,
  feed: SITE,
  terms: 'Public benchmark website published by BlockRunAI.',
  stats: {
    scamIncidence: { name: 'Scam incidence', unit: '%', better: 'lower', note: 'Rate at which the agent fell for spending or seller traps.' },
    moneyErrors: { name: 'Money errors', unit: '%', better: 'lower', note: 'Share of tasks with overpayments, double payments, or unapproved sellers.' },
    taskSuccess: { name: 'Task success', unit: '%', better: 'higher', note: 'Share of 76 real spending tasks completed successfully.' },
    answerQuality: { name: 'Answer quality', unit: 'score', better: 'higher', note: 'Rubric-graded answer quality out of 100.' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await fetchText(SITE);
    const tables = html.match(/<table[\s\S]*?<\/table>/gi) ?? [];
    const tMain = tables.find((t) => /Wasted per \$100/i.test(t));
    const tOut = tables.find((t) => /Task success/i.test(t) && /Answer quality/i.test(t));
    if (!tMain) throw new Error('Agent Money Bench: main summary table not found');

    const outMap = new Map<string, { success?: number; cost?: number; quality?: number }>();
    if (tOut) {
      for (const r of parseRows(tOut)) {
        if (r.length < 7 || !/^\d+$/.test(r[0])) continue;
        const model = r[1];
        outMap.set(model.toLowerCase(), {
          success: num(r[3]),
          cost: num(r[5]),
          quality: num(r[6]),
        });
      }
    }

    const rows: LeaderboardRow[] = [];
    for (const r of parseRows(tMain)) {
      if (r.length < 6 || !/^\d+$/.test(r[0])) continue;
      const model = r[1];
      const wasted = num(r[3]);
      if (!model || wasted === undefined) continue;
      const metrics: Record<string, number> = {};
      const scam = num(r[4]);
      if (scam !== undefined) metrics.scamIncidence = scam;
      const merr = num(r[5]);
      if (merr !== undefined) metrics.moneyErrors = merr;
      const extra = outMap.get(model.toLowerCase());
      if (extra?.success !== undefined) metrics.taskSuccess = extra.success;
      if (extra?.quality !== undefined) metrics.answerQuality = extra.quality;

      rows.push({
        model,
        score: wasted,
        ...(extra?.cost !== undefined ? { cost: extra.cost } : {}),
        ...(Object.keys(metrics).length ? { metrics } : {}),
      });
    }
    return rows;
  },
};

export default board;
