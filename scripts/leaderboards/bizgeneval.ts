import type { Leaderboard, LeaderboardRow } from './types.ts';

const FEED = 'https://huggingface.co/spaces/microsoft/BizGenEval-Leaderboard/raw/main/commit_results.jsonl';

interface SplitPair {
  hard?: number;
  easy?: number;
}

interface RawRow {
  Model?: string;
  SourceType?: string;
  PaperLink?: string;
  AverageByDomain?: SplitPair;
  by_domain?: Record<string, SplitPair>;
  by_dimension?: Record<string, SplitPair>;
}

const DOMAIN_KEYS: [string, string, string][] = [
  ['Slides', 'slidesHard', 'slidesEasy'],
  ['Webpage', 'webpageHard', 'webpageEasy'],
  ['Poster', 'posterHard', 'posterEasy'],
  ['Chart', 'chartHard', 'chartEasy'],
  ['Scientific Figure', 'sciFigHard', 'sciFigEasy'],
];

const DIM_KEYS: [string, string, string][] = [
  ['Layout', 'layoutHard', 'layoutEasy'],
  ['Attribute', 'attributeHard', 'attributeEasy'],
  ['Text', 'textHard', 'textEasy'],
  ['Knowledge', 'knowledgeHard', 'knowledgeEasy'],
];

const board: Leaderboard = {
  benchmark: 'bizgeneval',
  url: 'https://huggingface.co/spaces/microsoft/BizGenEval-Leaderboard',
  feed: FEED,
  terms: 'Public Hugging Face Space leaderboard published by Microsoft Research under MIT.',
  aliases: {
    'Nano-Banana-Pro': 'gemini-3-pro-image-preview-nano-banana-pro',
    'Imagen-4': 'imagen-4-generate-001',
  },
  parts: {
    slidesHard: { name: 'Slides (hard)', group: 'Domain (hard)' },
    webpageHard: { name: 'Webpage (hard)', group: 'Domain (hard)' },
    posterHard: { name: 'Poster (hard)', group: 'Domain (hard)' },
    chartHard: { name: 'Chart (hard)', group: 'Domain (hard)' },
    sciFigHard: { name: 'Scientific figure (hard)', group: 'Domain (hard)' },
    layoutHard: { name: 'Layout (hard)', group: 'Dimension (hard)' },
    attributeHard: { name: 'Attribute (hard)', group: 'Dimension (hard)' },
    textHard: { name: 'Text (hard)', group: 'Dimension (hard)' },
    knowledgeHard: { name: 'Knowledge (hard)', group: 'Dimension (hard)' },
    easyOverall: { name: 'Easy overall', group: 'Easy split' },
    slidesEasy: { name: 'Slides (easy)', group: 'Easy split' },
    webpageEasy: { name: 'Webpage (easy)', group: 'Easy split' },
    posterEasy: { name: 'Poster (easy)', group: 'Easy split' },
    chartEasy: { name: 'Chart (easy)', group: 'Easy split' },
    sciFigEasy: { name: 'Scientific figure (easy)', group: 'Easy split' },
    layoutEasy: { name: 'Layout (easy)', group: 'Easy split' },
    attributeEasy: { name: 'Attribute (easy)', group: 'Easy split' },
    textEasy: { name: 'Text (easy)', group: 'Easy split' },
    knowledgeEasy: { name: 'Knowledge (easy)', group: 'Easy split' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const res = await fetch(FEED);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const rows: LeaderboardRow[] = [];
    for (const line of text.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const r = JSON.parse(trimmed) as RawRow;
      const model = r.Model?.trim();
      const score = r.AverageByDomain?.hard;
      if (!model || typeof score !== 'number' || !Number.isFinite(score)) continue;
      const metrics: Record<string, number> = {};
      if (typeof r.AverageByDomain?.easy === 'number') metrics.easyOverall = r.AverageByDomain.easy;
      for (const [src, hardKey, easyKey] of DOMAIN_KEYS) {
        const d = r.by_domain?.[src];
        if (typeof d?.hard === 'number') metrics[hardKey] = d.hard;
        if (typeof d?.easy === 'number') metrics[easyKey] = d.easy;
      }
      for (const [src, hardKey, easyKey] of DIM_KEYS) {
        const d = r.by_dimension?.[src];
        if (typeof d?.hard === 'number') metrics[hardKey] = d.hard;
        if (typeof d?.easy === 'number') metrics[easyKey] = d.easy;
      }
      const row: LeaderboardRow = { model, score, metrics };
      if (r.SourceType === 'open') row.open = true;
      else if (r.SourceType === 'closed') row.open = false;
      if (r.PaperLink && /^https?:\/\//.test(r.PaperLink.trim())) row.link = r.PaperLink.trim();
      rows.push(row);
    }
    return rows;
  },
};

export default board;
