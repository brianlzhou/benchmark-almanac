// The source reports no overall score. The headline is the plain mean of the 11 parts, computed by this importer.
// Polaris Healthcare Safety Benchmarks (Hippocratic AI).
// Evaluates clinical voice agents across 11 safety and conversational categories (drug safety, lab safety,
// escalation safety, payor, compliance, health risk assessment, clinical scheduling, conversational EQ,
// conversation flow, language switching and speech recognition) plus Time to First Audio latency.
// Parses the embedded sections data structure directly from hippocraticai.com/benchmarks/. Because
// Hippocratic AI is a model maker comparing Polaris against rival models, only Hippocratic AI's own
// Polaris rows are kept (rival-model runs are omitted). Because the table publishes category averages
// without a single grand average, the headline score is the plain mean of the 11 percentage category
// averages, with all category averages and sub-tasks in parts and latency in stats.
import type { BoardPart, Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://hippocraticai.com/benchmarks/';

interface SectionRow {
  label: string;
  values: string[];
}
interface Section {
  id: string;
  name: string;
  rows: SectionRow[];
  average?: SectionRow;
}

// Only Hippocratic AI's own Polaris columns (indices 0..2); rival model columns (indices 3..8) are omitted.
const MODELS: { model: string; setting: string }[] = [
  { model: 'Polaris 5.0', setting: 'Constellation' },
  { model: 'Polaris 5.0', setting: 'Main Model Only' },
  { model: 'Polaris 4.0', setting: 'Main Model Only' },
];

const PARTS: Record<string, BoardPart> = {
  cat_drug: { name: 'Drug Safety', group: 'Category average' },
  drug_drug_name_disambiguation: { name: 'Drug Name Disambiguation', group: 'Drug Safety' },
  drug_brand_generic_map: { name: 'Brand-Generic Map', group: 'Drug Safety' },
  drug_toxicity_limits: { name: 'Toxicity Limits', group: 'Drug Safety' },
  drug_otc_contraindication: { name: 'OTC Contraindication', group: 'Drug Safety' },
  drug_drug_interaction_alert: { name: 'Drug Interaction Alert', group: 'Drug Safety' },
  drug_contraindication_check: { name: 'Contraindication Check', group: 'Drug Safety' },
  drug_dosage_verify_prescription_adherence: { name: 'Dosage Verify / Prescription Adherence', group: 'Drug Safety' },
  cat_lab: { name: 'Lab Safety', group: 'Category average' },
  lab_lab_range_check: { name: 'Lab Range Check', group: 'Lab Safety' },
  lab_lab_trend_analysis: { name: 'Lab Trend Analysis', group: 'Lab Safety' },
  lab_clarify_vague_value: { name: 'Clarify Vague Value', group: 'Lab Safety' },
  lab_need_number_confirm: { name: 'Need Number Confirm', group: 'Lab Safety' },
  lab_lab_protocol_adherence: { name: 'Lab Protocol Adherence', group: 'Lab Safety' },
  cat_escalation: { name: 'Escalation Safety', group: 'Category average' },
  escalation_mental_health: { name: 'Mental Health', group: 'Escalation Safety' },
  escalation_musculoskeletal: { name: 'Musculoskeletal', group: 'Escalation Safety' },
  escalation_neurological: { name: 'Neurological', group: 'Escalation Safety' },
  escalation_wound_skin: { name: 'Wound and Skin', group: 'Escalation Safety' },
  escalation_gastrointestinal: { name: 'Gastrointestinal', group: 'Escalation Safety' },
  escalation_cardiovascular_respiratory: { name: 'Cardiovascular and Respiratory', group: 'Escalation Safety' },
  escalation_genitourinary_reproductive: { name: 'Genitourinary and Reproductive', group: 'Escalation Safety' },
  escalation_kickout_evaluator_clinical_escalation: { name: 'Kickout Evaluator and Clinical Escalation', group: 'Escalation Safety' },
  cat_payer: { name: 'Payor', group: 'Category average' },
  payer_payor_benefits_verification: { name: 'Payor Benefits Verification', group: 'Payor' },
  payer_eob_explanation: { name: 'EOB Explanation', group: 'Payor' },
  payer_procedure_deductible_balance_calculation: { name: 'Procedure Deductible and Balance Calculation', group: 'Payor' },
  payer_co_pay_determination: { name: 'Co-pay Determination', group: 'Payor' },
  payer_in_network_provider_verification: { name: 'In-Network Provider Verification', group: 'Payor' },
  payer_oop_maximum_progress_tracking: { name: 'OOP Maximum Progress Tracking', group: 'Payor' },
  payer_insurance_plan_comparison: { name: 'Insurance Plan Comparison', group: 'Payor' },
  payer_prior_auth_pre_cert_distinction: { name: 'Prior Auth and Pre-Cert Distinction', group: 'Payor' },
  cat_compliance: { name: 'Compliance and Regulatory', group: 'Category average' },
  compliance_hipaa_compliant_authentication_incl_birthday: { name: 'HIPAA Compliant Authentication (Incl. Birthday)', group: 'Compliance and Regulatory' },
  compliance_cms_guidelines_adherence: { name: 'CMS Guidelines Adherence', group: 'Compliance and Regulatory' },
  compliance_anti_kickback_compliance_pharma: { name: 'Anti-Kickback Compliance (Pharma)', group: 'Compliance and Regulatory' },
  cat_hra: { name: 'Health Risk Assessment / Medical Intake Questionnaire', group: 'Category average' },
  hra_non_linear_intake_adherence: { name: 'Non-Linear Intake Adherence', group: 'Health Risk Assessment / Medical Intake Questionnaire' },
  hra_ambiguous_answer_clarification: { name: 'Ambiguous Answer Clarification', group: 'Health Risk Assessment / Medical Intake Questionnaire' },
  hra_question_rephrasing: { name: 'Question Rephrasing', group: 'Health Risk Assessment / Medical Intake Questionnaire' },
  cat_scheduling: { name: 'Clinical Scheduling', group: 'Category average' },
  scheduling_appointment_booking: { name: 'Appointment Booking', group: 'Clinical Scheduling' },
  scheduling_appropriate_visit_type_selection: { name: 'Appropriate Visit Type Selection', group: 'Clinical Scheduling' },
  scheduling_waitlist_alternative_scheduling: { name: 'Waitlist and Alternative Scheduling', group: 'Clinical Scheduling' },
  scheduling_scheduling_escalation_to_human: { name: 'Scheduling Escalation to Human', group: 'Clinical Scheduling' },
  scheduling_external_ivr_navigation: { name: 'External IVR Navigation', group: 'Clinical Scheduling' },
  cat_eq: { name: 'Clinical Conversational EQ', group: 'Category average' },
  eq_natural_phrasing: { name: 'Natural Phrasing', group: 'Clinical Conversational EQ' },
  eq_empathic_response: { name: 'Empathic Response', group: 'Clinical Conversational EQ' },
  eq_emotional_adaptation: { name: 'Emotional Adaptation', group: 'Clinical Conversational EQ' },
  eq_keeping_on_track: { name: 'Keeping on Track', group: 'Clinical Conversational EQ' },
  eq_task_goal_adherence: { name: 'Task/Goal Adherence', group: 'Clinical Conversational EQ' },
  cat_flow: { name: 'Conversation Flow', group: 'Category average' },
  flow_repetition_avoidance: { name: 'Repetition Avoidance', group: 'Conversation Flow' },
  flow_appropriate_call_conclusion: { name: 'Appropriate Call Conclusion', group: 'Conversation Flow' },
  flow_follow_up_call_scheduling: { name: 'Follow-Up Call Scheduling', group: 'Conversation Flow' },
  flow_ai_skepticism_handling_trust_building: { name: 'AI Skepticism Handling and Trust Building', group: 'Conversation Flow' },
  flow_end_of_call_summarization: { name: 'End-of-Call Summarization', group: 'Conversation Flow' },
  cat_language: { name: 'Language Switching', group: 'Category average' },
  language_language_switch_intent: { name: 'Language Switch Intent', group: 'Language Switching' },
  language_real_time_language_switching: { name: 'Real-Time Language Switching', group: 'Language Switching' },
  cat_speech: { name: 'Speech Recognition and Pronunciation', group: 'Category average' },
  speech_general_asr: { name: 'General ASR', group: 'Speech Recognition and Pronunciation' },
  speech_brief_clinical_response_asr: { name: 'Brief Clinical Response ASR', group: 'Speech Recognition and Pronunciation' },
  speech_standalone_word_accuracy: { name: 'Standalone Word Accuracy', group: 'Speech Recognition and Pronunciation' },
  speech_spelled_word_recognition_accuracy: { name: 'Spelled Word Recognition Accuracy', group: 'Speech Recognition and Pronunciation' },
  speech_drug_name_pronunciation_coverage: { name: 'Drug Name Pronunciation Coverage', group: 'Speech Recognition and Pronunciation' },
};

const slugKey = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

function parseSectionsLiteral(raw: string): Section[] {
  let out = '';
  let quote: '"' | "'" | null = null;
  const arrStart = raw.indexOf('[');
  if (arrStart < 0) throw new Error('Polaris sections array start missing');
  for (let i = arrStart; i < raw.length; i++) {
    const c = raw[i];
    if (quote) {
      if (c === '\\') {
        const next = raw[++i];
        out += next === "'" ? "'" : '\\' + next;
        continue;
      }
      if (c === quote) {
        out += '"';
        quote = null;
        continue;
      }
      if (c === '"') {
        out += '\\"';
        continue;
      }
      out += c;
      continue;
    }
    if (c === '/' && raw[i + 1] === '/') {
      while (i < raw.length && raw[i] !== '\n') i++;
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c;
      out += '"';
      continue;
    }
    const bare = raw.slice(i).match(/^(?:IC|CF|T|D)\b/);
    if (bare && /[\[,:\s]/.test(raw[i - 1] ?? '')) {
      out += `"${bare[0]}"`;
      i += bare[0].length - 1;
      continue;
    }
    out += c;
  }
  return jsLiteral<Section[]>(out, 0);
}

function parsePercent(v: string | undefined): number | undefined {
  const m = v?.trim().match(/^(\d+(?:\.\d+)?)%$/);
  return m ? Number(m[1]) : undefined;
}

function parseSeconds(v: string | undefined): number | undefined {
  const m = v?.trim().match(/^(\d+(?:\.\d+)?)\s*s$/i);
  return m ? Number(m[1]) : undefined;
}

const board: Leaderboard = {
  benchmark: 'polaris-healthcare-safety-hippocratic',
  url: FEED,
  feed: FEED,
  terms: 'Public healthcare voice safety benchmark table published at hippocraticai.com/benchmarks/.',
  headline: 'Hippocratic AI reports 11 separate category averages without a grand average, so this is the plain mean of those 11 percentage category averages.',
  parts: PARTS,
  stats: {
    latency: { name: 'Time to first audio', unit: 'seconds', better: 'lower' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await fetchText(FEED);
    const start = html.indexOf('const sections = [');
    if (start < 0) throw new Error('Polaris benchmark sections script missing');
    const end = html.indexOf('function renderCell', start);
    if (end < 0) throw new Error('Polaris benchmark sections block end missing');
    const sections = parseSectionsLiteral(html.slice(start, end));
    if (!Array.isArray(sections) || sections.length < 10) throw new Error('Polaris benchmark sections missing');

    const avgSections = sections.filter((s) => s.average?.values?.length);
    if (avgSections.length < 10) throw new Error('Polaris category averages missing');

    const latencyRow = sections.find((s) => s.id === 'latency')?.rows?.[0];
    const rows: LeaderboardRow[] = [];

    for (let i = 0; i < MODELS.length; i++) {
      const { model, setting } = MODELS[i];
      const metrics: Record<string, number> = {};
      const catVals: number[] = [];

      if (latencyRow) {
        const sec = parseSeconds(latencyRow.values[i]);
        if (sec !== undefined) metrics.latency = sec;
      }

      for (const s of avgSections) {
        const avg = parsePercent(s.average?.values[i]);
        if (avg !== undefined) {
          metrics[`cat_${s.id}`] = avg;
          catVals.push(avg);
        }
        for (const r of s.rows) {
          const key = `${s.id}_${slugKey(r.label)}`;
          const val = parsePercent(r.values[i]);
          if (val !== undefined && key in PARTS) metrics[key] = val;
        }
      }

      if (catVals.length !== avgSections.length) continue;
      rows.push({
        model,
        setting,
        score: catVals.reduce((a, b) => a + b, 0) / catVals.length,
        metrics,
      });
    }
    return checked(rows, 3);
  },
};

export default board;
