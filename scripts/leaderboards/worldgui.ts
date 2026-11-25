// WorldGUI: Overall success includes original and varied initial states. The paper publishes ten complete-system results.
// Unspecified model snapshots remain unlisted. Agent S2 retains its system name because this table does not identify its backbone.
// These are the paper's static results and will not refresh with new model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { num } from '../lib/html.ts';
import { paperTables, paperModel } from '../lib/boards/arxiv-nested-tables.ts';

const FEED = "https://arxiv.org/html/2502.08047";
const board: Leaderboard = {
  benchmark: "worldgui",
  static: 'paper',
  url: "https://github.com/showlab/WorldGUI",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  parts: {
    officeMeta: { name: 'Meta', group: 'Office' },
    officeAugmented: { name: 'Augmented', group: 'Office' },
    winUsageMeta: { name: 'Meta', group: 'Win. Usage' },
    winUsageAugmented: { name: 'Augmented', group: 'Win. Usage' },
    webMeta: { name: 'Meta', group: 'Web' },
    webAugmented: { name: 'Augmented', group: 'Web' },
    codingMeta: { name: 'Meta', group: 'Coding' },
    codingAugmented: { name: 'Augmented', group: 'Coding' },
    mediaMeta: { name: 'Meta', group: 'Media' },
    mediaAugmented: { name: 'Augmented', group: 'Media' },
    addStep: { name: 'Add-step', group: 'Augmentation type' },
    trimStep: { name: 'Trim-step', group: 'Augmentation type' },
    adjustStep: { name: 'Adjust-step', group: 'Augmentation type' },
    augmented: { name: 'All augmented tasks', group: 'Augmentation type' },
  },
  stats: {
    addStepSuccesses: { name: 'Add-step task successes', unit: 'count', better: 'higher' },
    trimStepSuccesses: { name: 'Trim-step task successes', unit: 'count', better: 'higher' },
    adjustStepSuccesses: { name: 'Adjust-step task successes', unit: 'count', better: 'higher' },
    augmentedSuccesses: { name: 'Augmented task successes', unit: 'count', better: 'higher' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const published = await paperTables(FEED);
    const t = published[3];
    if (!t?.[0]?.some(c => c.text === 'Overall')) throw new Error('WorldGUI results changed');
    const rows: LeaderboardRow[] = [];
    let world = false;
    for (const r of t) {
      if (r[0]?.text === 'WorldGUI-Agent (Ours)') { world = true; continue; }
      if (r.length !== 12 || /^Human/.test(r[0].text) || num(r[11].text) === undefined) continue;
      const raw = r[0].text;
      let model = raw;
      let harness: string | undefined;
      if (world) { harness = 'WorldGUI-Agent'; model = raw.replace(/^w\s*\/\s*/, ''); }
      else if (raw.includes(' w/ ')) { [harness, model] = raw.split(' w/ '); }
      model = paperModel(model);
      if (model === 'Gemini-2.0') model += ' (model unspecified)';
      if (model === 'Agent S2') model += ' (backbone unspecified)';
      if (model === 'UI-TARS-1.5') model += ' (size unspecified)';
      const metrics: Record<string, number> = {};
      for (let i = 0; i < 5; i++) {
        const group = t[0][i + 1].text;
        const prefix = group.toLowerCase().replace(/[^a-z]+(.)?/g, (_, c: string | undefined) => c?.toUpperCase() ?? '');
        for (const [j, name] of ['Meta', 'Augmented'].entries()) {
          metrics[prefix + name] = num(r[1 + 2 * i + j].text)!;
        }
      }
      if (world && model === 'GPT-5.1') {
        const breakdown = published.find(table => table[0]?.[0]?.text === 'Augmentation Type');
        for (const row of breakdown?.slice(1) ?? []) {
          const name = row[0].text;
          const key = name === 'Total' ? 'augmented' : name.toLowerCase().replace(/-(.)/g, (_, c: string) => c.toUpperCase());
          const value = num(row[2]?.text);
          if (value === undefined) continue;
          metrics[key] = value;
          metrics[key + 'Successes'] = num(row[3].text)!;
        }
      }
      rows.push({ model, harness, score: num(r[11].text)!, metrics });
    }
    if (rows.length !== 10) throw new Error('WorldGUI expected ten systems');
    return rows;
  },
};
export default board;
