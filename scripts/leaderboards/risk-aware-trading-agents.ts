// Risk-Aware Trading Agents (rta-bench-1, jackson-cmd): look-ahead-free US stock trading agent
// benchmark replaying financial news by exact publication minute. Reads assets/data/leaderboard.json,
// using the clean 2026 out-of-sample blind Sharpe ratio as headline score alongside 2020 and 2022
// historical period Sharpe parts and full portfolio return, drawdown, alpha, beta, and exposure stats.
import { fetchText } from '../lib/util.ts';
import type { Leaderboard, LeaderboardRow } from './types.ts';

const FEED = 'https://jackson-cmd.github.io/risk-aware-trading-agents/assets/data/leaderboard.json';

interface RtaBlind {
  sharpe?: number;
  total_return?: number;
  excess_vs_equal_weight?: number;
  excess_vs_spy?: number;
  max_drawdown?: number;
  alpha_annual?: number;
  beta?: number;
  turnover?: number;
  avg_exposure?: number;
  avg_holding_days?: number;
  round_trips?: number;
  n?: number;
  run_dates?: string[];
  after_cutoff?: { sharpe?: number; total_return?: number } | null;
}

interface RtaEntry {
  model: string;
  open_weights?: boolean;
  blind?: RtaBlind;
}

interface RtaPeriod {
  clean?: RtaEntry[];
  may_remember?: RtaEntry[];
}

interface RtaFeed {
  periods: Record<string, RtaPeriod>;
}

const pct = (v: number | undefined): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) ? +(v * 100).toFixed(2) : undefined;

const round3 = (v: number | undefined): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) ? +v.toFixed(3) : undefined;

const board: Leaderboard = {
  benchmark: 'risk-aware-trading-agents',
  url: 'https://jackson-cmd.github.io/risk-aware-trading-agents/',
  feed: FEED,
  terms: 'Public research benchmark website and JSON feed published by jackson-cmd.',
  parts: {
    sharpe2020: { name: '2020 Regime (Sharpe)', unit: 'score', better: 'higher' },
    sharpe2022: { name: '2022 Regime (Sharpe)', unit: 'score', better: 'higher' },
  },
  stats: {
    afterCutoffSharpe: { name: 'Post-cutoff Sharpe', unit: 'score', better: 'higher', note: 'Sharpe ratio restricted strictly to trading days after each model knowledge cutoff.' },
    totalReturnPct: { name: 'Total return', unit: '%', better: 'higher' },
    excessVsEqPct: { name: 'Excess vs equal weight', unit: '%', better: 'higher', note: 'Return minus the equal-weight universe baseline.' },
    excessVsSpyPct: { name: 'Excess vs SPY', unit: '%', better: 'higher', note: 'Return minus SPY buy and hold.' },
    maxDrawdownPct: { name: 'Max drawdown', unit: '%', better: 'higher', note: 'Worst peak-to-trough percentage drawdown (closer to zero is better).' },
    alphaAnnualPct: { name: 'Annualized alpha', unit: '%', better: 'higher' },
    beta: { name: 'Market beta', unit: 'score' },
    turnover: { name: 'Portfolio turnover', unit: 'score', better: 'lower' },
    avgExposurePct: { name: 'Average exposure', unit: '%' },
    avgHoldingDays: { name: 'Average holding days', unit: 'score' },
    roundTrips: { name: 'Round-trip trades', unit: 'count' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const data = JSON.parse(await fetchText(FEED)) as RtaFeed;
    const p2026 = data.periods?.['2026']?.clean ?? [];
    const mapPeriod = (pk: string) => {
      const m = new Map<string, number>();
      const p = data.periods?.[pk];
      for (const e of [...(p?.clean ?? []), ...(p?.may_remember ?? [])]) {
        if (e.model && typeof e.blind?.sharpe === 'number' && Number.isFinite(e.blind.sharpe)) {
          m.set(e.model, +e.blind.sharpe.toFixed(3));
        }
      }
      return m;
    };
    const s2020 = mapPeriod('2020');
    const s2022 = mapPeriod('2022');

    const rows: LeaderboardRow[] = [];
    for (const e of p2026) {
      const b = e.blind;
      if (!e.model || !b || typeof b.sharpe !== 'number' || !Number.isFinite(b.sharpe)) continue;
      const metrics: Record<string, number> = {};
      const v20 = s2020.get(e.model);
      if (v20 !== undefined) metrics.sharpe2020 = v20;
      const v22 = s2022.get(e.model);
      if (v22 !== undefined) metrics.sharpe2022 = v22;
      const ac = round3(b.after_cutoff?.sharpe);
      if (ac !== undefined) metrics.afterCutoffSharpe = ac;
      const tr = pct(b.total_return);
      if (tr !== undefined) metrics.totalReturnPct = tr;
      const eq = pct(b.excess_vs_equal_weight);
      if (eq !== undefined) metrics.excessVsEqPct = eq;
      const spy = pct(b.excess_vs_spy);
      if (spy !== undefined) metrics.excessVsSpyPct = spy;
      const mdd = pct(b.max_drawdown);
      if (mdd !== undefined) metrics.maxDrawdownPct = mdd;
      const alp = pct(b.alpha_annual);
      if (alp !== undefined) metrics.alphaAnnualPct = alp;
      const beta = round3(b.beta);
      if (beta !== undefined) metrics.beta = beta;
      const turn = round3(b.turnover);
      if (turn !== undefined) metrics.turnover = turn;
      const exp = pct(b.avg_exposure);
      if (exp !== undefined) metrics.avgExposurePct = exp;
      if (typeof b.avg_holding_days === 'number' && Number.isFinite(b.avg_holding_days)) {
        metrics.avgHoldingDays = +b.avg_holding_days.toFixed(1);
      }
      if (typeof b.round_trips === 'number' && Number.isFinite(b.round_trips)) {
        metrics.roundTrips = b.round_trips;
      }

      const dates = (b.run_dates ?? []).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();
      const date = dates.at(-1);

      rows.push({
        model: e.model.trim(),
        score: +b.sharpe.toFixed(3),
        setting: 'blind, 2026',
        ...(typeof e.open_weights === 'boolean' ? { open: e.open_weights } : {}),
        ...(typeof b.n === 'number' && b.n >= 1 ? { trials: b.n } : {}),
        ...(date ? { date } : {}),
        ...(Object.keys(metrics).length ? { metrics } : {}),
      });
    }
    return rows;
  },
};

export default board;
