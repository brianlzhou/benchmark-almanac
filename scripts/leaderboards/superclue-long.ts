// SuperCLUE-Long ranks entries by 总分 on its 总榜 sheet.
// The importer reads the results workbook published by SuperCLUE.
import { workbookBoard } from './agentclue.ts';

export default workbookBoard({
  benchmark: "superclue-long",
  url: "https://www.superclueai.com/specialized/Long",
  feed: "https://www.superclueai.com/data/specialized_list/Long/2024%E5%B9%B49%E6%9C%88.xlsx",
  roundFolder: "Long",
  sheet: "总榜",
  model: "模型名称",
  score: "总分",
  minimum: 10,
  parts: ["创作", "解析", "摘要"],
  settings: ["使用方式"],
  details: [{"sheet": "摘要", "model": "模型名称", "parts": ["摘要总分", "全文摘要", "线索摘要", "局部摘要"]}, {"sheet": "解析", "model": "模型名称", "parts": ["解析总分", "检索定位", "全文信息解读", "数理分析", "翻译", "多轮信息解读", "多文本信息处理"]}, {"sheet": "创作", "model": "模型名称", "parts": ["创作总分", "文本再创作", "内容创作助理", "风格化文本创作"]}],
});
