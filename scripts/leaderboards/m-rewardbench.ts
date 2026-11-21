// M-RewardBench evaluates reward models on multilingual preference pairs. The
// public Google Sheet gives an average multilingual accuracy and one score for
// each language, so this importer keeps the average and language parts.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const PAGE = 'https://huggingface.co/spaces/CohereLabsCommunity/m-rewardbench';
const FEED = 'https://docs.google.com/spreadsheets/d/1qrD7plUdrBwAw7G6UeDVZAaV9ihxaNAcoiKwSaqotR4/gviz/tq?tqx=out:csv&sheet=gt';
const languageNames: Record<string, string> = { eng_Latn: 'English', arb_Arab: 'Arabic', tur_Latn: 'Turkish', rus_Cyrl: 'Russian', ces_Latn: 'Czech', pol_Latn: 'Polish', kor_Hang: 'Korean', zho_Hans: 'Chinese simplified', zho_Hant: 'Chinese traditional', fra_Latn: 'French', ell_Grek: 'Greek', deu_Latn: 'German', ron_Latn: 'Romanian', ita_Latn: 'Italian', nld_Latn: 'Dutch', pes_Arab: 'Persian', hin_Deva: 'Hindi', ukr_Cyrl: 'Ukrainian', por_Latn: 'Portuguese', ind_Latn: 'Indonesian', jpn_Jpan: 'Japanese', spa_Latn: 'Spanish', heb_Hebr: 'Hebrew', vie_Latn: 'Vietnamese' };

const board: Leaderboard = {
  benchmark: 'm-rewardbench', url: PAGE, feed: FEED,
  terms: 'The code is MIT licensed and the dataset is ODC-By. The leaderboard reads this public Google Sheet.',
  parts: Object.fromEntries(Object.entries(languageNames).map(([key, name]) => [key, { name, group: 'Language' }])),
  async fetch() {
    const rows: LeaderboardRow[] = parseCsv(await fetchText(FEED)).flatMap((row) => {
      const model = row.Model?.trim(); const average = Number(row.Avg_Multilingual);
      if (!model || !Number.isFinite(average)) return [];
      const metrics: Record<string, number> = {};
      for (const key of Object.keys(languageNames)) { const value = Number(row[key]); if (Number.isFinite(value)) metrics[key] = value * 100; }
      return [{ model, setting: row.Model_Type?.trim() || undefined, score: average * 100, metrics }];
    });
    if (rows.length < 15) throw new Error(`M-RewardBench: ${rows.length} models, expected at least 15`);
    return rows;
  },
};
export default board;
