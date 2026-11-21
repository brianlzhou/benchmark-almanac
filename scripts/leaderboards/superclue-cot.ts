// SuperCLUE-CoT ranks entries by 总分 on its 总榜 sheet.
// The importer reads the results workbook published by SuperCLUE.
import { workbookBoard } from './agentclue.ts';

export default workbookBoard({
  benchmark: "superclue-cot",
  url: "https://www.superclueai.com/specialized/CoT",
  feed: "https://www.superclueai.com/data/specialized_list/CoT/2025%E5%B9%B44%E6%9C%88.xlsx",
  roundFolder: "CoT",
  sheet: "总榜",
  model: "模型",
  score: "总分",
  minimum: 36,
  parts: ["回答质量", "思维链与反思"],
  settings: ["使用方式"],
  metrics: {"reasoningLevel": "推理等级"},
  stats: { reasoningLevel: { name: 'Reasoning level', unit: 'count' } },
  details: [{"sheet": "回答质量", "model": "模型", "parts": ["解题过程", "最终答案"]}, {"sheet": "思维链与反思", "model": "模型", "parts": ["思维过程", "反思与调整", "创新性与灵活性"]}],
});
