// AMLworld-Compact ranks models by the board's (Overall) score, expressed as a percentage.
// Kaggle publishes the model rows and their task results in its leaderboard download.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const owner = "natnitarach";
const slug = "amlworld-compact";
const board: Leaderboard = {
  benchmark: "amlworld-compact",
  url: "https://www.kaggle.com/benchmarks/natnitarach/amlworld-compact",
  feed: kaggleFeed(owner, slug),
  terms: KAGGLE_TERMS,
  parts: {
    "AMLworld-Compact LI-Small (targeted)": "AMLworld-Compact LI-Small (targeted)",
    "AMLworld-Compact LI-Small typology (targeted)": "AMLworld-Compact LI-Small typology (targeted)",
    "AMLworld-Compact HI-Small (targeted)": "AMLworld-Compact HI-Small (targeted)",
    "AMLworld-Compact HI-Small typology (targeted)": "AMLworld-Compact HI-Small typology (targeted)"
  },
  async fetch() {
    const rows = await kaggleRowsWithBounds(owner, slug, "(Overall)", 100, {
      "AMLworld-Compact LI-Small (targeted)": {
        "task": "AMLworld-Compact LI-Small (targeted)",
        "scale": 100,
        "interval": true
      },
      "AMLworld-Compact LI-Small typology (targeted)": {
        "task": "AMLworld-Compact LI-Small typology (targeted)",
        "scale": 100,
        "interval": true
      },
      "AMLworld-Compact HI-Small (targeted)": {
        "task": "AMLworld-Compact HI-Small (targeted)",
        "scale": 100,
        "interval": true
      },
      "AMLworld-Compact HI-Small typology (targeted)": {
        "task": "AMLworld-Compact HI-Small typology (targeted)",
        "scale": 100,
        "interval": true
      }
    });
    if (rows.length < 1) throw new Error(`Expected at least 1 ranked rows, found ${rows.length}`);
    for (const key of Object.keys(board.parts!)) {
      if (!rows.some(row => Number.isFinite(row.metrics?.[key]))) throw new Error(`Missing Kaggle column ${key}`);
    }
    return rows;
  },
};
export default board;
