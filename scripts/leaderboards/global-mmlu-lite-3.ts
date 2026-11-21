// Global MMLU Lite 3.0. Models answer 400 human-translated MMLU questions per language in 23 languages.
// Kaggle's leaderboard download supplies the Average score and the evaluation date.
import type { Leaderboard } from './types.ts';
import { kaggleFeed, kaggleRowsWithBounds, KAGGLE_TERMS } from './kaggle-game-arena.ts';

const owner = "cohere-labs";
const slug = "global-mmlu-lite";
const board: Leaderboard = {
  benchmark: "global-mmlu-lite-3",
  url: "https://www.kaggle.com/benchmarks/cohere-labs/global-mmlu-lite",
  feed: kaggleFeed(owner, slug),
  terms: KAGGLE_TERMS,
  parts: {"Chinese": {"name": "Chinese", "unit": "%"}, "Burmese": {"name": "Burmese", "unit": "%"}, "Arabic": {"name": "Arabic", "unit": "%"}, "German": {"name": "German", "unit": "%"}, "Italian": {"name": "Italian", "unit": "%"}, "Indonesian": {"name": "Indonesian", "unit": "%"}, "Spanish": {"name": "Spanish", "unit": "%"}, "Hindi": {"name": "Hindi", "unit": "%"}, "Yoruba": {"name": "Yoruba", "unit": "%"}, "Culturally Agnostic": {"name": "Culturally Agnostic", "unit": "%"}, "Japanese": {"name": "Japanese", "unit": "%"}, "Portuguese": {"name": "Portuguese", "unit": "%"}, "Culturally Sensitive": {"name": "Culturally Sensitive", "unit": "%"}, "Korean": {"name": "Korean", "unit": "%"}, "English": {"name": "English", "unit": "%"}, "Swahili": {"name": "Swahili", "unit": "%"}, "Bengali": {"name": "Bengali", "unit": "%"}, "French": {"name": "French", "unit": "%"}},
  aliases: {"Gemini 2.5 Flash": "gemini-2-5-flash-jun-2025"},
  async fetch() {
    const rows = await kaggleRowsWithBounds(owner, slug, "Average", 100, {"Chinese": {"task": "Chinese", "scale": 100, "interval": true}, "Burmese": {"task": "Burmese", "scale": 100, "interval": true}, "Arabic": {"task": "Arabic", "scale": 100, "interval": true}, "German": {"task": "German", "scale": 100, "interval": true}, "Italian": {"task": "Italian", "scale": 100, "interval": true}, "Indonesian": {"task": "Indonesian", "scale": 100, "interval": true}, "Spanish": {"task": "Spanish", "scale": 100, "interval": true}, "Hindi": {"task": "Hindi", "scale": 100, "interval": true}, "Yoruba": {"task": "Yoruba", "scale": 100, "interval": true}, "Culturally Agnostic": {"task": "Culturally Agnostic", "scale": 100, "interval": true}, "Japanese": {"task": "Japanese", "scale": 100, "interval": true}, "Portuguese": {"task": "Portuguese", "scale": 100, "interval": true}, "Culturally Sensitive": {"task": "Culturally Sensitive", "scale": 100, "interval": true}, "Korean": {"task": "Korean", "scale": 100, "interval": true}, "English": {"task": "English", "scale": 100, "interval": true}, "Swahili": {"task": "Swahili", "scale": 100, "interval": true}, "Bengali": {"task": "Bengali", "scale": 100, "interval": true}, "French": {"task": "French", "scale": 100, "interval": true}});
    if (rows.length < 45) throw new Error(`Global MMLU Lite 3.0: expected at least 45 scores, found ${rows.length}`);
    return rows;
  },
};
export default board;
