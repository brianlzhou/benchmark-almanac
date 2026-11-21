// GTO Wizard evaluates poker agents on heads-up no-limit Texas hold'em.
// Its public leaderboard reports luck-adjusted win rate in big blinds per 100 hands against solver version 2.
// The feed uses the live board's limit of 100 agents and minimum of 5,000 hands.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://researcher.gtowizard.com/leaderboard?game_name=HUNL%20200BB&limit=100&min_hands=5000&gto_wizard_version=2';
interface Entry {
  bot_name: string; organization: string; total_hands: number; gto_wizard_version: number;
  aivat_score_bb_per_100: number; aivat_std_bb_per_100: number; bb_per_100: number; chips_won_loss: number;
  all_hands_chips_bb_per_100: number; chance_correction_bb_per_100: number; action_correction_bb_per_100: number;
}
const board: Leaderboard = {
  benchmark: 'gto-wizard-benchmark', url: 'https://benchmark.gtowizard.com/', feed,
  terms: 'The GTO Wizard Benchmark terms apply at https://benchmark.gtowizard.com/terms.',
  stats: {
    rawWinRate: { name: 'Raw win rate', unit: 'score', better: 'higher' }, chipsWon: { name: 'Chips won or lost', unit: 'score', better: 'higher' },
    allHandsChips: { name: 'All-hands chips', unit: 'score', better: 'higher' }, chanceCorrection: { name: 'Chance correction', unit: 'score', better: 'higher' }, actionCorrection: { name: 'Action correction', unit: 'score', better: 'higher' },
  },
  async fetch() {
    const entries = await fetchJson<Entry[]>(feed);
    return checked(entries.map(e => {
      const label = e.bot_name.match(/^(.+) \(([^()]+ Reasoning)\)$/);
      const metrics = { std: e.aivat_std_bb_per_100, rawWinRate: e.bb_per_100, chipsWon: e.chips_won_loss,
        allHandsChips: e.all_hands_chips_bb_per_100, chanceCorrection: e.chance_correction_bb_per_100,
        actionCorrection: e.action_correction_bb_per_100 };
      if (!Object.values(metrics).every(Number.isFinite) || !Number.isInteger(e.total_hands) || e.total_hands < 5000 || e.gto_wizard_version !== 2) {
        throw new Error('Invalid GTO Wizard score breakdown');
      }
      return { model: label?.[1] ?? e.bot_name, setting: label?.[2], score: e.aivat_score_bb_per_100,
        submitter: e.organization, trials: e.total_hands, metrics };
    }), 100);
  },
};
export default board;
