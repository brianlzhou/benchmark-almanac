// PerCoR measures Persian passage completion. The MIZAN JSONL feed provides overall and source-specific accuracies.
import type { Leaderboard } from './types.ts';
import { mizanAliases, mizanRows, mizanTerms } from './mizan-persian-llm-leaderboard.ts';

const feed = "https://huggingface.co/spaces/MCINext/mizan-llm-leaderboard/raw/main/leaderboard/boards_data/persian_csr.jsonl";
const fields = [
  "acc_strict",
  "donyaeeqtesad_acc",
  "isna_acc",
  "ninisite_article_acc",
  "virgool_4_acc",
  "khabaronline_acc",
  "digiato_acc",
  "doctoreto_acc",
  "sarzamindownload_acc",
  "hamgardi_acc",
  "bigbangpage_acc",
  "wiki_ahlolbait_acc",
  "virgool_3_acc",
  "virgool_2_acc",
  "virgool_1_acc",
  "hamshahrionline_acc",
  "tabnak_acc",
  "alibaba_acc",
  "digikala_mag_acc",
  "yjc_acc",
  "beytoote_acc",
  "asriran_acc",
  "ecoiran_acc",
  "hawzah_acc",
  "zoomit_acc",
  "wikipedia_acc",
  "namnak_acc",
  "khodro45_acc",
  "fidibo_acc",
  "newmiind_acc",
  "taaghche_acc",
  "motamem_acc",
  "varzesh3_acc",
  "mehrnews_acc",
  "tasnim_acc",
  "magerta_acc",
  "radiokodak_book_acc",
  "vipofilm_acc",
  "wikishia_acc",
  "voolak_acc",
  "farsroid_acc",
  "parsiday_acc",
  "soft98_acc",
  "ninisite_discussion_acc"
];
const sourceFields = Object.fromEntries(fields.map(k => [k,k]));
const board: Leaderboard = {
  benchmark: "percor", url: "https://mcinext-mizan-llm-leaderboard.hf.space/", feed, terms: mizanTerms, aliases: mizanAliases,
  parts: Object.fromEntries(fields.map(k => [k,k.replaceAll('_',' ')])),
  fetch: () => mizanRows(feed, "acc", sourceFields, 100, 45),
};
export default board;
