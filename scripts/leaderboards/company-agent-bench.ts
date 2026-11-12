// Company Agent Bench: Concept publishes its results as charts in the launch post, and each chart's aria-label
// lists every value. The cost chart gives each API model's overall accuracy and cost per question at low, medium
// and high reasoning effort. The products chart gives the agent products (Dots, Grok Bot, Claude Tag, Devin),
// which run at their default settings.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
const PAGE = 'https://concept.dev/blog/company-agent-bench';
const decode = (s: string) => s.replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"');
const board: Leaderboard = {
  benchmark: 'company-agent-bench',
  url: PAGE,
  feed: `${PAGE} (chart aria-labels: products, and accuracy against cost per question)`,
  terms: 'Concept publishes the results in its launch post; the almanac reads the chart labels, credits Concept and links the post.',
  aliases: {
    'Fable 5.2': 'claude-fable-5-2',
    'Opus 5.5': 'claude-opus-5-5',
    'Sonnet 5.5': 'claude-sonnet-5-5',
    'GPT-6 Astra': 'gpt-6-astra',
    'GPT-6.1 Sol': 'gpt-6-1-sol',
    'GPT-6.1 Terra': 'gpt-6-1-terra',
  },
  async fetch() {
    const html = await fetchText(PAGE);
    const labels = [...html.matchAll(/aria-label="([^"]+)"/g)].map((m) => decode(m[1]));
    const rows: LeaderboardRow[] = [];
    // "GPT-6 Astra: low 76.7% at $0.200 per question, medium 81.1% at $0.318 per question, high 80.8% at ..."
    const cost = labels.find((l) => l.startsWith('Accuracy across all') && l.includes('per question'));
    if (!cost) throw new Error('Concept cost chart label missing');
    for (const m of cost.matchAll(/([A-Z][\w. -]*?): ((?:(?:low|medium|high) [\d.]+% at \$[\d.]+ per question(?:, )?)+)/g)) {
      for (const r of m[2].matchAll(/(low|medium|high) ([\d.]+)% at \$([\d.]+) per question/g))
        rows.push({ model: m[1].trim(), score: Number(r[2]), setting: `${r[1]} reasoning effort`, harness: 'Concept Slack harness', cost: Number(r[3]) });
    }
    // "Company Agent Bench overall score, agent products: Dots 75.9%; Grok Bot 72.7%; ..."
    const products = labels.find((l) => l.startsWith('Company Agent Bench overall score, agent products:'));
    if (!products) throw new Error('Concept products chart label missing');
    for (const m of products.split(':').slice(1).join(':').matchAll(/([^;]+?) ([\d.]+)%/g))
      rows.push({ model: m[1].trim(), score: Number(m[2]), setting: 'default settings' });
    if (rows.length < 10) throw new Error(`Company Agent Bench has only ${rows.length} rows`);
    return rows;
  },
};
export default board;
