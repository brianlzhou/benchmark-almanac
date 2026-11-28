// Open PL LLM Leaderboard by SpeakLeash, read from the Space's Gradio /config JSON dataframe.
import type { BoardPart, Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { text } from '../lib/html.ts';

const FEED = 'https://speakleash-open-pl-llm-leaderboard.hf.space/config';
const URL = 'https://huggingface.co/spaces/speakleash/open_pl_llm_leaderboard';

interface GradioComponent {
  id: number;
  type?: string;
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

const PART_SPECS: readonly [header: string, key: string, part: BoardPart][] = [
  ['Avg g', 'avgGenerative', { name: 'Generative average', group: 'Aggregates' }],
  ['Avg mc', 'avgMultipleChoice', { name: 'Multiple-choice average', group: 'Aggregates' }],
  ['Avg RAG', 'avgRag', { name: 'RAG average', group: 'Aggregates' }],
  ['polemo2-in_g', 'polemo2InG', { name: 'PolEmo2 in-domain (generative)', group: 'Tasks' }],
  ['polemo2-in_mc', 'polemo2InMc', { name: 'PolEmo2 in-domain (multiple choice)', group: 'Tasks' }],
  ['polemo2-out_g', 'polemo2OutG', { name: 'PolEmo2 out-of-domain (generative)', group: 'Tasks' }],
  ['polemo2-out_mc', 'polemo2OutMc', { name: 'PolEmo2 out-of-domain (multiple choice)', group: 'Tasks' }],
  ['8tags_mc', 'eightTagsMc', { name: '8Tags (multiple choice)', group: 'Tasks' }],
  ['8tags_g', 'eightTagsG', { name: '8Tags (generative)', group: 'Tasks' }],
  ['belebele_mc', 'belebeleMc', { name: 'Belebele (multiple choice)', group: 'Tasks' }],
  ['belebele_g', 'belebeleG', { name: 'Belebele (generative)', group: 'Tasks' }],
  ['dyk_mc', 'dykMc', { name: 'DYK (multiple choice)', group: 'Tasks' }],
  ['dyk_g', 'dykG', { name: 'DYK (generative)', group: 'Tasks' }],
  ['ppc_mc', 'ppcMc', { name: 'PPC (multiple choice)', group: 'Tasks' }],
  ['ppc_g', 'ppcG', { name: 'PPC (generative)', group: 'Tasks' }],
  ['psc_mc', 'pscMc', { name: 'PSC (multiple choice)', group: 'Tasks' }],
  ['psc_g', 'pscG', { name: 'PSC (generative)', group: 'Tasks' }],
  ['cbd_mc', 'cbdMc', { name: 'CBD (multiple choice)', group: 'Tasks' }],
  ['cbd_g', 'cbdG', { name: 'CBD (generative)', group: 'Tasks' }],
  ['klej_ner_mc', 'klejNerMc', { name: 'KLEJ NER (multiple choice)', group: 'Tasks' }],
  ['klej_ner_g', 'klejNerG', { name: 'KLEJ NER (generative)', group: 'Tasks' }],
  ['polqa_reranking_mc', 'polqaRerankingMc', { name: 'PolQA reranking (multiple choice)', group: 'Tasks' }],
  ['polqa_open_book_g', 'polqaOpenBookG', { name: 'PolQA open-book (generative)', group: 'Tasks' }],
  ['polqa_closed_book_g', 'polqaClosedBookG', { name: 'PolQA closed-book (generative)', group: 'Tasks' }],
  ['poquad_open_book', 'poquadOpenBook', { name: 'PoQuAD open-book', group: 'Tasks' }],
  ['eq_bench_first_turn', 'eqBenchFirstTurn', { name: 'Polish EQ-Bench first turn', group: 'Tasks' }],
  ['eq_bench', 'eqBench', { name: 'Polish EQ-Bench', group: 'Tasks' }],
  ['poleval2018_task3_test_10k', 'poleval2018Task3', { name: 'PolEval 2018 Task 3', group: 'Tasks' }],
  ['pes', 'pes', { name: 'Polish Medical Exam (PES)', group: 'Tasks' }],
];

const PARTS: Record<string, BoardPart> = Object.fromEntries(PART_SPECS.map(([, key, part]) => [key, part]));

function parseModelCell(raw: string): { model: string; link?: string; extraSetting?: string } {
  const href = raw.match(/href="([^"]+)"/)?.[1];
  const link = href && /^https?:\/\/\S+$/.test(href) ? href : undefined;
  const repoMatch = href?.match(/^https:\/\/huggingface\.co\/([^/\s]+\/[^/\s]+)$/);
  const anchorText = raw.match(/<a[^>]*>([\s\S]*?)<\/a>/i)?.[1];
  const afterAnchor = raw.match(/<\/a>\s*,\s*(.+)$/i)?.[1];
  const extraSetting = afterAnchor ? text(afterAnchor).trim() : undefined;

  let model = repoMatch ? repoMatch[1] : text(anchorText ?? raw).trim();
  if (!anchorText && model.includes(',')) {
    const idx = model.indexOf(',');
    model = model.slice(0, idx).trim();
  }
  return { model, link, extraSetting: extraSetting || undefined };
}

const board: Leaderboard = {
  benchmark: 'open-pl-llm-leaderboard',
  url: URL,
  feed: FEED,
  terms: 'Hugging Face allows crawling. SpeakLeash publishes the Open PL LLM Leaderboard table publicly in its Space.',
  headline: 'Average score across 26 Polish understanding, question answering, RAG, and professional exam tasks at 0-shot and 5-shot.',
  parts: PARTS,
  async fetch(): Promise<LeaderboardRow[]> {
    const cfg = await fetchJson<GradioConfig>(FEED);
    const df = cfg.components?.find(
      (c) =>
        Array.isArray(c.props?.headers) &&
        c.props.headers.includes('Average ⬆️') &&
        c.props.headers.includes('polemo2-in_g') &&
        !c.props.headers.includes('Available on the hub'),
    );
    const headers = df?.props?.headers ?? df?.props?.value?.headers;
    const data = df?.props?.value?.data;
    if (!headers || !Array.isArray(data)) {
      throw new Error('Open PL LLM Leaderboard dataframe not found in Space config');
    }

    const col = (name: string): number => headers.indexOf(name);
    const modelIdx = col('Model');
    const shotIdx = col('n_shot');
    const paramsIdx = col('#Params (B)');
    const avgIdx = col('Average ⬆️');
    if (modelIdx < 0 || avgIdx < 0) {
      throw new Error('Missing Model or Average column in Open PL LLM Leaderboard');
    }

    const partIndices = PART_SPECS.map(([h, key]) => [key, col(h)] as const).filter(([, idx]) => idx >= 0);

    const rows: LeaderboardRow[] = [];
    for (const r of data) {
      const score = r[avgIdx];
      const rawModel = r[modelIdx];
      if (typeof score !== 'number' || !Number.isFinite(score) || !rawModel) continue;

      const { model, link, extraSetting } = parseModelCell(String(rawModel));
      if (!model) continue;

      const shotRaw = shotIdx >= 0 && r[shotIdx] != null ? String(r[shotIdx]).trim() : '';
      const settingParts = [shotRaw ? `${shotRaw}-shot` : '', extraSetting ?? ''].filter(Boolean);
      const setting = settingParts.length ? settingParts.join(', ') : undefined;

      const pVal = paramsIdx >= 0 ? Number(r[paramsIdx]) : NaN;
      const params = Number.isFinite(pVal) && pVal > 0 ? pVal : undefined;

      const metrics: Record<string, number> = {};
      for (const [key, idx] of partIndices) {
        const val = r[idx];
        if (typeof val === 'number' && Number.isFinite(val)) {
          metrics[key] = val;
        }
      }

      rows.push({
        model,
        score,
        ...(setting ? { setting } : {}),
        ...(link ? { link } : {}),
        ...(params !== undefined ? { params } : {}),
        ...(Object.keys(metrics).length ? { metrics } : {}),
      });
    }

    if (rows.length < 300) {
      throw new Error(`Expected at least 300 rows on Open PL LLM Leaderboard, got ${rows.length}`);
    }
    return rows;
  },
};

export default board;
