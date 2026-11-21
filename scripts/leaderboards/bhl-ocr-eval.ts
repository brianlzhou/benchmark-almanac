// BHL OCR evaluates scans from the Biodiversity Heritage Library. The official Space embeds each reading-lane character error rate as a fraction.
// Scores and confidence intervals here use the catalogue unit of percent.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter } from '../lib/html.ts';

const FEED = "https://huggingface.co/spaces/finebooks/bhl-ocr-leaderboard/resolve/main/index.html";

interface Result {name: string; repo: string | null; eligible: boolean; params: number | null; cer_read: number; ci: number[]; lang: Record<string,number>; cer_dip: number; recall: number; overx: number; loop: number; furn: number; n: number; err: number; content_cer: number | null; sparse_cer: number | null}

const board: Leaderboard = {
  benchmark: "bhl-ocr-eval",
  url: "https://huggingface.co/spaces/finebooks/bhl-ocr-leaderboard",
  feed: FEED,
  terms: "The repository lists MIT for code and CC BY 3.0 for reference transcriptions. https://github.com/finebooks/bhl-ocr-eval",
  async fetch() {
    const data = jsonAfter<Result[]>(await fetchText(FEED),'const DATA=');
    if (data.length < 26) throw new Error('Incomplete BHL OCR table');
    this.parts = {content_cer: 'Content CER', sparse_cer: 'Sparse CER'};
    return data.filter(r => r.eligible).map((r): LeaderboardRow => {
      if (!r.name || !Number.isFinite(r.cer_read) || r.ci.length !== 2 || !r.ci.every(Number.isFinite)) throw new Error('Invalid BHL OCR score');
      const metrics: Record<string,number> = {pages: r.n, errors: r.err};
      for (const k of ['cer_dip','recall','overx','loop','furn','content_cer','sparse_cer'] as const) {
        if (!(k in r)) throw new Error('Missing BHL OCR field ' + k);
        if (r[k] != null) metrics[k] = 100*r[k];
      }
      for (const [lang,cer] of Object.entries(r.lang)) {
        metrics[lang] = 100*cer;
        this.parts![lang] = {name: lang, group: 'Language'};
      }
      return {model: r.name, score: r.cer_read*100, low: r.ci[0]*100, high: r.ci[1]*100, params: r.params ?? undefined, link: r.repo ? 'https://huggingface.co/'+r.repo : undefined, metrics};
    });
  },
};
export default board;
