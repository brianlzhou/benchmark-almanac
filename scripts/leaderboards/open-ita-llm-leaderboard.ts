// Open Ita LLM Leaderboard by MII-LLM, read from the Space's Gradio /config JSON dataframe.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { text } from '../lib/html.ts';

const FEED = 'https://mii-llm-open-ita-llm-leaderboard.hf.space/config';
const URL = 'https://huggingface.co/spaces/mii-llm/open_ita_llm_leaderboard';

interface GradioComponent {
  id: number;
  props?: {
    headers?: string[];
    value?: {
      headers?: string[];
      data?: (string | number | boolean | null)[][];
    };
  };
}

interface GradioConfig {
  components: GradioComponent[];
}

const board: Leaderboard = {
  benchmark: 'open-ita-llm-leaderboard',
  url: URL,
  feed: FEED,
  terms: 'Hugging Face allows crawling. The MII-LLM community publishes the Open Ita LLM Leaderboard publicly in its Space.',
  headline: 'Average score across Italian MMLU, ARC, and HellaSwag benchmarks.',
  parts: {
    mmluIt: 'MMLU IT',
    arcIt: 'ARC IT',
    hellaswagIt: 'HellaSwag IT',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const cfg = await fetchJson<GradioConfig>(FEED);
    const df = cfg.components?.find(
      (c) =>
        Array.isArray(c.props?.headers) &&
        c.props.headers.includes('Average ⬆️') &&
        c.props.headers.includes('MMLU_IT') &&
        c.props.headers.includes('Precision'),
    );
    const headers = df?.props?.headers ?? df?.props?.value?.headers;
    const data = df?.props?.value?.data;
    if (!headers || !Array.isArray(data)) {
      throw new Error('Open Ita LLM Leaderboard dataframe not found in Space config');
    }

    const col = (name: string): number => headers.indexOf(name);
    const modelIdx = col('Model');
    const avgIdx = col('Average ⬆️');
    const mmluIdx = col('MMLU_IT');
    const arcIdx = col('ARC_IT');
    const hellaIdx = col('HELLASWAG_IT');
    const precIdx = col('Precision');
    const licIdx = col('Hub License');
    const paramsIdx = col('#Params (B)');

    if (modelIdx < 0 || avgIdx < 0) {
      throw new Error('Missing Model or Average column in Open Ita LLM Leaderboard');
    }

    const rows: LeaderboardRow[] = [];
    for (const r of data) {
      const score = r[avgIdx];
      const rawModel = r[modelIdx];
      if (typeof score !== 'number' || !Number.isFinite(score) || !rawModel) continue;

      const htmlCell = String(rawModel);
      const href = htmlCell.match(/href="([^"]+)"/)?.[1];
      const link = href && /^https?:\/\/\S+$/.test(href) ? href : undefined;
      const model = text(htmlCell).trim();
      if (!model) continue;

      const precRaw = precIdx >= 0 && r[precIdx] != null ? String(r[precIdx]).trim() : '';
      const setting = precRaw && precRaw !== '?' ? precRaw : undefined;

      const licRaw = licIdx >= 0 && r[licIdx] != null ? String(r[licIdx]).trim() : '';
      const license = licRaw && licRaw !== '?' ? licRaw : undefined;

      const pVal = paramsIdx >= 0 ? Number(r[paramsIdx]) : NaN;
      const params = Number.isFinite(pVal) && pVal > 0 ? pVal : undefined;

      const metrics: Record<string, number> = {};
      if (mmluIdx >= 0 && typeof r[mmluIdx] === 'number' && Number.isFinite(r[mmluIdx])) metrics.mmluIt = r[mmluIdx] as number;
      if (arcIdx >= 0 && typeof r[arcIdx] === 'number' && Number.isFinite(r[arcIdx])) metrics.arcIt = r[arcIdx] as number;
      if (hellaIdx >= 0 && typeof r[hellaIdx] === 'number' && Number.isFinite(r[hellaIdx])) metrics.hellaswagIt = r[hellaIdx] as number;

      rows.push({
        model,
        score,
        ...(setting ? { setting } : {}),
        ...(link ? { link } : {}),
        ...(license ? { license } : {}),
        ...(params !== undefined ? { params } : {}),
        ...(Object.keys(metrics).length ? { metrics } : {}),
      });
    }

    if (rows.length < 150) {
      throw new Error(`Expected at least 150 rows on Open Ita LLM Leaderboard, got ${rows.length}`);
    }
    return rows;
  },
};

export default board;
