// PerMMLU tests Persian multiple-choice knowledge. MIZAN publishes accuracy and subject accuracies as fractions in its JSONL feed.
import type { Leaderboard } from './types.ts';
import { mizanRows, mizanAliases } from './mizan-persian-llm-leaderboard.ts';

const FEED = "https://huggingface.co/spaces/MCINext/mizan-llm-leaderboard/raw/main/leaderboard/boards_data/MMLU.jsonl";
const board: Leaderboard = {
  benchmark: "permmlu",
  url: "https://mcinext-mizan-llm-leaderboard.hf.space/",
  feed: FEED,
  terms: "MCINext lists no score reuse license on its leaderboard card. https://huggingface.co/spaces/MCINext/mizan-llm-leaderboard/blob/main/README.md The robots file allows this feed for the importer.",
  aliases: mizanAliases,
  parts: {"cinema_acc": "cinema acc", "emergency_number_acc": "emergency number acc", "foods_acc": "foods acc", "games_acc": "games acc", "herbal_drugs_acc": "herbal drugs acc", "places_acc": "places acc", "poetry_acc": "poetry acc", "politicians_acc": "politicians acc", "popular_people_acc": "popular people acc", "Government_law_acc": "Government law acc", "proverbs_acc": "proverbs acc", "religous_acc": "religous acc", "social_manners_acc": "social manners acc", "souvenirs_acc": "souvenirs acc", "sports_acc": "sports acc", "GPK_acc": "GPK acc", "SPK_acc": "SPK acc", "UPK_acc": "UPK acc"},
  async fetch() {
    return mizanRows(FEED, 'acc', {"cinema_acc": "cinema_acc", "emergency_number_acc": "emergency_number_acc", "foods_acc": "foods_acc", "games_acc": "games_acc", "herbal_drugs_acc": "herbal_drugs_acc", "places_acc": "places_acc", "poetry_acc": "poetry_acc", "politicians_acc": "politicians_acc", "popular_people_acc": "popular_people_acc", "Government_law_acc": "Government_law_acc", "proverbs_acc": "proverbs_acc", "religous_acc": "religous_acc", "social_manners_acc": "social_manners_acc", "souvenirs_acc": "souvenirs_acc", "sports_acc": "sports_acc", "GPK_acc": "GPK_acc", "SPK_acc": "SPK_acc", "UPK_acc": "UPK_acc"}, 100, 45);
  },
};
export default board;
