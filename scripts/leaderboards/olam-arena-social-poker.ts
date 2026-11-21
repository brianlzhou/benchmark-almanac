// Olam Labs' Multi-Agent Arena, Social Poker: no-limit hold'em tournaments with table talk, where people and
// anonymized models share a table. The rating is a Bradley-Terry fit over who finished ahead at each table, on an
// Elo scale where 1500 is average play, with 95% intervals from bootstraps over whole tables. The full board is the
// one /api/ path that robots.txt allows. It also gives big blinds won per hand and the tables played. Two behavior
// charts come from the evaluations page (olam-arena.ts): deliberate lies in table talk per 10,000 turns, graded from
// each agent's transcript, and the mean 1-to-10 rating other agents gave the model after a game. The human rows
// ("Humans (top 25%)", "Humans (average)") are baselines and are left out.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { OLAM_HARNESS, OLAM_PAGE, OLAM_TERMS, olamCharts } from './olam-arena.ts';

const FEED = 'https://olamlabs.ai/api/poker/leaderboard';

interface Entry {
  key: string;
  label: string;
  kind: string;
  elo: number;
  eloCi?: [number, number] | null;
  bbPerHand?: number | null;
  tableWinRate?: number | null;
  ranked?: boolean;
  tables?: number | null;
  netBb?: number | null;
  netChipsPerTable?: number | null;
}

const board: Leaderboard = {
  benchmark: 'olam-arena-social-poker',
  url: `${OLAM_PAGE}#poker`,
  feed: `${FEED} (the rating, intervals and table results) and ${OLAM_PAGE} (the lie rate and agent preference charts)`,
  terms: OLAM_TERMS,
  ...OLAM_HARNESS,
  stats: {
    lieRate: { name: 'Lie rate', unit: 'count', better: 'lower', note: 'Deliberate lies in table talk per 10,000 turns, graded from each agent’s transcript.' },
    agentPreference: { name: 'Agent preference', unit: 'score', better: 'higher', note: 'The mean 1 to 10 rating other agents gave the model after a game.' },
    bbPerHand: { name: 'Big blinds won per hand', unit: 'score', better: 'higher' },
    tableWinRate: { name: 'Table win rate', unit: '%', better: 'higher' },
    netBb: { name: 'Net big blinds won', unit: 'score', better: 'higher' },
    netChipsPerTable: { name: 'Net chips per table', unit: 'score', better: 'higher' },
    tables: { name: 'Tables played', unit: 'count' },
  },
  async fetch() {
    const data = await fetchJson<{ arena: Entry[] }>(FEED);
    const charts = await olamCharts();
    const head = charts.get('poker-elo');
    const extra = { lieRate: charts.get('poker-deception-strength'), agentPreference: charts.get('poker-agent-preference') };
    const rows: LeaderboardRow[] = [];
    for (const e of data.arena) {
      if (e.kind !== 'model' || e.ranked === false || !Number.isFinite(e.elo)) continue;
      const name = e.label.replace(/^[^:]+:\s*/, '');
      const metrics: Record<string, number> = {};
      if (typeof e.bbPerHand === 'number') metrics.bbPerHand = e.bbPerHand;
      if (typeof e.tableWinRate === 'number') metrics.tableWinRate = Math.round(e.tableWinRate * 1000) / 10;
      if (typeof e.tables === 'number') metrics.tables = e.tables;
      if (typeof e.netBb === 'number') metrics.netBb = e.netBb;
      if (typeof e.netChipsPerTable === 'number') metrics.netChipsPerTable = e.netChipsPerTable;
      for (const [k, chart] of Object.entries(extra)) {
        const bar = chart?.bars.find((b) => b.name === name);
        if (bar) metrics[k] = bar.value;
      }
      rows.push({
        model: name,
        score: e.elo,
        harness: 'Pi',
        date: head?.date,
        ...(e.eloCi ? { low: e.eloCi[0], high: e.eloCi[1] } : {}),
        metrics,
      });
    }
    if (rows.length < 15) throw new Error(`Olam Labs Social Poker: ${rows.length} models, expected at least 15`);
    return rows;
  },
};
export default board;
