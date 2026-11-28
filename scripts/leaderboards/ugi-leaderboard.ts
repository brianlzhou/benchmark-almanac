// UGI Leaderboard (DontPlanToEnd): evaluates 1,300+ language models on Uncensored General
// Intelligence (UGI), refusal willingness (W/10), natural intelligence (NatInt), world-model
// estimation, creative writing style, and political lean. Reads the Space's ugi-leaderboard-data.csv.
// Uses Test Date (NOT Release Date) for row.date, skips boolean flags and the duplicate #P column,
// and stores Active Parameters only when strictly smaller than Total Parameters (MoE models).
import { fetchText, parseCsv } from '../lib/util.ts';
import type { Leaderboard, LeaderboardRow } from './types.ts';

const FEED =
  'https://huggingface.co/spaces/DontPlanToEnd/UGI-Leaderboard/raw/main/ugi-leaderboard-data.csv';

const num = (v: string | undefined): number | undefined => {
  if (!v) return undefined;
  const t = v.trim().replace(/%$/, '');
  if (!t || /^nan|none$/i.test(t)) return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
};

function parseUsDate(v: string | undefined): string | undefined {
  if (!v) return undefined;
  const m = v.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return undefined;
  const mo = Number(m[1]);
  const dy = Number(m[2]);
  const yr = Number(m[3]);
  if (mo < 1 || mo > 12 || dy < 1 || dy > 31) return undefined;
  return `${yr}-${String(mo).padStart(2, '0')}-${String(dy).padStart(2, '0')}`;
}

const PART_COLS: readonly [string, string][] = [
  ['Writing ✍️', 'writing'],
  ['Sensitive Info', 'sensitiveInfo'],
  ['Hazardous', 'hazardous'],
  ['Entertainment', 'entertainment'],
  ['SocPol', 'socPol'],
  ['NatInt 💡', 'natInt'],
  ['Textbook', 'textbook'],
  ['Pop Culture', 'popCulture'],
  ['World Model', 'worldModel'],
  ['UGI non-W/10', 'ugiNonW10'],
  ['wm_recipe_percent_error_score', 'wmRecipeScore'],
  ['wm_geoguessr_mae_score', 'wmGeoguessrScore'],
  ['wm_weight_percent_error_score', 'wmWeightScore'],
  ['wm_music_mae_score', 'wmMusicScore'],
  ['Show Rec Score', 'showRecScore'],
];

const STAT_COLS: readonly [string, string][] = [
  ['W/10 👍', 'willingness'],
  ['W/10-Direct', 'willingnessDirect'],
  ['W/10-Adherence', 'willingnessAdherence'],
  ['Political Lean 📋', 'politicalLean'],
  ['dipl', 'dipl'],
  ['govt', 'govt'],
  ['econ', 'econ'],
  ['scty', 'scty'],
  ['Federal-Unitary', 'federalUnitary'],
  ['Democratic-Autocratic', 'democraticAutocratic'],
  ['Security-Freedom', 'securityFreedom'],
  ['Nationalism-Internationalism', 'nationalismInternationalism'],
  ['Militarist-Pacifist', 'militaristPacifist'],
  ['Assimilationist-Multiculturalist', 'assimilationistMulticulturalist'],
  ['Collectivize-Privatize', 'collectivizePrivatize'],
  ['Planned-LaissezFaire', 'plannedLaissezFaire'],
  ['Isolationism-Globalism', 'isolationismGlobalism'],
  ['Irreligious-Religious', 'irreligiousReligious'],
  ['Progressive-Traditional', 'progressiveTraditional'],
  ['Acceleration-Bioconservative', 'accelerationBioconservative'],
  ['Avg Thinking Chars', 'avgThinkingChars'],
  ['Repetition Interrupts', 'repetitionInterrupts'],
  ['Dialogue_Percentage', 'dialoguePct'],
  ['Verb_to_Noun_Ratio', 'verbToNounRatio'],
  ['Adjective_Adverb_Percentage', 'adjAdvPct'],
  ['Readability_Grade_Level', 'readabilityGrade'],
  ['avg_writing_style_score', 'writingStyleScore'],
  ['avg_length_error_pct', 'avgLengthErrorPct'],
  ['creative_writing_wc_exceeded_pct', 'wcExceededPct'],
  ['originality_score', 'originalityScore'],
  ['internal_semantic_redundancy', 'semanticRedundancy'],
  ['lexical_stuckness', 'lexicalStuckness'],
  ['Show Rec MAE', 'showRecMae'],
  ['Show Rec Std Dev Error', 'showRecStdErr'],
  ['Show Rec Correlation', 'showRecCorr'],
  ['wm_recipe_percent_error', 'wmRecipeErr'],
  ['wm_geoguesser_mae', 'wmGeoguessrMae'],
  ['wm_weight_percent_error', 'wmWeightErr'],
  ['wm_music_mae', 'wmMusicMae'],
  ['avg_nsfw_score', 'nsfwScore'],
  ['avg_dark_score', 'darkScore'],
];

const board: Leaderboard = {
  benchmark: 'ugi-leaderboard',
  url: 'https://huggingface.co/spaces/DontPlanToEnd/UGI-Leaderboard',
  feed: FEED,
  terms: 'Public Hugging Face Space leaderboard published by DontPlanToEnd.',
  parts: {
    writing: { name: 'Writing', unit: 'score', better: 'higher' },
    sensitiveInfo: { name: 'Sensitive Info', unit: 'score', better: 'higher' },
    hazardous: { name: 'Hazardous', unit: 'score', better: 'higher' },
    entertainment: { name: 'Entertainment', unit: 'score', better: 'higher' },
    socPol: { name: 'Social and Political', unit: 'score', better: 'higher' },
    natInt: { name: 'Natural Intelligence', unit: 'score', better: 'higher' },
    textbook: { name: 'Textbook', unit: 'score', better: 'higher' },
    popCulture: { name: 'Pop Culture', unit: 'score', better: 'higher' },
    worldModel: { name: 'World Model', unit: 'score', better: 'higher' },
    ugiNonW10: { name: 'UGI without Willingness', unit: 'score', better: 'higher' },
    wmRecipeScore: { name: 'World Model: Recipe', group: 'World Model', unit: 'score', better: 'higher' },
    wmGeoguessrScore: { name: 'World Model: GeoGuessr', group: 'World Model', unit: 'score', better: 'higher' },
    wmWeightScore: { name: 'World Model: Weight', group: 'World Model', unit: 'score', better: 'higher' },
    wmMusicScore: { name: 'World Model: Music', group: 'World Model', unit: 'score', better: 'higher' },
    showRecScore: { name: 'Show Recommendations', unit: 'score', better: 'higher' },
  },
  stats: {
    activeParams: { name: 'Active parameters', unit: 'billions', note: 'Active parameter count for mixture-of-experts models.' },
    willingness: { name: 'Willingness (W/10)', unit: 'score', note: 'Overall willingness to answer controversial prompts on a 0 to 10 scale.' },
    willingnessDirect: { name: 'Willingness: Direct', unit: 'score', note: 'Direct prompt compliance on a 0 to 10 scale.' },
    willingnessAdherence: { name: 'Willingness: Adherence', unit: 'score', note: 'System prompt adherence on a 0 to 10 scale.' },
    politicalLean: { name: 'Political lean', unit: '%', note: 'Signed political orientation score where negative leans left and positive leans right.' },
    dipl: { name: '8values: Diplomatic', unit: '%' },
    govt: { name: '8values: Civil', unit: '%' },
    econ: { name: '8values: Economic', unit: '%' },
    scty: { name: '8values: Societal', unit: '%' },
    federalUnitary: { name: '12axes: Federal vs Unitary', unit: '%' },
    democraticAutocratic: { name: '12axes: Democratic vs Autocratic', unit: '%' },
    securityFreedom: { name: '12axes: Security vs Freedom', unit: '%' },
    nationalismInternationalism: { name: '12axes: Nationalism vs Internationalism', unit: '%' },
    militaristPacifist: { name: '12axes: Militarist vs Pacifist', unit: '%' },
    assimilationistMulticulturalist: { name: '12axes: Assimilationist vs Multiculturalist', unit: '%' },
    collectivizePrivatize: { name: '12axes: Collectivize vs Privatize', unit: '%' },
    plannedLaissezFaire: { name: '12axes: Planned vs Laissez-Faire', unit: '%' },
    isolationismGlobalism: { name: '12axes: Isolationism vs Globalism', unit: '%' },
    irreligiousReligious: { name: '12axes: Irreligious vs Religious', unit: '%' },
    progressiveTraditional: { name: '12axes: Progressive vs Traditional', unit: '%' },
    accelerationBioconservative: { name: '12axes: Acceleration vs Bioconservative', unit: '%' },
    avgThinkingChars: { name: 'Average thinking characters', unit: 'count' },
    repetitionInterrupts: { name: 'Repetition interrupts', unit: 'count', better: 'lower' },
    dialoguePct: { name: 'Dialogue share', unit: '%' },
    verbToNounRatio: { name: 'Verb to noun ratio', unit: 'score' },
    adjAdvPct: { name: 'Adjective and adverb share', unit: '%' },
    readabilityGrade: { name: 'Readability grade level', unit: 'score' },
    writingStyleScore: { name: 'Writing style score', unit: 'score', better: 'higher' },
    avgLengthErrorPct: { name: 'Average length error', unit: '%', better: 'lower' },
    wcExceededPct: { name: 'Word count exceeded rate', unit: '%', better: 'lower' },
    originalityScore: { name: 'Originality score', unit: 'score', better: 'higher' },
    semanticRedundancy: { name: 'Internal semantic redundancy', unit: 'score', better: 'lower' },
    lexicalStuckness: { name: 'Lexical stuckness', unit: 'score', better: 'lower' },
    showRecMae: { name: 'Show recommendation MAE', unit: 'score', better: 'lower' },
    showRecStdErr: { name: 'Show recommendation std error', unit: 'score', better: 'lower' },
    showRecCorr: { name: 'Show recommendation correlation', unit: 'score', better: 'higher' },
    wmRecipeErr: { name: 'World Model recipe percent error', unit: '%', better: 'lower' },
    wmGeoguessrMae: { name: 'World Model GeoGuessr MAE', unit: 'score', better: 'lower', note: 'Mean distance error in kilometers on GeoGuessr estimation prompts.' },
    wmWeightErr: { name: 'World Model weight percent error', unit: '%', better: 'lower' },
    wmMusicMae: { name: 'World Model music release year MAE', unit: 'score', better: 'lower' },
    nsfwScore: { name: 'Average NSFW score', unit: 'score' },
    darkScore: { name: 'Average dark theme score', unit: 'score' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const csv = await fetchText(FEED);
    const records = parseCsv(csv);
    const rows: LeaderboardRow[] = [];
    for (const r of records) {
      const model = (r['author/model_name'] ?? '').trim();
      const score = num(r['UGI 🏆']);
      if (!model || score === undefined) continue;

      const totalParams = num(r['Total Parameters']);
      const activeParams = num(r['Active Parameters']);
      const date = parseUsDate(r['Test Date']);
      const link = (r['Model Link'] ?? '').trim().replace(/&amp;/g, '&');

      const metrics: Record<string, number> = {};
      if (totalParams !== undefined && activeParams !== undefined && activeParams > 0 && activeParams < totalParams) {
        metrics.activeParams = activeParams;
      }
      for (const [col, k] of PART_COLS) {
        const v = num(r[col]);
        if (v !== undefined) metrics[k] = v;
      }
      for (const [col, k] of STAT_COLS) {
        const v = num(r[col]);
        if (v !== undefined) metrics[k] = v;
      }

      rows.push({
        model,
        score,
        ...(date ? { date } : {}),
        ...(totalParams !== undefined && totalParams > 0 ? { params: totalParams } : {}),
        ...(link && /^https?:\/\/\S+$/.test(link) ? { link } : {}),
        ...(Object.keys(metrics).length ? { metrics } : {}),
      });
    }
    return rows;
  },
};

export default board;
