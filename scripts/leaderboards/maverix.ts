// MAVERIX measures multiple-choice accuracy for each input modality, with difficulty, category, and open-ended judge breakdowns in Tables 3 to 10.
import type { BoardPart, Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://arxiv.org/html/2503.21699';

const MODEL_ALIAS: Record<string, string> = {
  egogpt: 'egogpt7b',
  ola: 'ola7b',
  qwen2omni: 'qwen25omni',
  deepseekvl2: 'deepseekvl2small',
};

function canon(name: string): string {
  const k = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  return MODEL_ALIAS[k] ?? k;
}

function firstNum(cell: string | undefined): number | undefined {
  const m = cell?.trim().match(/^\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : undefined;
}

const T10_PARTS: Array<[string, string, string]> = [
  ['Easy', 'easy', 'Difficulty'],
  ['Medium', 'medium', 'Difficulty'],
  ['Hard', 'hard', 'Difficulty'],
  ['Social', 'social', 'Agentic task'],
  ['Sentiment', 'sentiment', 'Agentic task'],
  ['Egocentric Agent', 'egocentricAgent', 'Agentic task'],
  ['Information Querying', 'informationQuerying', 'Agentic task'],
  ['Sports', 'sports', 'Agentic task'],
  ['Gaming', 'gaming', 'Agentic task'],
  ['Shopping', 'shopping', 'Agentic task'],
  ['Natural Sound', 'naturalSound', 'Audio type'],
  ['Speech', 'speech', 'Audio type'],
  ['Music', 'music', 'Audio type'],
  ['Artificial Sound', 'artificialSound', 'Audio type'],
  ['Mixed Sounds', 'mixedSounds', 'Audio type'],
  ['Humanities and Society', 'humanitiesAndSociety', 'Topic'],
  ['Geography and Travel', 'geographyAndTravel', 'Topic'],
  ['Technology and Gaming', 'technologyAndGaming', 'Topic'],
  ['Science and Knowledge', 'scienceAndKnowledge', 'Topic'],
  ['Movies, TV and Animations', 'moviesTvAndAnimations', 'Topic'],
  ['Arts and Performance', 'artsAndPerformance', 'Topic'],
  ['Pets and Animals', 'petsAndAnimals', 'Topic'],
  ['Business and Commerce', 'businessAndCommerce', 'Topic'],
  ['Life and Practical Skills', 'lifeAndPracticalSkills', 'Topic'],
  ['Sports and Adventure', 'sportsAndAdventure', 'Topic'],
  ['Social Trends and Reactions', 'socialTrendsAndReactions', 'Topic'],
  ['Vehicles and Transportation', 'vehiclesAndTransportation', 'Topic'],
  ['Low Quality and Extended Content', 'lowQualityAndExtendedContent', 'Topic'],
  ['Visual Reasoning', 'visualReasoning', 'Multimodal ability'],
  ['Emotional Inference', 'emotionalInference', 'Multimodal ability'],
  ['Situational Reasoning', 'situationalReasoning', 'Multimodal ability'],
  ['Causal Reasoning', 'causalReasoning', 'Multimodal ability'],
  ['Factual Recall', 'factualRecall', 'Multimodal ability'],
  ['Spatial Reasoning', 'spatialReasoning', 'Multimodal ability'],
  ['Relationship', 'relationship', 'Multimodal ability'],
  ['Temporal Distance', 'temporalDistance', 'Multimodal ability'],
];

const PARTS: Record<string, BoardPart> = Object.fromEntries(
  T10_PARTS.map(([label, key, group]) => [key, { name: label, group }]),
);

const T10_KEY = new Map(T10_PARTS.map(([label, key]) => [label.toLowerCase(), key]));

const board: Leaderboard = {
  benchmark: 'maverix', static: 'paper',
  url: 'https://arxiv.org/abs/2503.21699',
  feed: FEED,
  terms: PAPER_TERMS,
  aliases: {"Gemini 2.0-FL": "gemini-2-0-flash-lite", "NOVA-Lite": "amazon-nova-lite", "NOVA-Pro": "amazon-nova-pro", "Qwen 2.5 Omni": "qwen2-5-omni-7b", "Qwen-2-VL": "qwen2-vl-7b-instruct", "Qwen-2.5-VL": "qwen2-5-vl-7b", "InternVL2": "internvl2-8b", "LLaVA-OneVision": "llava-onevision-7b", "DeepSeekVL2-small": "deepseek-vl2-small", "Claude Sonnet 3.5": "claude-3-5-sonnet"},
  parts: PARTS,
  stats: {
    openEndedScore: { name: 'Open-ended judged score', unit: 'score', better: 'higher' },
    temporalConsistency: { name: 'Temporal consistency', unit: 'score', better: 'higher' },
    correctness: { name: 'Correctness', unit: 'score', better: 'higher' },
    context: { name: 'Context score', unit: 'score', better: 'higher' },
    detailOrientation: { name: 'Detail orientation', unit: 'score', better: 'higher' },
  },
  async fetch() {
    const tables = flatPaperTables(await paperHtml(FEED)).map(grid);
    const table = tables.find(t => t[1]?.includes('Best-Multi'));
    if (!table || table[1].slice(5, 12).join('|') !== 'A|S|V|Best-Uni|V+S|V+A|Best-Multi') throw new Error('Missing modality columns');

    const audioModels = new Set<string>();
    const rows: LeaderboardRow[] = [];
    const byKey = new Map<string, LeaderboardRow>();

    for (const cells of table.slice(2)) {
      if (cells[0] === 'Human') continue;
      const ck = canon(cells[0]);
      if (cells[1]?.includes('✓')) audioModels.add(ck);
      const pMatch = cells[2]?.match(/^(\d+(?:\.\d+)?)B$/i);
      const params = pMatch ? Number(pMatch[1]) : undefined;
      for (const col of [5, 6, 7, 9, 10]) {
        if (cells[col] === '–') continue;
        if (!/^\d+(?:\.\d+)?$/.test(cells[col])) throw new Error('Invalid MAVERIX accuracy');
        const setting = table[1][col];
        const row: LeaderboardRow = {
          model: cells[0], setting, score: Number(cells[col]),
          ...(params !== undefined ? { params } : {}),
        };
        rows.push(row);
        byKey.set(`${ck}|${setting}`, row);
      }
    }

    const addMetric = (model: string, setting: string, key: string, val: number | undefined, overwrite = true) => {
      if (val === undefined) return;
      const row = byKey.get(`${canon(model)}|${setting}`);
      if (!row) return;
      row.metrics ??= {};
      if (overwrite || row.metrics[key] === undefined) row.metrics[key] = val;
    };

    const audioSetting = (model: string, kind: 'audioSub' | 'multi') => {
      const hasAudio = audioModels.has(canon(model));
      return kind === 'audioSub' ? (hasAudio ? 'A' : 'S') : (hasAudio ? 'V+A' : 'V+S');
    };

    // Table 4: difficulty-wise MCQ accuracy for audio-enabled models (A, V, AV)
    const diffTable = tables.find(t => t[0]?.includes('Easy') && t[0]?.includes('Medium') && t[0]?.includes('Hard') && t[1]?.includes('AV'));
    if (diffTable) {
      const cols: Array<[number, string, string]> = [
        [1, 'A', 'easy'], [2, 'V', 'easy'], [3, 'V+A', 'easy'],
        [4, 'A', 'medium'], [5, 'V', 'medium'], [6, 'V+A', 'medium'],
        [7, 'A', 'hard'], [8, 'V', 'hard'], [9, 'V+A', 'hard'],
      ];
      for (const cells of diffTable.slice(2)) {
        if (cells[0] === 'Human') continue;
        for (const [col, setting, key] of cols) addMetric(cells[0], setting, key, firstNum(cells[col]));
      }
    }

    // Table 5a: taxonomy on AV
    const taxTable = tables.find(t => t[0]?.[0]?.startsWith('Taxonomy') && t[1]?.includes('Social'));
    if (taxTable) {
      const keys = ['social', 'egocentricAgent', 'sports', 'gaming'];
      for (const cells of taxTable.slice(2)) {
        if (cells[0] === 'Human') continue;
        keys.forEach((k, i) => addMetric(cells[0], 'V+A', k, firstNum(cells[i + 1])));
      }
    }

    // Table 5b: audio category on AV
    const audTable = tables.find(t => t[0]?.[0]?.startsWith('Audio Category') && t[1]?.includes('Natural'));
    if (audTable) {
      const keys = ['naturalSound', 'speech', 'music', 'artificialSound', 'mixedSounds'];
      for (const cells of audTable.slice(2)) {
        if (cells[0] === 'Human') continue;
        keys.forEach((k, i) => addMetric(cells[0], 'V+A', k, firstNum(cells[i + 1])));
      }
    }

    // Table 6: open-ended judged score per modality
    const oeTable = tables.find(t => t[0]?.includes('Judged Score') && t[1]?.includes('A/S'));
    if (oeTable) {
      for (const cells of oeTable.slice(2)) {
        if (cells[0] === 'Human') continue;
        addMetric(cells[0], audioSetting(cells[0], 'audioSub'), 'openEndedScore', firstNum(cells[2]));
        addMetric(cells[0], 'V', 'openEndedScore', firstNum(cells[3]));
        addMetric(cells[0], audioSetting(cells[0], 'multi'), 'openEndedScore', firstNum(cells[4]));
      }
    }

    // Table 8: Temporal Consistency, Correctness, and open-source vs proprietary grouping
    const tcTable = tables.find(t => t[0]?.includes('Temporal Consistency') && t[0]?.includes('Correctness'));
    const openByModel = new Map<string, boolean>();
    if (tcTable) {
      let open: boolean | undefined;
      for (const cells of tcTable.slice(2)) {
        if (cells[0] === 'Human') continue;
        if (cells.every(c => c === cells[0])) {
          if (/open-source/i.test(cells[0])) open = true;
          else if (/proprietary/i.test(cells[0])) open = false;
          continue;
        }
        if (open !== undefined) openByModel.set(canon(cells[0]), open);
        addMetric(cells[0], 'V', 'temporalConsistency', firstNum(cells[1]));
        addMetric(cells[0], audioSetting(cells[0], 'audioSub'), 'temporalConsistency', firstNum(cells[2]));
        addMetric(cells[0], audioSetting(cells[0], 'multi'), 'temporalConsistency', firstNum(cells[3]));
        addMetric(cells[0], 'V', 'correctness', firstNum(cells[4]));
        addMetric(cells[0], audioSetting(cells[0], 'audioSub'), 'correctness', firstNum(cells[5]));
        addMetric(cells[0], audioSetting(cells[0], 'multi'), 'correctness', firstNum(cells[6]));
      }
    }

    // Table 9: Context and Detail Orientation
    const ctxTable = tables.find(t => t[0]?.includes('Context') && t[0]?.includes('Detail Orientation'));
    if (ctxTable) {
      for (const cells of ctxTable.slice(2)) {
        if (cells[0] === 'Human' || cells.every(c => c === cells[0])) continue;
        addMetric(cells[0], 'V', 'context', firstNum(cells[1]));
        addMetric(cells[0], audioSetting(cells[0], 'audioSub'), 'context', firstNum(cells[2]));
        addMetric(cells[0], audioSetting(cells[0], 'multi'), 'context', firstNum(cells[3]));
        addMetric(cells[0], 'V', 'detailOrientation', firstNum(cells[4]));
        addMetric(cells[0], audioSetting(cells[0], 'audioSub'), 'detailOrientation', firstNum(cells[5]));
        addMetric(cells[0], audioSetting(cells[0], 'multi'), 'detailOrientation', firstNum(cells[6]));
      }
    }

    // Table 10: fine-grained category breakdown on Video + Audio/Subtitle
    const catTable = tables.find(t => t[0]?.includes('GPT-4o') && t.some(r => r[1] === 'Visual Reasoning'));
    if (catTable) {
      const models = catTable[0].slice(2);
      for (const cells of catTable.slice(1)) {
        const key = T10_KEY.get(cells[1]?.trim().toLowerCase() ?? '');
        if (!key) continue;
        models.forEach((m, i) => addMetric(m, audioSetting(m, 'multi'), key, firstNum(cells[i + 2]), false));
      }
    }

    for (const row of rows) {
      const open = openByModel.get(canon(row.model));
      if (open !== undefined) row.open = open;
    }

    if (rows.length < 63) throw new Error('Incomplete modality results');
    return rows;
  },
};
export default board;
