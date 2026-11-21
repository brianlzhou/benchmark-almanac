// BotChat evaluates long model-to-model conversations. The board ranks them by the share of wins and ties.
// Its CSV also gives utterance length and Uni-Eval and Elo results for two conversation lengths.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const feed = "https://raw.githubusercontent.com/open-compass/BotChat/HEAD/docs/lb.csv";

const board: Leaderboard = {
  benchmark: "botchat",
  url: "https://open-compass.github.io/BotChat/",
  feed,
  terms: "The publisher links the board at https://open-compass.github.io/BotChat/. Separate results licensing remains unverified. The raw GitHub host and project site return 404 for robots.txt.",
  aliases: { "Internlm-20B-Chat": "internlm-chat-20b" },
  async fetch() {
    const entries = parseCsv((await fetchText(feed)).replace(/^\uFEFF/, ''));
    if (entries.length < 14) throw new Error('Missing BotChat models');
    return entries.map(r => {
      const keys = ['Win_Tie_Rate', 'Length', 'Uni_Eval_16', 'Uni_Eval_8', 'ELO_16', 'ELO_8'];
      if (!r.Model || keys.some(k => !r[k]?.trim() || !Number.isFinite(Number(r[k])))) throw new Error('Invalid BotChat row');
      return { model: r.Model, score: +r.Win_Tie_Rate, link: r.Link || undefined, metrics: {
        utteranceTokens: +r.Length, uniEval16: +r.Uni_Eval_16, uniEval8: +r.Uni_Eval_8, elo16: +r.ELO_16, elo8: +r.ELO_8 } };
    });
  },
};

export default board;
