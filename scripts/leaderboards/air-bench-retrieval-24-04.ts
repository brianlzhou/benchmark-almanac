// AIR-Bench 24.04 evaluates information retrieval models and retriever-reranker pipelines across 28 QA and
// long-document datasets in English and Chinese. The official Hugging Face Space publishes QA nDCG@10 and
// Long-Doc Recall@10 separately without a single cross-task average.
// This importer reads the live Gradio API endpoints for AIR-Bench_24.04, using QA nDCG@10 Average as the
// headline score (for entries scored across all 13 QA domains) and attaching all 13 QA domain parts plus
// matching Long-Doc Recall@10 overall and 15 Long-Doc domain parts in metrics. Pipelines with a reranker
// record both models in `models` so the combined score is treated as a multi-model system.
import type { BoardPart, Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { text } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const SPACE = 'https://air-bench-leaderboard.hf.space';
const VERSION = 'AIR-Bench_24.04';

const QA_PARTS: Record<string, BoardPart> = {
  wiki_en: { name: 'Wikipedia (EN)', group: 'QA (nDCG@10)', unit: 'score' },
  wiki_zh: { name: 'Wikipedia (ZH)', group: 'QA (nDCG@10)', unit: 'score' },
  web_en: { name: 'Web (EN)', group: 'QA (nDCG@10)', unit: 'score' },
  web_zh: { name: 'Web (ZH)', group: 'QA (nDCG@10)', unit: 'score' },
  healthcare_en: { name: 'Healthcare (EN)', group: 'QA (nDCG@10)', unit: 'score' },
  healthcare_zh: { name: 'Healthcare (ZH)', group: 'QA (nDCG@10)', unit: 'score' },
  law_en: { name: 'Law (EN)', group: 'QA (nDCG@10)', unit: 'score' },
  arxiv_en: { name: 'arXiv (EN)', group: 'QA (nDCG@10)', unit: 'score' },
  news_en: { name: 'News (EN)', group: 'QA (nDCG@10)', unit: 'score' },
  news_zh: { name: 'News (ZH)', group: 'QA (nDCG@10)', unit: 'score' },
  finance_en: { name: 'Finance (EN)', group: 'QA (nDCG@10)', unit: 'score' },
  finance_zh: { name: 'Finance (ZH)', group: 'QA (nDCG@10)', unit: 'score' },
  msmarco_en: { name: 'MS MARCO (EN)', group: 'QA (nDCG@10)', unit: 'score' },
};

const DOC_PARTS: Record<string, BoardPart> = {
  longDoc: { name: 'Long-Doc overall', group: 'Long-Doc (Recall@10)', unit: 'score' },
  healthcare_en_pubmed_100k_200k_1: { name: 'PubMed 100k to 200k (1)', group: 'Long-Doc (Recall@10)', unit: 'score' },
  healthcare_en_pubmed_100k_200k_2: { name: 'PubMed 100k to 200k (2)', group: 'Long-Doc (Recall@10)', unit: 'score' },
  healthcare_en_pubmed_100k_200k_3: { name: 'PubMed 100k to 200k (3)', group: 'Long-Doc (Recall@10)', unit: 'score' },
  healthcare_en_pubmed_40k_50k_5_merged: { name: 'PubMed 40k to 50k merged', group: 'Long-Doc (Recall@10)', unit: 'score' },
  healthcare_en_pubmed_30k_40k_10_merged: { name: 'PubMed 30k to 40k merged', group: 'Long-Doc (Recall@10)', unit: 'score' },
  arxiv_en_gpt3: { name: 'arXiv GPT-3', group: 'Long-Doc (Recall@10)', unit: 'score' },
  arxiv_en_llama2: { name: 'arXiv Llama 2', group: 'Long-Doc (Recall@10)', unit: 'score' },
  arxiv_en_gemini: { name: 'arXiv Gemini', group: 'Long-Doc (Recall@10)', unit: 'score' },
  arxiv_en_llm_survey: { name: 'arXiv LLM Survey', group: 'Long-Doc (Recall@10)', unit: 'score' },
  law_en_lex_files_300k_400k: { name: 'LexFiles 300k to 400k', group: 'Long-Doc (Recall@10)', unit: 'score' },
  law_en_lex_files_400k_500k: { name: 'LexFiles 400k to 500k', group: 'Long-Doc (Recall@10)', unit: 'score' },
  law_en_lex_files_500k_600k: { name: 'LexFiles 500k to 600k', group: 'Long-Doc (Recall@10)', unit: 'score' },
  law_en_lex_files_600k_700k: { name: 'LexFiles 600k to 700k', group: 'Long-Doc (Recall@10)', unit: 'score' },
  book_en_origin_of_species_darwin: { name: 'Origin of Species', group: 'Long-Doc (Recall@10)', unit: 'score' },
  book_en_a_brief_history_of_time_stephen_hawking: { name: 'A Brief History of Time', group: 'Long-Doc (Recall@10)', unit: 'score' },
};

interface GradioTable {
  headers: string[];
  data: (string | number | null)[][];
}

async function readGradioTable(fn: string): Promise<GradioTable> {
  const init = JSON.parse(
    await fetchText(`${SPACE}/call/${fn}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ data: [VERSION] }),
    }),
  ) as { event_id?: string };
  if (!init.event_id) throw new Error(`AIR-Bench ${fn}: missing event_id`);
  const sse = await fetchText(`${SPACE}/call/${fn}/${init.event_id}`);
  const dataLine = sse.split('\n').find((line) => line.startsWith('data: '));
  if (!dataLine) throw new Error(`AIR-Bench ${fn}: missing SSE data`);
  const parsed = JSON.parse(dataLine.slice(6).replace(/\bNaN\b/g, 'null')) as { value?: GradioTable }[];
  const table = parsed[0]?.value;
  if (!table || !Array.isArray(table.headers) || !Array.isArray(table.data)) throw new Error(`AIR-Bench ${fn}: malformed table`);
  return table;
}

const cleanCell = (v: unknown) => text(String(v ?? '')).trim();

const board: Leaderboard = {
  benchmark: 'air-bench-retrieval-24-04',
  url: 'https://huggingface.co/spaces/AIR-Bench/leaderboard',
  feed: `${SPACE}/call/update_qa_df_ret_rerank`,
  terms: 'AIR-Bench publishes its official retrieval leaderboard and evaluation results under the MIT license at https://github.com/AIR-Bench/AIR-Bench and https://huggingface.co/spaces/AIR-Bench/leaderboard.',
  headline: 'The board reports QA nDCG@10 and Long-Doc Recall@10 separately, so this is the QA nDCG@10 average across all 13 QA domains.',
  parts: { ...QA_PARTS, ...DOC_PARTS },
  async fetch(): Promise<LeaderboardRow[]> {
    const qa = await readGradioTable('update_qa_df_ret_rerank');
    await new Promise((resolve) => setTimeout(resolve, 1050));
    const doc = await readGradioTable('update_doc_df_ret_rerank');

    if (qa.headers[1] !== 'Retrieval Method' || qa.headers[2] !== 'Reranking Model' || !qa.headers[3]?.startsWith('Average')) {
      throw new Error('AIR-Bench 24.04 QA table headers changed');
    }
    if (doc.headers[1] !== 'Retrieval Method' || doc.headers[2] !== 'Reranking Model' || !doc.headers[3]?.startsWith('Average')) {
      throw new Error('AIR-Bench 24.04 Long-Doc table headers changed');
    }

    // Index best Long-Doc Recall@10 row per (retriever, reranker) pair
    const docByKey = new Map<string, Record<string, number>>();
    for (const r of doc.data) {
      const avg = r[3];
      if (typeof avg !== 'number' || !Number.isFinite(avg) || avg < 0) continue;
      const key = `${cleanCell(r[1])}\t${cleanCell(r[2])}`;
      if (docByKey.has(key)) continue;
      const m: Record<string, number> = { longDoc: avg };
      for (let i = 4; i < doc.headers.length; i++) {
        const col = doc.headers[i];
        const val = r[i];
        if (col in DOC_PARTS && typeof val === 'number' && Number.isFinite(val)) m[col] = val;
      }
      docByKey.set(key, m);
    }

    const seen = new Set<string>();
    const rows: LeaderboardRow[] = [];
    for (const r of qa.data) {
      const avg = r[3];
      if (typeof avg !== 'number' || !Number.isFinite(avg) || avg < 0) continue;
      const retriever = cleanCell(r[1]);
      const reranker = cleanCell(r[2]);
      if (!retriever) continue;
      const key = `${retriever}\t${reranker}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const metrics: Record<string, number> = {};
      for (let i = 4; i < qa.headers.length; i++) {
        const col = qa.headers[i];
        const val = r[i];
        if (col in QA_PARTS && typeof val === 'number' && Number.isFinite(val)) metrics[col] = val;
      }
      const docMetrics = docByKey.get(key);
      if (docMetrics) Object.assign(metrics, docMetrics);

      const hasReranker = Boolean(reranker && reranker !== 'NoReranker');
      rows.push({
        model: retriever,
        ...(hasReranker ? { setting: `with ${reranker}`, models: [retriever, reranker] } : {}),
        score: avg,
        metrics,
      });
    }

    return checked(rows, 50);
  },
};

export default board;
