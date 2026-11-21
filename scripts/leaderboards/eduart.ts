// EduArt tests art history across seven question formats. The official leaderboard ranks models by
// the "Mean of per-type primary metrics with equal weight per type." Read the published macro average
// and the per-format means, confidence intervals and counts for the default answer-only condition.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://github.com/llm-art/EduArt';
const feed = 'https://raw.githubusercontent.com/llm-art/EduArt/HEAD/answers/README.md';
const parts = { radio:'MCQ Radio', check:'MCQ Check', trueFalse:'True/False', positioning:'Positioning',
  closed:'Completion (Closed)', open:'Completion (Open)', errors:'Select Errors' };
const board: Leaderboard = {
  benchmark: 'eduart', url, feed, parts, terms: 'The authors specify MIT for code and non-commercial research terms for the Italian materials. ' + url + '#-data--license',
  aliases: { 'google_gemini-3.1-pro-preview':'gemini-3-1-pro','google_gemini-3.1-flash-lite-preview':'gemini-3-1-flash-lite',
    'google_gemini-3.5-flash':'gemini-3-5-flash','openai_gpt-5.5-2026-04-23':'gpt-5-5',
    'openai_gpt-5.4-mini-2026-03-17':'gpt-5-4-mini','openai_gpt-5.4-nano-2026-03-17':'gpt-5-4-nano',
    'harvard_us.anthropic.claude-opus-4-6-v1':'claude-opus-4-6','harvard_us.anthropic.claude-sonnet-4-6':'claude-sonnet-4-6',
    'harvard_us.anthropic.claude-haiku-4-5-20251001-v1:0':'claude-haiku-4-5','harvard_mistral.mistral-large-3-675b-instruct':'mistral-large-3' },
  async fetch() {
    const readme = await fetchText(feed);
    const summary = readme.split('## Leaderboard (Macro-Averaged Score)')[1]?.split('## Results by Question Type')[0];
    if (!summary?.includes('Macro Avg | MCQ Exact Match | N Evaluated')) throw Error('Missing overall columns');
    const rows = Array.from(summary.matchAll(/^\| \d+ \| \x60([^\x60]+)\x60 \| \*\*([\d.]+)%\*\* \| [\d.]+% \| (\d+) \|$/gm),
      ([,model,score,n]) => ({ model, score: Number(score), setting:'Answer only', metrics: { questions: Number(n) } as Record<string,number> }));
    for (const [key, name] of Object.entries(parts)) {
      const section = readme.split('**' + name + '** (Primary metric:')[1]?.split(/\n\n(?=\*\*|##)/)[0];
      if (!section?.includes('Model | Mean | 95% CI | N')) throw Error('Missing confidence intervals for ' + name);
      const values = new Map(Array.from(section.matchAll(/^\| \x60([^\x60]+)\x60 \| ([\d.]+)% \| \[([\d.]+)%, ([\d.]+)%\] \| (\d+) \|$/gm),
        ([,model,...cells]) => [model,cells.map(Number)]));
      for (const row of rows) {
        const info = values.get(row.model);
        if (!info) throw Error('Missing format score for ' + row.model);
        [row.metrics[key], row.metrics[key + 'Low'], row.metrics[key + 'High'], row.metrics[key + 'N']] = info;
      }
    }
    return checked(rows, 12);
  },
};
export default board;
