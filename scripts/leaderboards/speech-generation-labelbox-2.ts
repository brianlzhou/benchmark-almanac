// Labelbox rates speech generators from human pairwise preferences. The headline is the Elo rating.
// Its embedded results include TrueSkill, preference shares and the breakdown of human ratings.
import type { Leaderboard } from './types.ts';
import { labelboxData } from './echochain-labelbox.ts';

const feed = "https://labelbox.com/leaderboards/speech-generation/";
interface Entry {label:string; elo_rating:number; average_rank:number; trueskill_rating:number; rank1_percentage:number; rank2_percentage:number; detailed_stats:Record<string,Record<string,number>>}

const board: Leaderboard = {
  benchmark: "speech-generation-labelbox-2",
  url: "https://labelbox.com/leaderboards/speech-generation/",
  feed,
  terms: "Labelbox links its terms of service and provides no separate leaderboard license. https://docs.labelbox.com/page/terms-of-service Robots.txt permits the leaderboard.",
  stats: {
    averageRank: { name: 'Average rank', unit: 'rating', better: 'lower' },
    trueSkill: { name: 'TrueSkill rating', unit: 'rating', better: 'higher' },
    rank1: { name: 'First-place share', unit: '%', better: 'higher' },
    rank2: { name: 'Second-place share', unit: '%', better: 'higher' },
    noise_Low: { name: 'Low-noise preference share', unit: '%', better: 'higher' },
    noise_High: { name: 'High-noise preference share', unit: '%', better: 'higher' },
    noise_None: { name: 'No-noise preference share', unit: '%', better: 'higher' },
    noise_Medium: { name: 'Medium-noise preference share', unit: '%', better: 'higher' },
    naturalness_Low: { name: 'Low naturalness preference share', unit: '%', better: 'higher' },
    naturalness_High: { name: 'High naturalness preference share', unit: '%', better: 'higher' },
    naturalness_Medium: { name: 'Medium naturalness preference share', unit: '%', better: 'higher' },
    prosody_accuracy_Low: { name: 'Low prosody accuracy preference share', unit: '%', better: 'higher' },
    prosody_accuracy_High: { name: 'High prosody accuracy preference share', unit: '%', better: 'higher' },
    prosody_accuracy_Medium: { name: 'Medium prosody accuracy preference share', unit: '%', better: 'higher' },
    context_awareness_Low: { name: 'Low context awareness preference share', unit: '%', better: 'higher' },
    context_awareness_High: { name: 'High context awareness preference share', unit: '%', better: 'higher' },
    context_awareness_Medium: { name: 'Medium context awareness preference share', unit: '%', better: 'higher' },
    pronunciation_accuracy_Low: { name: 'Low pronunciation accuracy preference share', unit: '%', better: 'higher' },
    pronunciation_accuracy_High: { name: 'High pronunciation accuracy preference share', unit: '%', better: 'higher' },
    pronunciation_accuracy_Medium: { name: 'Medium pronunciation accuracy preference share', unit: '%', better: 'higher' },
    word_deletion_errors_0: { name: 'Zero word deletion errors', unit: '%', better: 'higher' },
    word_deletion_errors_1: { name: 'One word deletion error', unit: '%', better: 'lower' },
    word_deletion_errors_2: { name: 'Two word deletion errors', unit: '%', better: 'lower' },
    word_deletion_errors_3: { name: 'Three word deletion errors', unit: '%', better: 'lower' },
    word_deletion_errors_4: { name: 'Four word deletion errors', unit: '%', better: 'lower' },
    word_deletion_errors_5: { name: 'Five word deletion errors', unit: '%', better: 'lower' },
    word_deletion_errors_6: { name: 'Six word deletion errors', unit: '%', better: 'lower' },
    word_deletion_errors_9: { name: 'Nine word deletion errors', unit: '%', better: 'lower' },
    word_deletion_errors_10: { name: 'Ten word deletion errors', unit: '%', better: 'lower' },
    word_deletion_errors_11: { name: 'Eleven word deletion errors', unit: '%', better: 'lower' },
    word_insertion_errors_0: { name: 'Zero word insertion errors', unit: '%', better: 'higher' },
    word_insertion_errors_1: { name: 'One word insertion error', unit: '%', better: 'lower' },
    word_insertion_errors_2: { name: 'Two word insertion errors', unit: '%', better: 'lower' },
    word_insertion_errors_3: { name: 'Three word insertion errors', unit: '%', better: 'lower' },
    word_insertion_errors_4: { name: 'Four word insertion errors', unit: '%', better: 'lower' },
    word_insertion_errors_5: { name: 'Five word insertion errors', unit: '%', better: 'lower' },
    word_insertion_errors_9: { name: 'Nine word insertion errors', unit: '%', better: 'lower' },
    word_insertion_errors_12: { name: 'Twelve word insertion errors', unit: '%', better: 'lower' },
    word_substitution_errors_0: { name: 'Zero word substitution errors', unit: '%', better: 'higher' },
    word_substitution_errors_1: { name: 'One word substitution error', unit: '%', better: 'lower' },
    word_substitution_errors_2: { name: 'Two word substitution errors', unit: '%', better: 'lower' },
    word_substitution_errors_3: { name: 'Three word substitution errors', unit: '%', better: 'lower' },
    word_substitution_errors_4: { name: 'Four word substitution errors', unit: '%', better: 'lower' },
    word_substitution_errors_5: { name: 'Five word substitution errors', unit: '%', better: 'lower' },
    word_substitution_errors_6: { name: 'Six word substitution errors', unit: '%', better: 'lower' },
    word_substitution_errors_8: { name: 'Eight word substitution errors', unit: '%', better: 'lower' },
    word_substitution_errors_9: { name: 'Nine word substitution errors', unit: '%', better: 'lower' },
  },
  async fetch() {
    const { info } = await labelboxData(feed,'speech-generation') as {info:Entry[]};
    if (info.length < 9) throw new Error('Missing Labelbox speech models');
    return info.map(r=>{
      if (!r.label || !Number.isFinite(r.elo_rating)) throw new Error('Missing Elo rating');
      const metrics:Record<string,number> = {averageRank:r.average_rank, trueSkill:r.trueskill_rating, rank1:r.rank1_percentage, rank2:r.rank2_percentage};
      for (const [dimension,ratings] of Object.entries(r.detailed_stats))
        for (const [label,share] of Object.entries(ratings)) {
          if (dimension.startsWith('word_')) {
            if (!/^\d+$/.test(label)) continue;
            const key = dimension + '_' + String(Number(label));
            if (key in board.stats!) metrics[key] = (metrics[key] ?? 0) + share;
          } else if (/^(Low|Medium|High|None)$/.test(label)) {
            metrics[dimension + '_' + label] = share;
          }
        }
      return {model:r.label,score:r.elo_rating,metrics};
    });
  },
};
export default board;
