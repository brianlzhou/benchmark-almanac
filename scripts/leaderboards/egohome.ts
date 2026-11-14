// EgoHome (Perceptron): models annotate 137 egocentric household-chore clips with subtasks, hand actions, hand
// captions and hand boxes. The board is "Table 3" of the Hugging Face dataset card, read from the card's raw
// README: one row per system and setting ("GPT-6 Astra, 4 fps frames"), with four scores from 0 to 1 and the
// subtask cost per video-hour. The card has no overall score. Its Figure 3 plots the subtask score against cost,
// so the subtask score is the headline here and the other three are metrics. Argus (Pantheon) is an agent system
// that runs a named model, so its rows keep the model and name Argus as the harness.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const CARD = 'https://huggingface.co/datasets/PerceptronAI/EgoHome';
const FEED = `${CARD}/raw/main/README.md`;

/** A table cell as a number: "**0.798**" -> 0.798, "≈ $15" -> 15, "—" or "n/r" -> undefined. */
function num(cell: string): number | undefined {
  const m = cell.replace(/\*\*/g, '').replace(/[≈$,\s]/g, '').match(/^\d+(\.\d+)?$/);
  return m ? Number(m[0]) : undefined;
}

/** "Name, setting" into model, setting and harness. */
function system(label: string): Pick<LeaderboardRow, 'model' | 'setting' | 'harness'> {
  const argus = label.match(/^Argus \(Pantheon\),\s*(?:(.+?):\s*)?(.+)$/);
  if (argus) return { model: argus[2].trim(), harness: 'Argus (Pantheon)', setting: argus[1]?.trim() };
  const i = label.indexOf(', ');
  if (i < 0) return { model: label.trim() };
  // "4 fps (default)" reads as "4 fps, default", so a chart label has one pair of parentheses
  return { model: label.slice(0, i).trim(), setting: label.slice(i + 2).trim().replace(/\s*\((default|option)\)$/, ', $1') };
}

const board: Leaderboard = {
  benchmark: 'egohome',
  url: `${CARD}#egohome-results`,
  feed: `${FEED} (results table, Subtask column)`,
  terms: 'The dataset card is CC BY-NC 4.0, with a grant that lets anyone use EgoHome to evaluate models and publish results.',
  chart: {
    title: 'Subtask score against subtask cost per video-hour',
    x: { key: 'costPerHour', label: 'Subtask cost per video-hour', unit: '$', better: 'lower', log: true },
    y: { key: 'score', label: 'Subtask score', better: 'higher' },
    note: 'The card plots each system’s subtask score against what one hour of video costs to annotate.',
  },
  async fetch() {
    const md = await fetchText(FEED);
    const lines = md.split('\n');
    const head = lines.findIndex((l) => /^\|\s*System\s*\|\s*Subtask/.test(l));
    if (head < 0) throw new Error('EgoHome card has no results table');
    const cols = lines[head].split('|').slice(1, -1).map((c) => c.trim());
    const col = (re: RegExp) => cols.findIndex((c) => re.test(c));
    const at = { sub: col(/^Subtask ↑/), act: col(/^Hand action/), cap: col(/^Hand caption/), box: col(/^Hand box/), cost: col(/\$ \/ video-hour/) };
    if (Object.values(at).some((i) => i < 0)) throw new Error(`EgoHome table columns changed: ${cols.join(' | ')}`);
    const out: LeaderboardRow[] = [];
    for (const line of lines.slice(head + 2)) {
      if (!line.startsWith('|')) break;
      const cells = line.split('|').slice(1, -1).map((c) => c.trim());
      const score = num(cells[at.sub]);
      if (score === undefined) continue;
      const metrics: Record<string, number> = {};
      for (const [k, i] of [['handAction', at.act], ['handCaption', at.cap], ['handBox', at.box], ['costPerHour', at.cost]] as const) {
        const v = num(cells[i]);
        if (v !== undefined) metrics[k] = v;
      }
      out.push({ ...system(cells[0].replace(/\*\*/g, '')), score, date: '2026-11-04', metrics });
    }
    if (out.length < 8) throw new Error(`EgoHome table has ${out.length} rows`);
    return out;
  },
};
export default board;
