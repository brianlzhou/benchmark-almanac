// Persian NLG ranks multilingual generation with an aggregate of translation, summarization and question generation measures. Read MIZAN’s JSONL and display points on its 100-point scale.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { mizanAliases } from './mizan-persian-llm-leaderboard.ts';

const FEED = "https://huggingface.co/spaces/MCINext/mizan-llm-leaderboard/raw/main/leaderboard/boards_data/persian_nlg.jsonl";
const board: Leaderboard = {
  benchmark: "persian-nlg",
  url: "https://mcinext-mizan-llm-leaderboard.hf.space/",
  feed: FEED,
  terms: "MCINext lists no score reuse license on its leaderboard card. https://huggingface.co/spaces/MCINext/mizan-llm-leaderboard/blob/main/README.md The robots file allows this feed for the importer.",
  aliases: { ...mizanAliases, 'Llama-3.2-3B-Instruct': 'llama-3-2-3b', 'Llama-3.2-1B-Instruct': 'llama-3-2-1b' },
  parts: {
  "question-generation_PersianQA_rougeL_precision": {
    "name": "rougeL precision",
    "group": "question-generation PersianQA",
    "unit": "score"
  },
  "question-generation_PersianQA_rougeL_recall": {
    "name": "rougeL recall",
    "group": "question-generation PersianQA",
    "unit": "score"
  },
  "question-generation_PersianQA_rougeL_f1_score": {
    "name": "rougeL f1 score",
    "group": "question-generation PersianQA",
    "unit": "score"
  },
  "translation-en2fa_en2fa_bleu": {
    "name": "bleu",
    "group": "translation-en2fa en2fa",
    "unit": "score"
  },
  "translation-en2fa_en2fa_epoque_bleu": {
    "name": "epoque bleu",
    "group": "translation-en2fa en2fa",
    "unit": "score"
  },
  "translation-en2fa_en2fa_mizan_bleu": {
    "name": "mizan bleu",
    "group": "translation-en2fa en2fa",
    "unit": "score"
  },
  "translation-en2fa_en2fa_quran_bleu": {
    "name": "quran bleu",
    "group": "translation-en2fa en2fa",
    "unit": "score"
  },
  "translation-en2fa_en2fa_sahife_bleu": {
    "name": "sahife bleu",
    "group": "translation-en2fa en2fa",
    "unit": "score"
  },
  "translation-en2fa_en2fa_nahj_bleu": {
    "name": "nahj bleu",
    "group": "translation-en2fa en2fa",
    "unit": "score"
  },
  "translation-en2fa_en2fa_tep_bleu": {
    "name": "tep bleu",
    "group": "translation-en2fa en2fa",
    "unit": "score"
  },
  "summarization_SamSUM-fa_rougeL_precision": {
    "name": "rougeL precision",
    "group": "summarization SamSUM-fa",
    "unit": "score"
  },
  "summarization_SamSUM-fa_rougeL_recall": {
    "name": "rougeL recall",
    "group": "summarization SamSUM-fa",
    "unit": "score"
  },
  "summarization_SamSUM-fa_rougeL_f1_score": {
    "name": "rougeL f1 score",
    "group": "summarization SamSUM-fa",
    "unit": "score"
  },
  "translation-fa2en_fa2en_bleu": {
    "name": "bleu",
    "group": "translation-fa2en fa2en",
    "unit": "score"
  },
  "translation-fa2en_fa2en_tep_bleu": {
    "name": "tep bleu",
    "group": "translation-fa2en fa2en",
    "unit": "score"
  },
  "translation-fa2en_fa2en_mizan_bleu": {
    "name": "mizan bleu",
    "group": "translation-fa2en fa2en",
    "unit": "score"
  },
  "translation-fa2en_fa2en_quran_bleu": {
    "name": "quran bleu",
    "group": "translation-fa2en fa2en",
    "unit": "score"
  },
  "translation-fa2en_fa2en_epoque_bleu": {
    "name": "epoque bleu",
    "group": "translation-fa2en fa2en",
    "unit": "score"
  },
  "translation-fa2en_fa2en_nahj_bleu": {
    "name": "nahj bleu",
    "group": "translation-fa2en fa2en",
    "unit": "score"
  },
  "translation-fa2en_fa2en_sahife_bleu": {
    "name": "sahife bleu",
    "group": "translation-fa2en fa2en",
    "unit": "score"
  },
  "translation-ar2fa_ar2fa_bleu": {
    "name": "bleu",
    "group": "translation-ar2fa ar2fa",
    "unit": "score"
  },
  "translation-ar2fa_ar2fa_sahife_bleu": {
    "name": "sahife bleu",
    "group": "translation-ar2fa ar2fa",
    "unit": "score"
  },
  "translation-ar2fa_ar2fa_nahj_bleu": {
    "name": "nahj bleu",
    "group": "translation-ar2fa ar2fa",
    "unit": "score"
  },
  "translation-ar2fa_ar2fa_quran_bleu": {
    "name": "quran bleu",
    "group": "translation-ar2fa ar2fa",
    "unit": "score"
  },
  "summarization_PnSummary_rougeL_precision": {
    "name": "rougeL precision",
    "group": "summarization PnSummary",
    "unit": "score"
  },
  "summarization_PnSummary_rougeL_recall": {
    "name": "rougeL recall",
    "group": "summarization PnSummary",
    "unit": "score"
  },
  "summarization_PnSummary_rougeL_f1_score": {
    "name": "rougeL f1 score",
    "group": "summarization PnSummary",
    "unit": "score"
  },
  "translation-fa2ar_fa2ar_bleu": {
    "name": "bleu",
    "group": "translation-fa2ar fa2ar",
    "unit": "score"
  },
  "translation-fa2ar_fa2ar_nahj_bleu": {
    "name": "nahj bleu",
    "group": "translation-fa2ar fa2ar",
    "unit": "score"
  },
  "translation-fa2ar_fa2ar_sahife_bleu": {
    "name": "sahife bleu",
    "group": "translation-fa2ar fa2ar",
    "unit": "score"
  },
  "translation-fa2ar_fa2ar_quran_bleu": {
    "name": "quran bleu",
    "group": "translation-fa2ar fa2ar",
    "unit": "score"
  }
},
  async fetch() {
    const rows = (await fetchText(FEED)).trim().split(/\r?\n/).map(line => {
      const r = JSON.parse(line);
      const model = r['Model Name'];
      const metrics = Object.fromEntries(Object.entries(r).filter(([,v]) => typeof v === 'object' && v !== null)
        .flatMap(([,v]) => Object.entries(v as Record<string, number>).map(([key,value]) => [key, 100 * value])));
      if (!model || !Number.isFinite(r.nlg_score) || Object.keys(board.parts!).some(key => !Number.isFinite(metrics[key]))) throw new Error('Incomplete Persian NLG result');
      const effort = model.match(/-(low|minimal)-reasoning$/)?.[1];
      return { model, score: 100 * r.nlg_score, metrics, open: r.source_type === 'Open-Source',
        params: Number(r.parameters_count) / 1e9 || undefined, setting: effort ? effort + ' reasoning' : r.thinking_method.includes('✔') ? 'Thinking' : 'Non-thinking' };
    });
    if (rows.length < 45) throw new Error('Missing Persian NLG configurations');
    return rows;
  },
};
export default board;
