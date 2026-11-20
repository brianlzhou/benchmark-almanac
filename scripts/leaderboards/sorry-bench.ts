// SORRY-Bench unsafe compliance rates: mean over the 44 published categories, matching the heatmap average. Convert fractions to percentages; lower is better.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter } from '../lib/html.ts';

const FEED = "https://sorry-bench.github.io/sorry_bench_files/heatmap.js";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "sorry-bench",
  parts: {
    '1: Personal Insult Words': { name: 'Personal insult words', group: 'Category' },
    '2: Social-group Insult Words': { name: 'Social-group insult words', group: 'Category' },
    '3: Threatening Words': { name: 'Threatening words', group: 'Category' },
    '4: Lewd and Obscene Words': { name: 'Lewd and obscene words', group: 'Category' },
    '5: Libelous Words': { name: 'Libelous words', group: 'Category' },
    '6: Self-Harm': { name: 'Self-harm', group: 'Category' },
    '7: Violent Crimes': { name: 'Violent crimes', group: 'Category' },
    '8: Harassment': { name: 'Harassment', group: 'Category' },
    '9: Sexual Crimes': { name: 'Sexual crimes', group: 'Category' },
    '10: Property Crimes': { name: 'Property crimes', group: 'Category' },
    '11: Public Order Crimes': { name: 'Public order crimes', group: 'Category' },
    '12: System Intrusion': { name: 'System intrusion', group: 'Category' },
    '13: Malware': { name: 'Malware', group: 'Category' },
    '14: Fraud': { name: 'Fraud', group: 'Category' },
    '15: Financial Crimes': { name: 'Financial crimes', group: 'Category' },
    '18: Illegal Crafting': { name: 'Illegal crafting', group: 'Category' },
    '19: Terrorism': { name: 'Terrorism', group: 'Category' },
    '20: Child-related Crimes': { name: 'Child-related crimes', group: 'Category' },
    '21: Animal-related Crimes': { name: 'Animal-related crimes', group: 'Category' },
    '22: Environmental Crimes': { name: 'Environmental crimes', group: 'Category' },
    '23: Evasion of Law': { name: 'Evasion of law', group: 'Category' },
    '24: Human Elimination': { name: 'Human elimination', group: 'Category' },
    '25: Advice on Adult Content': { name: 'Advice on adult content', group: 'Category' },
    '26: Sexual Explicit Content': { name: 'Sexual explicit content', group: 'Category' },
    '27: Non-sexual Explicit Content': { name: 'Non-sexual explicit content', group: 'Category' },
    '28: Fake News': { name: 'Fake news', group: 'Category' },
    '29: False Advertising': { name: 'False advertising', group: 'Category' },
    '30: Discrimination': { name: 'Discrimination', group: 'Category' },
    '31: Military Use': { name: 'Military use', group: 'Category' },
    '32: Political Belief': { name: 'Political belief', group: 'Category' },
    '33: Ethical Belief': { name: 'Ethical belief', group: 'Category' },
    '34: Religion': { name: 'Religion', group: 'Category' },
    '35: Social Stereotypes': { name: 'Social stereotypes', group: 'Category' },
    '36: Extremist Content': { name: 'Extremist content', group: 'Category' },
    '37: Conspiracy Theories': { name: 'Conspiracy theories', group: 'Category' },
    '38: False Common Knowledge': { name: 'False common knowledge', group: 'Category' },
    '39: Unhealthy Behaviors': { name: 'Unhealthy behaviors', group: 'Category' },
    '40: Medical Advice': { name: 'Medical advice', group: 'Category' },
    '41: Financial Advice': { name: 'Financial advice', group: 'Category' },
    '42: Legal Consulting Advice': { name: 'Legal consulting advice', group: 'Category' },
    '43: Governance Decision Advice': { name: 'Governance decision advice', group: 'Category' },
    '44: Machinery Operation Advice': { name: 'Machinery operation advice', group: 'Category' },
    '16: IP Infringement': { name: 'IP infringement', group: 'Category' },
    '17: PII Violations': { name: 'Personally identifiable information violations', group: 'Category' },
  },
  url: "https://sorry-bench.github.io/",
  feed: FEED,
  terms: "Public results published by the benchmark authors at sorry-bench.github.io; retain source attribution and follow the upstream terms.",
  aliases: {},
  
  async fetch() {
    const source = await fetchText(FEED);
    const clean = source.replace(/^\s*\/\/.*$/gm, '');
    const categories = jsonAfter<string[]>(clean.replace(/,\s*\]/g, ']'), 'const all_categories =');
    const out: LeaderboardRow[] = [];
    for (const m of clean.matchAll(/model:\s*"([^"]+)"\s*,\s*scores:\s*(\[[\d.,\s]+\])/g)) {
      const scores = JSON.parse(m[2]) as number[];
      if (scores.length !== categories.length) throw new Error(`SORRY-Bench category mismatch: ${m[1]}`);
      const metrics = Object.fromEntries(scores.map((score, i) => [categories[i], score * 100]));
      out.push({model: identity(m[1]), score: 100 * scores.reduce((a,b) => a+b,0) / scores.length, metrics});
    }
    if (!out.length) throw new Error('SORRY-Bench heatmap data missing');
    return out;
  },
};
export default board;
