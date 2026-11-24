// ScreenSpot-Pro (GUI grounding on professional software). The makers' grounding leaderboard at
// gui-agent.github.io/grounding-leaderboard/ loads results/screenspot_pro.json: per entry a description,
// link and accuracy (0 to 1) by application, by group and overall. The board ranks by results.overall.avg,
// which × 100 is the score. Many entries are grounding systems or zoom-in pipelines rather than plain
// models, and those stay unmatched unless the registry has them.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://gui-agent.github.io/grounding-leaderboard/results/screenspot_pro.json';

interface Entry {
  description?: string;
  link?: string;
  results?: { application?: Record<string, Record<string, number>>; overall?: Record<string, number>; group?: Record<string, Record<string, number>> };
}

const APPS: Record<string, string> = {
  android_studio: 'Android Studio',
  autocad: 'AutoCAD',
  blender: 'Blender',
  davinci: 'DaVinci',
  eviews: 'EViews',
  excel: 'Excel',
  fruitloops: 'FruitLoops',
  illustrator: 'Illustrator',
  inventor: 'Inventor',
  linux_common: 'Linux common',
  macos_common: 'macOS common',
  matlab: 'MATLAB',
  origin: 'Origin',
  photoshop: 'Photoshop',
  powerpoint: 'PowerPoint',
  premiere: 'Premiere',
  pycharm: 'PyCharm',
  quartus: 'Quartus',
  solidworks: 'SolidWorks',
  stata: 'Stata',
  unreal_engine: 'Unreal Engine',
  vivado: 'Vivado',
  vmware: 'VMware',
  vscode: 'VS Code',
  windows_common: 'Windows common',
  word: 'Word',
};

const DOMAINS: Record<string, string> = {
  Creative: 'Creative',
  CAD: 'CAD',
  Scientific: 'Scientific',
  Office: 'Office',
  OS: 'OS',
  Dev: 'Development and programming',
};

const board: Leaderboard = {
  benchmark: 'screenspot-pro',
  parts: {
    icon: { name: 'Icon', group: 'Category' },
    text: { name: 'Text', group: 'Category' },
    ...Object.fromEntries(Object.entries(DOMAINS).map(([k, name]) => [k, { name, group: 'Domain' }])),
    ...Object.fromEntries(
      Object.entries(DOMAINS).flatMap(([k, name]) => [
        [`Domain:${k}:icon`, { name: `${name} (icon)`, group: 'Domain' }],
        [`Domain:${k}:text`, { name: `${name} (text)`, group: 'Domain' }],
      ]),
    ),
    ...Object.fromEntries(
      Object.entries(APPS).flatMap(([k, name]) => [
        [`Application:${k}:avg`, { name, group: 'Application' }],
        [`Application:${k}:icon`, { name: `${name} (icon)`, group: 'Application' }],
        [`Application:${k}:text`, { name: `${name} (text)`, group: 'Application' }],
      ]),
    ),
  },
  harnesses: 'system',
  url: 'https://gui-agent.github.io/grounding-leaderboard/',
  feed: `${FEED} (results.overall.avg)`,
  terms: 'Static JSON on the grounding leaderboard GitHub Pages site; the gui-agent/grounding-leaderboard repository is Apache-2.0.',
  aliases: {},
  async fetch() {
    const data = await fetchJson<Record<string, Entry>>(FEED);
    const rows: LeaderboardRow[] = [];
    for (const [name, e] of Object.entries(data)) {
      const avg = e.results?.overall?.avg;
      if (typeof avg !== 'number') continue;
      const metrics: Record<string, number> = {};
      for (const [key, value] of Object.entries(e.results?.overall ?? {})) {
        if (key !== 'avg' && Number.isFinite(value)) metrics[key] = value * 100;
      }
      for (const [group, values] of Object.entries(e.results?.group ?? {})) {
        if (Number.isFinite(values.avg)) metrics[group] = values.avg * 100;
      }
      for (const [kind, groups] of [['Application', e.results?.application], ['Domain', e.results?.group]] as const) {
        for (const [subName, values] of Object.entries(groups ?? {})) {
          for (const [split, value] of Object.entries(values)) {
            if (!Number.isFinite(value) || !['avg', 'icon', 'text'].includes(split)) continue;
            if (kind === 'Domain' && split === 'avg') continue;
            const key = [kind, subName, split].join(':');
            metrics[key] = value * 100;
          }
        }
      }
      const link = e.link?.trim();
      const entry: Partial<LeaderboardRow> = {
        link: link && /^https?:\/\//.test(link) ? link : undefined,
      };

      if (e.description === 'Proprietary') { entry.license = e.description; entry.open = false; }
      const cascade = name.match(/^GroundCascade \(([^+]+) \+ ([^)]+)\)$/);
      if (cascade) {
        entry.model = cascade[1].trim();
        entry.harness = 'GroundCascade';
        entry.setting = `helper: ${cascade[2].trim()}`;
        entry.models = [entry.model, cascade[2].trim()];
      } else if (name === 'KV-Ground-8B + Qwen3.5-27B Consistency Router') {
        entry.model = 'KV-Ground-8B-BaseGuiOwl1.5-0315';
        entry.harness = 'Consistency Router';
        entry.models = [entry.model, 'Qwen3.5-27B-AWQ-4bit'];

      } else if (name === 'AdaZoom-GUI-4B (cond. zoom-in, refine w/ Qwen3.5-397B)' && e.description?.includes('Qwen3.5-397B-A17B')) {
        entry.model = 'AdaZoom-GUI-4B';
        entry.harness = 'AdaZoom-GUI';
        entry.models = [entry.model, 'Qwen3.5-397B-A17B'];
      }
      // "GPT5-high (resized)": the reasoning effort as a suffix
      const gpt5 = name.match(/^GPT5-(\w+) \((resized)\)$/);
      if (gpt5) rows.push({ ...entry, model: 'GPT-5', setting: `${gpt5[1]}; resized screenshots`, score: avg * 100, metrics });
      // Preserve the undated baseline without assigning it to a particular GPT-4o snapshot.
      else rows.push({ model: name === 'GPT-4o' ? 'GPT-4o (snapshot unspecified)' : name.trim(), score: avg * 100, metrics, ...entry });
    }
    if (!rows.length) throw new Error('no entries in screenspot_pro.json');
    return rows;
  },
};
export default board;
