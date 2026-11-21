// HalluScoring tests hallucination detection in Arabic. Task 1 ranks AUC-ROC and Task 2 ranks a joint score.
// The headline is the first ranking, test AUC-ROC across unseen questions. Tables 3 and 4 give test and dev results.
// Table 5 also identifies the Task 2 results for Anhnamxtanh's ALLaM system.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://aclanthology.org/2026.arabicnlp-sharedtasks.137.pdf';
const systems: Record<string,string> = {
  REGLAT:'MARBERTv2', AyahVerse:'CAMeLBERT', NAMAA:'CAMeLBERT', Anhnamxtanh:'ALLaM-7B', Scalar_NITK:'Qwen2.5-3B-Instruct',
  Baseline_ARBERT:'ARBERT', Baseline_MARBERT:'MARBERT', Baseline_CAMeLBERT:'CAMeLBERT', Baseline_mBERT:'mBERT',
};
const board: Leaderboard = {
  benchmark:'halluscoring-2026', url:feed, feed, terms:'ACL Anthology terms apply. https://aclanthology.org/faq/copyright/',
  parts: { questions:'Generalize Across Questions', models:'Generalize Across Models', islamicAssisted:'Islamic Knowledge: Assisted',
    islamicBlind:'Islamic Knowledge: Blind', generalAssisted:'General Culture: Assisted', generalBlind:'General Culture: Blind' },
  async fetch() {
    const pdf = await pdfText(feed);
    const blocks = pdf.split(/Rank\s+Team\s+AUC-ROC\s+F1-Macro\s+AUC-ROC\s+F1-Macro/).slice(1,3);
    if (blocks.length !== 2 || !pdf.includes('Task 2.1: Islamic Knowledge')) throw new Error('Missing HalluScoring results');
    return checked(Object.entries(systems).map(([team,model]) => {
      const metrics: Record<string,number> = {};
      for (const [i,key] of ['questions','models'].entries()) {
        const line = blocks[i].split(/Table [34]:/)[0].split('\n').find(l => l.trim().split(/\s+/)[1] === team);
        const values = line?.trim().split(/\s+/).slice(2).map(Number);
        if (values?.length !== 4 || !values.every(Number.isFinite)) throw new Error('Missing HalluScoring row for ' + team);
        [metrics[key+'Dev'],metrics[key+'DevMacroF1'],metrics[key],metrics[key+'MacroF1']] = values;
      }
      if (team === 'Anhnamxtanh') {
        for (const [title,key] of [['Task 2.1: Islamic Knowledge','islamic'],['Task 2.2: General Culture','general']]) {
          const values = pdf.split(title).at(-1)?.match(/\n\s*1\s+Anhnamxtanh\s+([\d.]+)\s+([\d.]+)/);
          if (!values) throw new Error('Missing Task 2 results for ' + team);
          metrics[key+'Assisted'] = Number(values[1]);
          metrics[key+'Blind'] = Number(values[2]);
        }
      }
      return { model, models: team === 'REGLAT' ? ['MARBERTv2','CAMeLBERT-Mix','ARBERT'] : undefined,
        submitter: team.startsWith('Baseline_') ? 'Organizers' : team, setting:team, score:metrics.questions, metrics };
    }),9);
  },
};
export default board;
