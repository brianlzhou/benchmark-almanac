// MIEB lite: current default Mean(TaskType), scaled to the displayed 0-to-100 score.
// Only rows with a published whole-benchmark aggregate qualify. The feed also gives individual task scores, model metadata and context capacity.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://mteb-leaderboard-backend.hf.space/v1/benchmarks/MIEB%28lite%29/scores";
const board: Leaderboard = {
  benchmark: "mieb-lite",
  parts: {
    Any2AnyRetrieval: { name: 'Any-to-any retrieval', group: 'Task type' },
    ImageClassification: { name: 'Image classification', group: 'Task type' },
    ZeroShotClassification: { name: 'Zero-shot classification', group: 'Task type' },
    Compositionality: { name: 'Compositionality', group: 'Task type' },
    DocumentUnderstanding: { name: 'Document understanding', group: 'Task type' },
    VisionCentricQA: { name: 'Vision-centric QA', group: 'Task type' },
    Any2AnyMultilingualRetrieval: { name: 'Any-to-any multilingual retrieval', group: 'Task type' },
    ImageClustering: { name: 'Image clustering', group: 'Task type' },
    'VisualSTS(multi)': { name: 'Multilingual visual semantic textual similarity', group: 'Task type' },
    'VisualSTS(eng)': { name: 'English visual semantic textual similarity', group: 'Task type' },
    taskAROCocoOrder: { name: 'AROCocoOrder', group: 'Task' }, taskAROFlickrOrder: { name: 'AROFlickrOrder', group: 'Task' }, taskAROVisualAttribution: { name: 'AROVisualAttribution', group: 'Task' }, taskAROVisualRelation: { name: 'AROVisualRelation', group: 'Task' }, taskBLINKIT2IMultiChoice: { name: 'BLINKIT2IMultiChoice', group: 'Task' }, taskCIFAR100ZeroShot: { name: 'CIFAR100ZeroShot', group: 'Task' }, taskCIRRIT2IRetrieval: { name: 'CIRRIT2IRetrieval', group: 'Task' }, taskCUB200I2IRetrieval: { name: 'CUB200I2IRetrieval', group: 'Task' }, taskCVBenchCount: { name: 'CVBenchCount', group: 'Task' }, taskCVBenchDepth: { name: 'CVBenchDepth', group: 'Task' }, taskCVBenchDistance: { name: 'CVBenchDistance', group: 'Task' }, taskCVBenchRelation: { name: 'CVBenchRelation', group: 'Task' }, taskCountry211: { name: 'Country211', group: 'Task' }, taskCountry211ZeroShot: { name: 'Country211ZeroShot', group: 'Task' }, taskDTD: { name: 'DTD', group: 'Task' }, taskEuroSAT: { name: 'EuroSAT', group: 'Task' }, taskFER2013ZeroShot: { name: 'FER2013ZeroShot', group: 'Task' }, taskFGVCAircraftZeroShot: { name: 'FGVCAircraftZeroShot', group: 'Task' }, taskFashion200kI2TRetrieval: { name: 'Fashion200kI2TRetrieval', group: 'Task' }, taskFood101ZeroShot: { name: 'Food101ZeroShot', group: 'Task' }, taskGTSRB: { name: 'GTSRB', group: 'Task' }, taskHatefulMemesI2TRetrieval: { name: 'HatefulMemesI2TRetrieval', group: 'Task' }, taskImageCoDe: { name: 'ImageCoDe', group: 'Task' }, taskImageNetDog15Clustering: { name: 'ImageNetDog15Clustering', group: 'Task' }, taskInfoSeekIT2TRetrieval: { name: 'InfoSeekIT2TRetrieval', group: 'Task' }, taskNIGHTSI2IRetrieval: { name: 'NIGHTSI2IRetrieval', group: 'Task' }, taskOVENIT2TRetrieval: { name: 'OVENIT2TRetrieval', group: 'Task' }, taskOxfordPets: { name: 'OxfordPets', group: 'Task' }, taskOxfordPetsZeroShot: { name: 'OxfordPetsZeroShot', group: 'Task' }, taskPatchCamelyon: { name: 'PatchCamelyon', group: 'Task' }, taskRESISC45: { name: 'RESISC45', group: 'Task' }, taskRP2kI2IRetrieval: { name: 'RP2kI2IRetrieval', group: 'Task' }, taskSTS13VisualSTS: { name: 'STS13VisualSTS', group: 'Task' }, taskSTS15VisualSTS: { name: 'STS15VisualSTS', group: 'Task' }, taskSUN397: { name: 'SUN397', group: 'Task' }, taskStanfordCarsZeroShot: { name: 'StanfordCarsZeroShot', group: 'Task' }, taskTinyImageNetClustering: { name: 'TinyImageNetClustering', group: 'Task' }, taskVQA2IT2TRetrieval: { name: 'VQA2IT2TRetrieval', group: 'Task' }, taskVidoreDocVQARetrieval: { name: 'VidoreDocVQARetrieval', group: 'Task' }, taskVidoreInfoVQARetrieval: { name: 'VidoreInfoVQARetrieval', group: 'Task' }, taskVidoreShiftProjectRetrieval: { name: 'VidoreShiftProjectRetrieval', group: 'Task' }, taskVidoreSyntheticDocQAAIRetrieval: { name: 'VidoreSyntheticDocQAAIRetrieval', group: 'Task' }, taskVidoreTabfquadRetrieval: { name: 'VidoreTabfquadRetrieval', group: 'Task' }, taskVidoreTatdqaRetrieval: { name: 'VidoreTatdqaRetrieval', group: 'Task' }, taskVisualNewsI2TRetrieval: { name: 'VisualNewsI2TRetrieval', group: 'Task' }, 'taskVisualSTS-b-Multilingual': { name: 'VisualSTS-b-Multilingual', group: 'Task' }, taskVisualSTS17Multilingual: { name: 'VisualSTS17Multilingual', group: 'Task' }, taskWITT2IRetrieval: { name: 'WITT2IRetrieval', group: 'Task' }, taskWebQAT2ITRetrieval: { name: 'WebQAT2ITRetrieval', group: 'Task' }, taskWinoground: { name: 'Winoground', group: 'Task' }, taskXM3600T2IRetrieval: { name: 'XM3600T2IRetrieval', group: 'Task' },
  },
  stats: { zeroShotPct: { name: 'Zero-shot percentage', unit: '%' }, activeParamsB: { name: 'Active parameters', unit: 'billions' }, embeddingDim: { name: 'Embedding dimensions', unit: 'count' }, maxTokens: { name: 'Maximum tokens', unit: 'tokens' }, memoryUsageMb: { name: 'Memory usage', unit: 'count', note: 'Memory usage in megabytes.' }, meanTask: { name: 'Mean task score', unit: '%', better: 'higher' } },
  url: "https://mteb-leaderboard-backend.hf.space/v1/benchmarks/MIEB%28lite%29/scores",
  feed: FEED,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = await (async (): Promise<LeaderboardRow[]> => {
      const d=await fetchJson<any>(FEED);
      return d.rows.filter((r:any)=>typeof r.meanTaskType==='number').map((r:any) => {
        const metrics: Record<string, number> = {};
        for (const [key, value] of Object.entries(r.scoresByTaskType)) {
          if (typeof value === 'number') metrics[key] = value * 100;
        }
        for (const [name, value] of Object.entries(r.scoresByTask ?? {})) {
          if (typeof value !== 'number') continue;
          const key = 'task' + name;
          metrics[key] = value * 100;
          board.parts![key] = { name, group: 'Task' };
        }
        for (const key of ['zeroShotPct','activeParamsB','embeddingDim','maxTokens']) {
          if (typeof r[key] === 'number') metrics[key] = r[key];
        }
        if (typeof r.model.memoryUsageMb === 'number') metrics.memoryUsageMb = r.model.memoryUsageMb;
        if (typeof r.meanTask === 'number') metrics.meanTask = r.meanTask * 100;
        return {model:r.model.name.replace(/^[^/]+\//,''),score:r.meanTaskType*100,metrics,
          params:r.totalParamsB ?? undefined,open:r.model.openWeights ?? undefined,license:r.model.license ?? undefined};
      });
    })();
    if (!rows.length) throw new Error('No whole-benchmark scores found');
    const seen = new Set<string>();
    for (const r of rows) {
      if (!r.model || !Number.isFinite(r.score)) throw new Error('Invalid model or score');
      if (/^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model)) r.model += ' (snapshot unspecified)';
      const key = JSON.stringify([r.model, r.setting, r.harness]);
      if (seen.has(key)) throw new Error('Duplicate model configuration: ' + key);
      seen.add(key);
    }
    return rows;
  },
};
export default board;
