// BRFauna evaluates Brazilian Portuguese language models across three generative tasks:
// question answering on Pirá (Table 5), summarization on RecognaSumm (Table 1), and
// simplification on PorSimplesSent (Table 3). This importer reads the open-access JBCS 2025
// paper PDF, using Pirá QA F1 as the headline alongside generative quality metrics, parameter
// counts, and local inference runtimes across all nine models.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const FEED = 'https://journals-sol.sbc.org.br/index.php/jbcs/article/download/5814/3514';

type TaskRow = {
  model: string;
  params?: number;
  timeHours?: number;
  primary: number;
  meteor: number;
  bleu: number;
  rouge1: number;
  rouge2: number;
  rougeL: number;
  rougeLsum: number;
  bertPrec: number;
  bertRec: number;
  bertF1: number;
  gEval: number;
};

function parseTable(block: string): Map<string, TaskRow> {
  const lines = block.split('\n');
  const map = new Map<string, TaskRow>();
  const num = '(\\d+(?:\\.\\d+)?)';
  const opt = '(?:(\\d+(?:\\.\\d+)?)|[–-])';
  const re = new RegExp(
    `^\\s*([A-Za-zÀ-ÿ0-9-]+)\\s+\\d+\\s+${opt}\\s+${opt}\\s+${opt}\\s+${num}\\s+${num}\\s+${num}\\s+${num}\\s+${num}\\s+${num}\\s+${num}\\s+${num}\\s+${num}\\s+${num}\\s+${num}\\s*$`
  );

  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(re);
    if (!m) continue;
    const rawName = m[1].trim();
    const next = lines[i + 1] ?? '';
    const pm = next.match(/\((\d+(?:\.\d+)?)B\s+params\)/i);
    map.set(rawName, {
      model: rawName,
      params: pm ? Number(pm[1]) : undefined,
      timeHours: m[2] ? Number(m[2]) : undefined,
      primary: Number(m[5]),
      meteor: Number(m[6]),
      bleu: Number(m[7]),
      rouge1: Number(m[8]),
      rouge2: Number(m[9]),
      rougeL: Number(m[10]),
      rougeLsum: Number(m[11]),
      bertPrec: Number(m[12]),
      bertRec: Number(m[13]),
      bertF1: Number(m[14]),
      gEval: Number(m[15]),
    });
  }
  return map;
}

const board: Leaderboard = {
  benchmark: 'brfauna',
  static: 'paper',
  url: 'https://journals-sol.sbc.org.br/index.php/jbcs/article/view/5814',
  feed: FEED,
  terms: 'Open-access Journal of the Brazilian Computer Society PDF (CC BY 4.0). Scores remain credited to the BRFauna authors.',
  headline: 'Headline is Pirá question answering F1 score from Table 5, alongside RecognaSumm summarization (Table 1) and PorSimplesSent simplification (Table 3) metrics.',
  stats: {
    qaGEval: { name: 'Pirá QA G-Eval', unit: 'score', better: 'higher' },
    qaMeteor: { name: 'Pirá QA METEOR', unit: 'score', better: 'higher' },
    qaBleu: { name: 'Pirá QA BLEU', unit: 'score', better: 'higher' },
    qaRouge1: { name: 'Pirá QA ROUGE-1', unit: 'score', better: 'higher' },
    qaRouge2: { name: 'Pirá QA ROUGE-2', unit: 'score', better: 'higher' },
    qaRougeL: { name: 'Pirá QA ROUGE-L', unit: 'score', better: 'higher' },
    qaRougeLsum: { name: 'Pirá QA ROUGE-Lsum', unit: 'score', better: 'higher' },
    qaBertPrec: { name: 'Pirá QA BERTScore precision', unit: 'score', better: 'higher' },
    qaBertRec: { name: 'Pirá QA BERTScore recall', unit: 'score', better: 'higher' },
    qaBertF1: { name: 'Pirá QA BERTScore F1', unit: 'score', better: 'higher' },
    qaTimeHours: { name: 'Pirá QA inference time', unit: 'hours', better: 'lower' },
    summBlanc: { name: 'RecognaSumm BLANC', unit: 'score', better: 'higher' },
    summGEval: { name: 'RecognaSumm G-Eval', unit: 'score', better: 'higher' },
    summRougeL: { name: 'RecognaSumm ROUGE-L', unit: 'score', better: 'higher' },
    summBertF1: { name: 'RecognaSumm BERTScore F1', unit: 'score', better: 'higher' },
    summTimeHours: { name: 'RecognaSumm inference time', unit: 'hours', better: 'lower' },
    simpSari: { name: 'PorSimplesSent SARI', unit: 'score', better: 'higher' },
    simpGEval: { name: 'PorSimplesSent G-Eval', unit: 'score', better: 'higher' },
    simpRougeL: { name: 'PorSimplesSent ROUGE-L', unit: 'score', better: 'higher' },
    simpBertF1: { name: 'PorSimplesSent BERTScore F1', unit: 'score', better: 'higher' },
    simpTimeHours: { name: 'PorSimplesSent inference time', unit: 'hours', better: 'lower' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const text = await pdfText(FEED);
    const t1s = text.indexOf('Table 1. Computational');
    const t1e = text.indexOf('Table 2.', t1s);
    const t3s = text.indexOf('Table 3. Computational');
    const t3e = text.indexOf('Table 4.', t3s);
    const t5s = text.indexOf('Table 5. Computational');
    const t5e = text.indexOf('Table 6.', t5s);
    if (t1s < 0 || t1e < 0 || t3s < 0 || t3e < 0 || t5s < 0 || t5e < 0) {
      throw new Error('BRFauna Tables 1, 3, or 5 missing in JBCS PDF');
    }

    const summ = parseTable(text.slice(t1s, t1e));
    const simp = parseTable(text.slice(t3s, t3e));
    const qa = parseTable(text.slice(t5s, t5e));
    if (qa.size !== 9 || summ.size !== 9 || simp.size !== 9) {
      throw new Error(`BRFauna unexpected row counts: qa=${qa.size}, summ=${summ.size}, simp=${simp.size}`);
    }

    const rows: LeaderboardRow[] = [];
    for (const [raw, q] of qa) {
      const su = summ.get(raw);
      const si = simp.get(raw);
      const model =
        raw === 'GPT4o'
          ? 'GPT-4o (snapshot unspecified)'
          : raw === 'GPT4o-mini'
            ? 'GPT-4o-mini'
            : raw;

      const metrics: Record<string, number> = {
        qaGEval: q.gEval,
        qaMeteor: q.meteor,
        qaBleu: q.bleu,
        qaRouge1: q.rouge1,
        qaRouge2: q.rouge2,
        qaRougeL: q.rougeL,
        qaRougeLsum: q.rougeLsum,
        qaBertPrec: q.bertPrec,
        qaBertRec: q.bertRec,
        qaBertF1: q.bertF1,
      };
      if (q.timeHours !== undefined) metrics.qaTimeHours = q.timeHours;
      if (su) {
        metrics.summBlanc = su.primary;
        metrics.summGEval = su.gEval;
        metrics.summRougeL = su.rougeL;
        metrics.summBertF1 = su.bertF1;
        if (su.timeHours !== undefined) metrics.summTimeHours = su.timeHours;
      }
      if (si) {
        metrics.simpSari = si.primary;
        metrics.simpGEval = si.gEval;
        metrics.simpRougeL = si.rougeL;
        metrics.simpBertF1 = si.bertF1;
        if (si.timeHours !== undefined) metrics.simpTimeHours = si.timeHours;
      }

      rows.push({
        model,
        score: q.primary,
        ...(q.params !== undefined ? { params: q.params } : {}),
        metrics,
      });
    }

    if (rows.length !== 9 || rows.some((r) => !r.model || !Number.isFinite(r.score))) {
      throw new Error(`BRFauna invalid rows: ${rows.length}`);
    }
    return rows;
  },
};

export default board;
