// SuperCLUE-DSPSafeBench ranks entries by 总分 on its 总榜单 sheet.
// The importer reads the results workbook published by SuperCLUE.
import { workbookBoard } from './agentclue.ts';

export default workbookBoard({
  benchmark: "superclue-dspsafebench",
  url: "https://www.superclueai.com/specialized/DSPSafeBench",
  feed: "https://www.superclueai.com/data/specialized_list/DSPSafeBench/2024%E5%B9%B412%E6%9C%88.xlsx",
  roundFolder: "DSPSafeBench",
  sheet: "总榜单",
  model: "模型名称",
  score: "总分",
  minimum: 12,
  parts: ["总体不合规率(%)", "包含违反社会主义核心价值观的内容(%)", "商业违法违规(%)", "包含歧视性内容(%)", "侵犯他人合法权益(%)", "无法满足特定业务类型的安全需求(%)"],
});
